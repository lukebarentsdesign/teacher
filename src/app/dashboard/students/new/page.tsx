import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { StudentWizard } from "./student-wizard";

export default async function NewStudentPage() {
  const session = await auth();

  const links = await prisma.teacherLocationLink.findMany({
    where: { teacherId: session!.user.id },
    include: { location: true },
  });
  // De-dupe teaching locations (a teacher may have one link per location, but be defensive).
  const locations = Array.from(
    new Map(links.map((link) => [link.location.id, { id: link.location.id, name: link.location.name }])).values()
  );

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add student</h1>
      <StudentWizard locations={locations} />
    </div>
  );
}
