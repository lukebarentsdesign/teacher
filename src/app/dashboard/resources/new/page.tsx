import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewResourceForm } from "./new-resource-form";
import { hasModule } from "@/lib/modules";

export default async function NewResourcePage() {
  const session = await auth();

  if (!(await hasModule(session!.user.id, "CURRICULUM"))) {
    return (
      <div className="max-w-lg space-y-3">
        <h1 className="text-2xl font-semibold text-neutral-900">New resource</h1>
        <p className="text-sm text-neutral-500">
          The Curriculum &amp; content module isn&apos;t enabled on this account — get in touch
          if you&apos;d like it switched on.
        </p>
      </div>
    );
  }

  const [students, existingFolders] = await Promise.all([
    prisma.student.findMany({
      where: { teacherId: session!.user.id },
      orderBy: { name: "asc" },
    }),
    prisma.resource.findMany({
      where: { teacherId: session!.user.id, folder: { not: null } },
      distinct: ["folder"],
      orderBy: { folder: "asc" },
      select: { folder: true },
    }),
  ]);
  const folders = existingFolders.map((resource) => resource.folder).filter((folder): folder is string => Boolean(folder));

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add resource</h1>
      <NewResourceForm students={students} folders={folders} />
    </div>
  );
}