import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { LessonNoteForm } from "./lesson-note-form";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const lesson = await prisma.lesson.findFirst({
    where: { id, teacherId: session!.user.id },
    include: { student: true, note: true },
  });

  if (!lesson) notFound();

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
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Lesson note</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Visible to the guardian, and to the student too if they have independent access.
        </p>
        <LessonNoteForm lessonId={lesson.id} initialContent={lesson.note?.content ?? ""} />
      </section>
    </div>
  );
}
