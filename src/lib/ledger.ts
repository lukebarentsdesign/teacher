import type { Prisma, LedgerReason, LedgerOperation } from "@prisma/client";
import { prisma } from "@/lib/db";

export type LedgerEntryLike = {
  amount: Prisma.Decimal | number | string;
  operation: LedgerOperation;
  reason: LedgerReason;
};

/**
 * Reasons that affect the parent-facing cash balance. MAKE_UP_CREDIT_ISSUED/REDEEMED are
 * deliberately excluded — per spec, a make-up credit is a banked lesson, not a cash adjustment,
 * so it must never move the cash balance even though it lives in the same ledger table.
 */
const CASH_BALANCE_REASONS: readonly LedgerReason[] = [
  "PAYMENT",
  "LESSON_DELIVERED",
  "CANCELLATION_ADJUSTMENT",
  "MANUAL_CORRECTION",
];

/** Cash running balance = sum(CREDIT) - sum(DEBIT) over cash-affecting entries only. */
export function calculateCashBalance(entries: LedgerEntryLike[]): number {
  return entries
    .filter((entry) => CASH_BALANCE_REASONS.includes(entry.reason))
    .reduce((total, entry) => {
      const amount = Number(entry.amount);
      return entry.operation === "CREDIT" ? total + amount : total - amount;
    }, 0);
}

/** Make-up lessons currently owed = credits issued minus credits redeemed (not a cash figure). */
export function calculateMakeUpCreditsOwed(entries: LedgerEntryLike[]): number {
  const issued = entries.filter((entry) => entry.reason === "MAKE_UP_CREDIT_ISSUED").length;
  const redeemed = entries.filter((entry) => entry.reason === "MAKE_UP_CREDIT_REDEEMED").length;
  return issued - redeemed;
}

export type CancellationPayout = {
  cashBalance: number;
  /** Positive cashBalance: parent has paid more than consumed. */
  refundOwedToParent: number;
  /** Negative cashBalance: parent has consumed more than paid. */
  amountOwedToTeacher: number;
};

/** Pure calculation per spec section 3 — run before a cancellation is confirmed. */
export function calculateCancellationPayout(entries: LedgerEntryLike[]): CancellationPayout {
  const cashBalance = calculateCashBalance(entries);
  return {
    cashBalance,
    refundOwedToParent: cashBalance > 0 ? cashBalance : 0,
    amountOwedToTeacher: cashBalance < 0 ? Math.abs(cashBalance) : 0,
  };
}

export async function getSubscriptionLedgerSummary(subscriptionId: string) {
  const entries = await prisma.ledgerEntry.findMany({ where: { subscriptionId } });
  return {
    cashBalance: calculateCashBalance(entries),
    makeUpCreditsOwed: calculateMakeUpCreditsOwed(entries),
  };
}

/** Preview shown to the parent before they confirm cancellation — must not mutate anything. */
export async function previewCancellationPayout(subscriptionId: string): Promise<CancellationPayout> {
  const entries = await prisma.ledgerEntry.findMany({ where: { subscriptionId } });
  return calculateCancellationPayout(entries);
}

export async function postPayment(subscriptionId: string, amount: number, note?: string) {
  return prisma.ledgerEntry.create({
    data: { subscriptionId, amount, operation: "CREDIT", reason: "PAYMENT", note },
  });
}

/**
 * "Present ($)" attendance path. `lessonValue` is supplied by the caller (not derived here) —
 * see docs/spec.md and CLAUDE.md for why per-lesson value depends on the timetable/billing
 * model and isn't a fixed constant.
 */
export async function postLessonDelivered(subscriptionId: string, lessonValue: number, note?: string) {
  return prisma.ledgerEntry.create({
    data: { subscriptionId, amount: lessonValue, operation: "DEBIT", reason: "LESSON_DELIVERED", note },
  });
}

async function countHeldLessonsInRange(subscriptionId: string, start: Date, end: Date): Promise<number> {
  return prisma.lesson.count({
    where: { subscriptionId, status: "HELD", scheduledAt: { gte: start, lte: end } },
  });
}

/**
 * Derives the value of one delivered lesson for a Subscription, resolving the open question left
 * by postLessonDelivered's caller-supplied lessonValue — now that the timetable generator (build
 * step 4) makes lesson counts knowable. The schema has one Decimal field (`annualFee`) reused with
 * different meaning per billingModel (there's no separate perLessonRate/hourlyRate column):
 *
 * - SMOOTHED_SUBSCRIPTION: annualFee spread across however many HELD lessons actually fall in the
 *   subscription's year (startDate to endDate, or +1 year if no endDate) — the spec's "smoothing"
 *   is about monthly billing cadence, not lesson value, so this is a separate division.
 * - TERMLY: same idea, but the denominator is HELD lessons within the lesson's school's current
 *   term (termStart/termEnd) rather than a full year.
 * - PER_LESSON: annualFee is entered as the flat per-lesson rate directly, no division.
 * - HOURLY: annualFee is entered as the hourly rate, scaled by the lesson's actual duration.
 *
 * Falls back to the raw annualFee if a denominator can't be computed (e.g. zero lessons found
 * yet) rather than dividing by zero — better to slightly overcharge once than post a NaN/zero.
 */
export async function deriveLessonValue(
  subscriptionId: string,
  lesson: { durationMins: number; schoolId: string }
): Promise<number> {
  const subscription = await prisma.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
  const rate = Number(subscription.annualFee);

  switch (subscription.billingModel) {
    case "PER_LESSON":
      return rate;

    case "HOURLY":
      return rate * (lesson.durationMins / 60);

    case "TERMLY": {
      const school = await prisma.school.findUnique({ where: { id: lesson.schoolId } });
      if (!school?.termStart || !school?.termEnd) return rate;
      const count = await countHeldLessonsInRange(subscriptionId, school.termStart, school.termEnd);
      return count > 0 ? rate / count : rate;
    }

    case "SMOOTHED_SUBSCRIPTION":
    default: {
      const yearEnd = subscription.endDate ?? new Date(subscription.startDate.getFullYear() + 1, subscription.startDate.getMonth(), subscription.startDate.getDate());
      const count = await countHeldLessonsInRange(subscriptionId, subscription.startDate, yearEnd);
      return count > 0 ? rate / count : rate;
    }
  }
}

/** "Absent, make-up owed" attendance path — banks a make-up lesson, no cash impact. */
export async function postMakeUpCreditIssued(subscriptionId: string, note?: string) {
  return prisma.ledgerEntry.create({
    data: { subscriptionId, amount: 0, operation: "CREDIT", reason: "MAKE_UP_CREDIT_ISSUED", note },
  });
}

/** Redeeming a banked make-up lesson against a future slot — no cash impact. */
export async function postMakeUpCreditRedeemed(subscriptionId: string, note?: string) {
  return prisma.ledgerEntry.create({
    data: { subscriptionId, amount: 0, operation: "DEBIT", reason: "MAKE_UP_CREDIT_REDEEMED", note },
  });
}

/** Ledger entries are append-only — corrections are new entries, never edits to old ones. */
export async function postManualCorrection(
  subscriptionId: string,
  amount: number,
  operation: LedgerOperation,
  note: string
) {
  return prisma.ledgerEntry.create({
    data: { subscriptionId, amount: Math.abs(amount), operation, reason: "MANUAL_CORRECTION", note },
  });
}

/**
 * Marks a Subscription CANCELLED. Deliberately does NOT auto-post a balancing
 * CANCELLATION_ADJUSTMENT entry — the payout (refund via Stripe, or invoice for amount owed)
 * is a real-world action the teacher takes, and the ledger entry for it is posted when that
 * action actually happens (see the Stripe integration build step).
 */
export async function cancelSubscription(subscriptionId: string) {
  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "CANCELLED", endDate: new Date() },
  });
}
