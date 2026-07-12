export type DisplayPlan = { title: string; content: string } | null;

export type DisplayLesson = {
  kind: "lesson";
  id: string;
  title: string; // student name
  scheduledAt: Date;
  durationMins: number;
  plan: DisplayPlan;
};

export type DisplayGroupClass = {
  kind: "groupClass";
  id: string;
  title: string; // class name
  dayOfWeek: number; // 0-6
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  plan: DisplayPlan;
};

export type DisplayOccurrence = {
  kind: "lesson" | "groupClass";
  id: string;
  title: string;
  start: Date;
  end: Date;
  plan: DisplayPlan;
};

function timeStringToDate(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Builds today's occurrences (dated Lessons + today's-weekday recurring GroupClasses), sorted by start time. */
export function buildTodayOccurrences(
  lessons: DisplayLesson[],
  groupClasses: DisplayGroupClass[],
  now: Date
): DisplayOccurrence[] {
  const occurrences: DisplayOccurrence[] = [];

  for (const lesson of lessons) {
    const start = lesson.scheduledAt;
    const end = new Date(start.getTime() + lesson.durationMins * 60_000);
    occurrences.push({ kind: "lesson", id: lesson.id, title: lesson.title, start, end, plan: lesson.plan });
  }

  for (const gc of groupClasses) {
    if (gc.dayOfWeek !== now.getDay()) continue;
    const start = timeStringToDate(now, gc.startTime);
    const end = timeStringToDate(now, gc.endTime);
    occurrences.push({ kind: "groupClass", id: gc.id, title: gc.title, start, end, plan: gc.plan });
  }

  return occurrences.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Resolves the "now" (in-progress) and "next" (soonest upcoming) occurrence for a Now/Next display. */
export function resolveNowNext(
  lessons: DisplayLesson[],
  groupClasses: DisplayGroupClass[],
  now: Date
): { now: DisplayOccurrence | null; next: DisplayOccurrence | null } {
  const occurrences = buildTodayOccurrences(lessons, groupClasses, now);

  const current = occurrences.find((o) => o.start <= now && now < o.end) ?? null;
  const next = occurrences.find((o) => o.start > now) ?? null;

  return { now: current, next };
}
