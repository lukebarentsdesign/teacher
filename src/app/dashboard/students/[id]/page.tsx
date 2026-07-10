import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LinkPayerForm } from "./link-payer-form";
import { NewSubscriptionForm } from "./new-subscription-form";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      school: true,
      payerLinks: { include: { payer: true } },
      subscriptions: { include: { payer: true }, orderBy: { startDate: "desc" } },
    },
  });

  if (!student) notFound();

  const allPayers = await prisma.payer.findMany({ orderBy: { name: "asc" } });
  const linkedPayerIds = new Set(student.payerLinks.map((link) => link.payerId));
  const unlinkedPayers = allPayers.filter((payer) => !linkedPayerIds.has(payer.id));

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{student.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {student.discipline} · {student.source} · {student.school?.name ?? "Home student"}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Payers</h2>
        {student.payerLinks.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">No payer linked yet.</p>
        ) : (
          <ul className="mb-4 space-y-1 text-sm text-neutral-700">
            {student.payerLinks.map((link) => (
              <li key={link.id}>
                {link.payer.name} {link.isPrimary && <span className="text-neutral-400">(primary)</span>}
              </li>
            ))}
          </ul>
        )}
        {unlinkedPayers.length > 0 && (
          <LinkPayerForm studentId={student.id} payers={unlinkedPayers} />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Subscriptions</h2>
        {student.subscriptions.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">No subscription yet.</p>
        ) : (
          <div className="mb-4 overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Payer</th>
                  <th className="px-4 py-3 font-medium">Billing model</th>
                  <th className="px-4 py-3 font-medium">Annual fee</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {student.subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-900">
                      <Link
                        href={`/dashboard/subscriptions/${sub.id}`}
                        className="hover:underline"
                      >
                        {sub.payer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{sub.billingModel}</td>
                    <td className="px-4 py-3 text-neutral-500">£{sub.annualFee.toString()}</td>
                    <td className="px-4 py-3 text-neutral-500">{sub.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {student.payerLinks.length > 0 && (
          <NewSubscriptionForm studentId={student.id} payers={student.payerLinks.map((l) => l.payer)} />
        )}
      </section>
    </div>
  );
}
