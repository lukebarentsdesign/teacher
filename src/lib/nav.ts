/**
 * Onboarding-ux-spec Part 4 (Phase 3): "surfaces once, in the month before the UK tax year end
 * (April), not as an always-visible nag." Window is March 1 – April 30 inclusive, giving a
 * teacher a heads-up before the 5 April cutoff and through the month it actually lands in.
 */
export function isWithinTaxSeasonWindow(now: Date): boolean {
  const month = now.getMonth(); // 0-indexed: 2 = March, 3 = April
  return month === 2 || month === 3;
}
