import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { previewFixedTimetable, previewFluidTimetable } from "@/lib/timetable";
import { availabilityArraySchema } from "@/lib/schedule-json";
import { deriveGhostSlots, projectSlotOntoWeek, slotDurationMins } from "@/lib/scheduling";
import { hasAcceptedCurrentContract } from "@/lib/contracts";
import { ConfirmTimetableForm } from "./confirm-timetable-form";
import { GhostCalendar } from "./ghost-calendar";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function TimetablePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; linkId?: string; slots?: string; roomId?: string }>;
}) {
  const { studentId, linkId, slots, roomId } = await searchParams;
  const session = await auth();

  if (!studentId || !linkId || !slots || !session?.user?.id) notFound();

  const [student, link] = await Promise.all([
    prisma.student.findFirst({ where: { id: studentId, teacherId: session.user.id } }),
    prisma.teacherSchoolLink.findFirst({
      where: { id: linkId, teacherId: session.user.id },
      include: { school: true },
    }),
  ]);

  if (!student || !link || !link.school.termStart || !link.school.termEnd) notFound();

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session.user.id } });
  const proposedColor = link.school.primaryColor ?? teacher.personalBrandColor ?? "#171717";

  const chosenSlots = availabilityArraySchema.parse(JSON.parse(slots));

  const result =
    link.schedulingMode === "FIXED"
      ? await previewFixedTimetable(session.user.id, link.school.termStart, link.school.termEnd, chosenSlots[0], roomId)
      : await previewFluidTimetable(session.user.id, link.school.termStart, link.school.termEnd, chosenSlots, roomId);

  const pastLessons = await prisma.lesson.findMany({
    where: { studentId: student.id, status: "HELD" },
    orderBy: { scheduledAt: "desc" },
    take: 200,
    select: { scheduledAt: true, durationMins: true },
  });
  const ghostSlots = deriveGhostSlots(pastLessons);
  const weekOf = result.clean[0]?.scheduledAt ?? new Date();
  const ghostEvents = ghostSlots.map((slot, i) => {
    const start = projectSlotOntoWeek(slot, weekOf);
    const end = new Date(start.getTime() + (slotDurationMins(slot) || 30) * 60_000);
    return { id: `ghost-${i}`, title: "Past slot", start: start.toISOString(), end: end.toISOString() };
  });
  const proposedEvents = result.clean.map((lesson, i) => ({
    id: `proposed-${i}`,
    title: student.name,
    start: lesson.scheduledAt.toISOString(),
    end: new Date(lesson.scheduledAt.getTime() + lesson.durationMins * 60_000).toISOString(),
    color: proposedColor,
  }));
  const conflictEvents = result.conflicts.map((lesson, i) => ({
    id: `conflict-${i}`,
    title: lesson.reason === "ROOM" ? "Room conflict" : "Clashes with your lesson",
    start: lesson.scheduledAt.toISOString(),
    end: new Date(lesson.scheduledAt.getTime() + lesson.durationMins * 60_000).toISOString(),
  }));

  // Gate on the student's active subscription's payer having accepted the current contract.
  const activeSubscription = await prisma.subscription.findFirst({
    where: { studentId: student.id, status: "ACTIVE" },
    include: { payer: true },
  });
  const contractBlocked = activeSubscription
    ? !(await hasAcceptedCurrentContract(activeSubscription.payerId, session.user.id))
    : false;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Timetable preview — {student.name}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {link.school.name} · {link.schedulingMode} · {result.clean.length} lesson
          {result.clean.length === 1 ? "" : "s"} to create
          {result.conflicts.length > 0 && `, ${result.conflicts.length} conflict(s) skipped`}
        </p>
      </div>

      {result.conflicts.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          These clash and will be skipped:
          <ul className="mt-2 list-inside list-disc">
            {result.conflicts.map((lesson, i) => (
              <li key={i}>
                {lesson.scheduledAt.toLocaleDateString("en-GB")}{" "}
                {lesson.scheduledAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} —{" "}
                {lesson.reason === "ROOM" ? "room already booked" : "clashes with your own lesson"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ghostSlots.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">
            {student.name}&apos;s past lesson slots, ghosted onto this week
          </p>
          <GhostCalendar ghostEvents={ghostEvents} proposedEvents={proposedEvents} conflictEvents={conflictEvents} />
        </div>
      )}

      <div className="max-h-96 overflow-y-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-neutral-200 bg-white text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Day</th>
              <th className="px-4 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {result.clean.map((lesson, i) => (
              <tr key={i} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 text-neutral-900">
                  {lesson.scheduledAt.toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3 text-neutral-500">{DAY_LABELS[lesson.scheduledAt.getDay()]}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {lesson.scheduledAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contractBlocked && activeSubscription && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          {activeSubscription.payer.name} hasn&apos;t accepted the current contract yet — lessons
          can&apos;t be booked until they do. Their microsite access code is on the{" "}
          <a href="/dashboard/payers" className="underline">
            payers page
          </a>
          .
        </div>
      )}

      <ConfirmTimetableForm
        studentId={studentId}
        schoolId={link.schoolId}
        linkId={linkId}
        slots={slots}
        roomId={roomId}
        disabled={result.clean.length === 0 || contractBlocked}
      />
    </div>
  );
}
