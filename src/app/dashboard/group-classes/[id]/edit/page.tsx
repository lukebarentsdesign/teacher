import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { EditGroupClassForm } from "./edit-group-class-form";

export default async function EditGroupClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const groupClass = await prisma.groupClass.findFirst({
    where: { id, teacherId: session!.user.id },
  });
  if (!groupClass) notFound();

  const [rooms, subjects] = await Promise.all([
    prisma.room.findMany({ where: { locationId: groupClass.locationId }, orderBy: { label: "asc" } }),
    prisma.subject.findMany({ where: { teacherId: session!.user.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href={`/dashboard/group-classes/${groupClass.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          ← Back to {groupClass.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Edit group class</h1>
      </div>
      <EditGroupClassForm
        groupClassId={groupClass.id}
        name={groupClass.name}
        discipline={groupClass.discipline}
        dayOfWeek={groupClass.dayOfWeek}
        startTime={groupClass.startTime}
        endTime={groupClass.endTime}
        roomId={groupClass.roomId}
        subjectId={groupClass.subjectId}
        rooms={rooms}
        subjects={subjects}
      />
    </div>
  );
}
