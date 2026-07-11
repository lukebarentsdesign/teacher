"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

type LessonEvent = { id: string; title: string; start: string; end: string; color: string };
type RecurringGroupClassEvent = { id: string; title: string; daysOfWeek: number[]; startTime: string; endTime: string };

export function TeacherCalendar({
  lessonEvents,
  groupClassEvents,
}: {
  lessonEvents: LessonEvent[];
  groupClassEvents: RecurringGroupClassEvent[];
}) {
  const events = [
    ...lessonEvents.map((e) => ({ ...e, backgroundColor: e.color, borderColor: e.color })),
    ...groupClassEvents.map((e) => ({ ...e, backgroundColor: "#2563eb", borderColor: "#2563eb" })),
  ];

  return (
    <div className="rounded-xl bg-white p-2 shadow-sm">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" }}
        events={events}
        height="auto"
        editable={false}
        selectable={false}
      />
    </div>
  );
}
