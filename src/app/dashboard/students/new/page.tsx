import { prisma } from "@/lib/db";
import { NewStudentForm } from "./new-student-form";

export default async function NewStudentPage() {
  const schools = await prisma.school.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add student</h1>
      <NewStudentForm schools={schools} />
    </div>
  );
}
