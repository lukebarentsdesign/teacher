import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { previewFixedTimetable, previewFluidTimetable } from "@/lib/timetable";
import { availabilityArraySchema } from "@/lib/schedule-json";
import { ConfirmTimetableForm } from "./confirm-timetable-form";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function TimetablePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; linkId?: string; slots?: string }>;
}) {
  const { studentId, linkId, slots } = await searchParams;
  const session = await auth();

  if (!studentId || !linkId || !slots || !session?.user?.id) notFound();

  const [student, link] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.teacherSchoolLink.findUnique({ where: { id: linkId }, include: { school: true } }),
  ]);

  if (!student || !link || !link.school.termStart || !link.school.termEnd) notFound();

  const chosenSlots = availabilityArraySchema.parse(JSON.parse(slots));

  const result =
    link.schedulingMode === "FIXED"
      ? await previewFixedTimetable(session.user.id, link.school.termStart, link.school.termEnd, chosenSlots[0])
      : await previewFluidTimetable(session.user.id, link.school.termStart, link.school.termEnd, chosenSlots);

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
          These clash with an existing lesson for you and will be skipped:
          <ul className="mt-2 list-inside list-disc">
            {result.conflicts.map((lesson, i) => (
              <li key={i}>
                {lesson.scheduledAt.toLocaleDateString("en-GB")}{" "}
                {lesson.scheduledAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </li>
            ))}
          </ul>
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

      <ConfirmTimetableForm
        studentId={studentId}
        teacherId={session.user.id}
        schoolId={link.schoolId}
        linkId={linkId}
        slots={slots}
        disabled={result.clean.length === 0}
      />
    </div>
  );
}
