import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewLinkForm } from "./new-link-form";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) notFound();

  const links = await prisma.teacherSchoolLink.findMany({
    where: { schoolId: id, teacherId: session?.user?.id },
    include: { teacher: true },
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{school.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {school.address ?? "No address on file"} · Invoicing: {school.invoicingTarget}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Your engagement here</h2>
        {links.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">
            No availability set up yet — add it below so the timetable generator has slots to work with.
          </p>
        ) : (
          <div className="mb-6 space-y-3">
            {links.map((link) => (
              <div key={link.id} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm text-neutral-900">
                  {link.schedulingMode} scheduling · {link.taxHandling.replace("_", " ")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(link.availability as { dayOfWeek: number; startTime: string; endTime: string }[]).map(
                    (slot, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600"
                      >
                        {DAY_LABELS[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <NewLinkForm schoolId={school.id} />
      </section>
    </div>
  );
}
