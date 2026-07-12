import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { EditStudentForm } from "../edit-student-form";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const student = await prisma.student.findFirst({ where: { id, teacherId: session!.user.id } });
  if (!student) notFound();

  const links = await prisma.teacherSchoolLink.findMany({
    where: { teacherId: session!.user.id },
    include: { school: true },
  });
  const schools = Array.from(
    new Map(links.map((l) => [l.school.id, { id: l.school.id, name: l.school.name }])).values()
  );

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/dashboard/students/${student.id}`} className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to {student.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Edit student</h1>
      </div>
      <EditStudentForm
        student={{
          id: student.id,
          name: student.name,
          dob: student.dob ? student.dob.toISOString().slice(0, 10) : null,
          discipline: student.discipline,
          source: student.source,
          schoolId: student.schoolId,
        }}
        schools={schools}
      />
    </div>
  );
}
