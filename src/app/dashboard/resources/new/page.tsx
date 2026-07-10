import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewResourceForm } from "./new-resource-form";

export default async function NewResourcePage() {
  const session = await auth();
  const students = await prisma.student.findMany({
    where: { teacherId: session!.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add resource</h1>
      <NewResourceForm students={students} />
    </div>
  );
}
