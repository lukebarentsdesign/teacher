import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewStudentForm } from "./new-student-form";

export default async function NewStudentPage() {
  const session = await auth();

  const links = await prisma.teacherSchoolLink.findMany({
    where: { teacherId: session!.user.id },
    include: { school: true },
  });
  const schools = links.map((link) => link.school);

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add student</h1>
      <NewStudentForm schools={schools} />
    </div>
  );
}
