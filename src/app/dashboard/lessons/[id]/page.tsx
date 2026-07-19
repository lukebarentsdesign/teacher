import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { LessonNoteForm } from "./lesson-note-form";
import { AttendanceButtons } from "./attendance-buttons";
import { AddOnBookings } from "./addon-bookings";
import { LessonSessionPlanPanel } from "../../session-plans/lesson-session-plan-panel";
import { MeetingUrlForm } from "./meeting-url-form";
import { CoverAssignmentPanel } from "./cover-assignment-panel";
import { LoneWorkerPanel } from "./lone-worker-panel";
import { hasModule } from "@/lib/modules";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const groupTeachingModuleEnabled = await hasModule(session!.user.id, "GROUP_TEACHING");

  const lesson = await prisma.lesson.findFirst({
    where: { id, teacherId: session!.user.id },
    include: {
      student: true,
      note: true,
      sessionPlan: true,
      location: true,
      addOnBookings: { include: { addOn: true }, orderBy: { createdAt: "asc" } },
      feedback: { include: { payer: true }, orderBy: { submittedAt: "desc" } },
      coverAssignments: { include: { coveringInstructor: true }, orderBy: { createdAt: "desc" } },
      loneWorkerCheckIn: true,
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

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session!.user.id } });
  const orgMembers = teacher.organisationId
    ? await prisma.teacher.findMany({
        where: { organisationId: teacher.organisationId, id: { not: session!.user.id } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];

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
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Meeting link</h2>
        {lesson.location.locationType === "ONLINE" && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Online lesson with an under-18 student: enable your video platform&apos;s own waiting
            room and &quot;host must be present&quot; setting, and consider recording to your own
            storage with a sensible retention period. This is guidance only — Learnio doesn&apos;t
            control or enforce it (MVP uses your own meeting link, not a platform-created one).
          </p>
        )}
        <MeetingUrlForm lessonId={lesson.id} initialUrl={lesson.meetingUrl ?? ""} />
      </section>

      {lesson.location.locationType === "STUDENT_HOME" && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-neutral-900">Lone-worker check-in</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Home visit — check in on arrival, check out on leaving. If you don&apos;t check out
            within {lesson.loneWorkerCheckIn?.graceMinutes ?? 15} minutes of the expected end time,
            your emergency contact gets an automated alert next time you have the app open.
          </p>
          <LoneWorkerPanel
            lessonId={lesson.id}
            checkIn={
              lesson.loneWorkerCheckIn
                ? {
                    checkedInAt: lesson.loneWorkerCheckIn.checkedInAt?.toISOString() ?? null,
                    checkedOutAt: lesson.loneWorkerCheckIn.checkedOutAt?.toISOString() ?? null,
                  }
                : null
            }
            hasEmergencyContact={!!teacher.emergencyContactEmail}
          />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Attendance</h2>
        <p className="mb-3 text-xs text-neutral-500">
          &quot;Present&quot; posts a billed lesson entry. &quot;Absent&quot; is free (a banked
          make-up credit, no cash impact) unless a cancellation policy applies — set the
          &quot;Informed&quot; time to when the guardian actually told you (leave blank for a
          same-time no-show) so notice is calculated correctly.
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
          moduleEnabled={groupTeachingModuleEnabled}
        />
      </section>

      {lesson.feedback.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-neutral-900">Feedback</h2>
          <div className="space-y-2">
            {lesson.feedback.map((f) => (
              <div key={f.id} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-neutral-900">
                  {"★".repeat(f.rating)}
                  {"☆".repeat(5 - f.rating)}
                  <span className="ml-2 text-xs font-normal text-neutral-500">{f.payer.name}</span>
                </p>
                {f.comments && <p className="mt-1 text-sm text-neutral-700">{f.comments}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {orgMembers.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-neutral-900">Cover</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Doesn&apos;t transfer ownership of this lesson — just a record of who actually taught it.
          </p>
          <CoverAssignmentPanel
            lessonId={lesson.id}
            orgMembers={orgMembers}
            covers={lesson.coverAssignments.map((c) => ({
              id: c.id,
              reason: c.reason,
              coveringInstructorName: c.coveringInstructor.name,
            }))}
          />
        </section>
      )}
    </div>
  );
}
