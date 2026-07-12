import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { EditSchoolForm } from "./edit-school-form";

export default async function EditSchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const link = await prisma.teacherSchoolLink.findFirst({
    where: { schoolId: id, teacherId: session!.user.id },
  });
  if (!link) notFound();

  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) notFound();

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/dashboard/schools/${school.id}`} className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to {school.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Edit school</h1>
      </div>
      <EditSchoolForm
        school={{
          id: school.id,
          name: school.name,
          address: school.address,
          invoicingTarget: school.invoicingTarget,
          termStart: school.termStart ? school.termStart.toISOString().slice(0, 10) : null,
          termEnd: school.termEnd ? school.termEnd.toISOString().slice(0, 10) : null,
          logoUrl: school.logoUrl,
          primaryColor: school.primaryColor,
          secondaryColor: school.secondaryColor,
        }}
      />
    </div>
  );
}
