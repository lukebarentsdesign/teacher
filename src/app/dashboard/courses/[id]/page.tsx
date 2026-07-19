import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";
import { CourseItemForm } from "./course-item-form";
import { DeleteItemButton } from "./delete-item-button";
import { PublishToggle } from "./publish-toggle";
import { RecordPurchaseForm } from "./record-purchase-form";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const moduleEnabled = await hasModule(session!.user.id, "CURRICULUM");

  const course = await prisma.course.findFirst({
    where: { id, teacherId: session!.user.id },
    include: {
      items: { orderBy: { order: "asc" }, include: { lessonType: true } },
      purchases: { include: { payer: true }, orderBy: { purchasedAt: "desc" } },
    },
  });
  if (!course) notFound();

  const [lessonTypes, allPayers] = await Promise.all([
    prisma.lessonType.findMany({
      where: { teacherId: session!.user.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.payer.findMany({ where: { teacherId: session!.user.id }, orderBy: { name: "asc" } }),
  ]);

  const purchasedPayerIds = new Set(course.purchases.map((p) => p.payerId));
  const availablePayers = allPayers.filter((p) => !purchasedPayerIds.has(p.id));

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/dashboard/courses" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to courses
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{course.title}</h1>
            <p className="mt-1 text-sm text-neutral-500">{course.price ? `£${course.price.toString()}` : "Free"}</p>
            {course.description && <p className="mt-2 text-sm text-neutral-600">{course.description}</p>}
          </div>
          <PublishToggle courseId={course.id} isPublished={course.isPublished} />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Items</h2>
        {course.items.length === 0 ? (
          <p className="mb-3 text-sm text-neutral-500">No items yet.</p>
        ) : (
          <ul className="mb-3 space-y-2">
            {course.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-neutral-800">{item.title}</span>
                  <span className="ml-2 text-xs text-neutral-500">
                    {item.mediaType}
                    {item.lessonType ? ` · ${item.lessonType.name}` : ""}
                  </span>
                  {item.description && <p className="text-xs text-neutral-500">{item.description}</p>}
                </div>
                <DeleteItemButton itemId={item.id} courseId={course.id} />
              </li>
            ))}
          </ul>
        )}
        {moduleEnabled ? (
          <CourseItemForm courseId={course.id} lessonTypes={lessonTypes} />
        ) : (
          <p className="text-sm text-neutral-500">
            The Curriculum &amp; content module isn&apos;t enabled on this account, so new items
            can&apos;t be added — get in touch if you&apos;d like it switched on.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Purchases</h2>
        {course.purchases.length === 0 ? (
          <p className="mb-3 text-sm text-neutral-500">No purchases recorded yet.</p>
        ) : (
          <ul className="mb-3 space-y-1.5 text-sm">
            {course.purchases.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
                <span className="text-neutral-800">{p.payer.name}</span>
                <span className="text-xs text-neutral-500">
                  £{p.amountPaid.toString()} · {p.purchasedAt.toLocaleDateString("en-GB")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <RecordPurchaseForm courseId={course.id} payers={availablePayers} defaultAmount={course.price?.toString() ?? ""} />
      </section>
    </div>
  );
}
