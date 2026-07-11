import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { StudentWizard } from "./student-wizard";

export default async function NewStudentPage() {
  const session = await auth();

  const links = await prisma.teacherSchoolLink.findMany({
    where: { teacherId: session!.user.id },
    include: { school: true },
  });
  // De-dupe schools (a teacher may have one link per school, but be defensive).
  const schools = Array.from(
    new Map(links.map((link) => [link.school.id, { id: link.school.id, name: link.school.name }])).values()
  );

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add student</h1>
      <StudentWizard schools={schools} />
    </div>
  );
}
