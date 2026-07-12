import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { LessonNoteForm } from "./lesson-note-form";
import { AttendanceButtons } from "./attendance-buttons";
import { AddOnBookings } from "./addon-bookings";
import { LessonSessionPlanPanel } from "../../session-plans/lesson-session-plan-panel";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const lesson = await prisma.lesson.findFirst({
    where: { id, teacherId: session!.user.id },
    include: {
      student: true,
      note: true,
      sessionPlan: true,
      addOnBookings: { include: { addOn: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!lesson) notFound();

  const addOns = await prisma.addOn.findMany({
    where: { teacherId: session!.user.id, archivedAt: null },
    orderBy: { name: "asc" },
  });

  const sessionPlanTemplates = await prisma.sessionPlanTemplate.findMany({
    where: { teacherId: session!.user.id },
    orderBy: { title: "asc" },
  });

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{lesson.student.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {lesson.scheduledAt.toLocaleDateString("en-GB")}{" "}
          {lesson.scheduledAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} ·{" "}
          {lesson.status}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Attendance</h2>
        <p className="mb-3 text-xs text-neutral-500">
          &quot;Present&quot; posts a billed lesson entry; &quot;Absent, make-up owed&quot; banks a
          make-up credit with no cash impact.
        </p>
        <AttendanceButtons lessonId={lesson.id} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Add-ons</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Extras like instrument hire or sheet music, billed separately from the subscription.
        </p>
        <AddOnBookings
          lessonId={lesson.id}
          addOns={addOns.map((a) => ({
            id: a.id,
            name: a.name,
            price: a.price.toString(),
            chargeUnit: a.chargeUnit,
          }))}
          bookings={lesson.addOnBookings.map((b) => ({
            id: b.id,
            quantity: b.quantity,
            priceAtTime: b.priceAtTime.toString(),
            addOn: { name: b.addOn.name },
          }))}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Lesson note</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Visible to the guardian, and to the student too if they have independent access.
        </p>
        <LessonNoteForm lessonId={lesson.id} initialContent={lesson.note?.content ?? ""} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Session plan</h2>
        <p className="mb-3 text-xs text-neutral-500">
          What&apos;s happening in this lesson — distinct from the private note above. Publish it to
          show on this location&apos;s Now/Next display screen.
        </p>
        <LessonSessionPlanPanel
          lessonId={lesson.id}
          plan={
            lesson.sessionPlan
              ? {
                  id: lesson.sessionPlan.id,
                  title: lesson.sessionPlan.title,
                  content: lesson.sessionPlan.content,
                  publishedAt: lesson.sessionPlan.publishedAt?.toISOString() ?? null,
                }
              : null
          }
          templates={sessionPlanTemplates}
        />
      </section>
    </div>
  );
}
