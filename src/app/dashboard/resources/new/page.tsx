import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewResourceForm } from "./new-resource-form";

export default async function NewResourcePage() {
  const session = await auth();
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