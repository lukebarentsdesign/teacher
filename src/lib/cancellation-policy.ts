export type CancellationAction = "FULL_CHARGE" | "PARTIAL_CHARGE" | "CREDIT" | "FORFEIT";

export type CancellationPolicyLike = {
  noticeHoursRequired: number;
  lateCancelAction: CancellationAction;
  noShowAction: CancellationAction;
  partialChargePercent: number | null;
};

export type CancellationOutcome = {
  action: CancellationAction;
  /** Fraction of lessonValue to charge (0–1). Only relevant for FULL_CHARGE (1) / PARTIAL_CHARGE. */
  chargeFraction: number;
};

/**
 * Decides what happens when a lesson is marked absent, based on how much notice was given
 * (scheduledAt vs informedAt) against a CancellationPolicy. No policy configured = the app's
 * original always-free behavior (banked make-up credit, no cash impact) — see
 * CLAUDE.md "Ledger Engine Decisions" for why that stayed the unconfigured default.
 *
 * - informedAt at or after scheduledAt: a genuine no-show (nobody told the teacher in advance) —
 *   applies noShowAction.
 * - informedAt before scheduledAt but within noticeHoursRequired of it: a late cancellation —
 *   applies lateCancelAction.
 * - informedAt far enough ahead of scheduledAt: sufficient notice, always free (CREDIT) regardless
 *   of what the policy's actions are configured to — the policy only penalizes short notice.
 */
export function resolveCancellationOutcome(
  policy: CancellationPolicyLike | null,
  scheduledAt: Date,
  informedAt: Date
): CancellationOutcome {
  if (!policy) return { action: "CREDIT", chargeFraction: 0 };

  const isNoShow = informedAt.getTime() >= scheduledAt.getTime();
  const hoursNotice = (scheduledAt.getTime() - informedAt.getTime()) / (60 * 60 * 1000);

  let action: CancellationAction;
  if (isNoShow) {
    action = policy.noShowAction;
  } else if (hoursNotice >= policy.noticeHoursRequired) {
    action = "CREDIT";
  } else {
    action = policy.lateCancelAction;
  }

  const chargeFraction =
    action === "FULL_CHARGE" ? 1 : action === "PARTIAL_CHARGE" ? (policy.partialChargePercent ?? 0) / 100 : 0;

  return { action, chargeFraction };
}
