import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewPromoCodeForm } from "./new-promo-code-form";
import { ApplyPromoCodeForm } from "./apply-promo-code-form";
import { DeletePromoCodeButton } from "./delete-promo-code-button";
import { hasModule } from "@/lib/modules";

export default async function PromoCodesPage() {
  const session = await auth();
  const moduleEnabled = await hasModule(session!.user.id, "COMMERCE");

  const [promoCodes, lessonTypes, subscriptions] = await Promise.all([
    prisma.promoCode.findMany({
      where: { teacherId: session!.user.id },
      include: { lessonType: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lessonType.findMany({
      where: { teacherId: session!.user.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.subscription.findMany({
      where: { student: { teacherId: session!.user.id }, status: "ACTIVE" },
      include: { student: true, payer: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Promo codes</h1>
        <p className="mt-1 text-sm text-neutral-500">
          One-time discounts applied manually to a subscription — posts a credit to the ledger, same
          as any other manual correction.
        </p>
      </div>

      {promoCodes.length === 0 ? (
        <p className="text-sm text-neutral-500">No promo codes yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {promoCodes.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-mono font-medium text-neutral-900">{p.code}</p>
                <p className="text-xs text-neutral-500">
                  {p.discountType === "PERCENT" ? `${p.value}% off` : `£${p.value.toString()} off`}
                  {p.lessonType ? ` · ${p.lessonType.name}` : ""}
                  {p.usageLimit ? ` · Used ${p.timesUsed}/${p.usageLimit}` : ` · Used ${p.timesUsed}×`}
                  {p.validTo ? ` · Expires ${p.validTo.toLocaleDateString("en-GB")}` : ""}
                </p>
              </div>
              <DeletePromoCodeButton promoCodeId={p.id} />
            </li>
          ))}
        </ul>
      )}

      {moduleEnabled ? (
        <NewPromoCodeForm lessonTypes={lessonTypes} />
      ) : (
        <p className="text-sm text-neutral-500">
          The Commerce add-ons module isn&apos;t enabled on this account, so new promo codes
          can&apos;t be created — get in touch if you&apos;d like it switched on. Existing codes
          can still be applied below.
        </p>
      )}

      <div>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Apply a code</h2>
        <ApplyPromoCodeForm
          subscriptions={subscriptions.map((s) => ({
            id: s.id,
            label: `${s.student.name} — ${s.payer.name}`,
          }))}
        />
      </div>
    </div>
  );
}
