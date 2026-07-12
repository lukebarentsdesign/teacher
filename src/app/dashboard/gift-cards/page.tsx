import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewGiftCardForm } from "./new-gift-card-form";
import { RedeemGiftCardForm } from "./redeem-gift-card-form";
import { DeleteGiftCardButton } from "./delete-gift-card-button";

export default async function GiftCardsPage() {
  const session = await auth();

  const [giftCards, payers, subscriptions] = await Promise.all([
    prisma.giftCard.findMany({
      where: { teacherId: session!.user.id },
      include: { purchasedByPayer: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payer.findMany({ where: { teacherId: session!.user.id }, orderBy: { name: "asc" } }),
    prisma.subscription.findMany({
      where: { student: { teacherId: session!.user.id }, status: "ACTIVE" },
      include: { student: true, payer: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Gift cards</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Prepaid credit, redeemable against any active subscription&apos;s ledger — each
          redemption posts an ordinary payment and reduces the card&apos;s remaining balance.
        </p>
      </div>

      {giftCards.length === 0 ? (
        <p className="text-sm text-neutral-500">No gift cards issued yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {giftCards.map((gc) => (
            <li key={gc.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-mono font-medium text-neutral-900">{gc.code}</p>
                <p className="text-xs text-neutral-500">
                  £{gc.remainingBalance.toString()} remaining of £{gc.initialValue.toString()}
                  {gc.purchasedByPayer ? ` · Purchased by ${gc.purchasedByPayer.name}` : ""}
                </p>
              </div>
              <DeleteGiftCardButton giftCardId={gc.id} />
            </li>
          ))}
        </ul>
      )}

      <NewGiftCardForm payers={payers} />

      <div>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Redeem</h2>
        <RedeemGiftCardForm
          subscriptions={subscriptions.map((s) => ({
            id: s.id,
            label: `${s.student.name} — ${s.payer.name}`,
          }))}
        />
      </div>
    </div>
  );
}
