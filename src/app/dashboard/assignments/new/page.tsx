import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewAssignmentForm } from "./new-assignment-form";
import { hasModule } from "@/lib/modules";

export default async function NewAssignmentPage() {
  const session = await auth();

  if (!(await hasModule(session!.user.id, "CURRICULUM"))) {
    return (
      <div className="max-w-lg space-y-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Add assignment</h1>
        <p className="text-sm text-neutral-500">
          The Curriculum &amp; content module isn&apos;t enabled on this account — get in touch
          if you&apos;d like it switched on.
        </p>
      </div>
    );
  }

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
