import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewAssignmentForm } from "./new-assignment-form";

export default async function NewAssignmentPage() {
  const session = await auth();
  const [students, resources] = await Promise.all([
    prisma.student.findMany({ where: { teacherId: session!.user.id }, orderBy: { name: "asc" } }),
    prisma.resource.findMany({ where: { teacherId: session!.user.id }, orderBy: { title: "asc" } }),
  ]);

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add assignment</h1>
      <NewAssignmentForm students={students} resources={resources} />
    </div>
  );
}
