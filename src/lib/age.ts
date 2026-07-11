/** Completed years of age as of `today`. */
export function ageInYears(dob: Date, today: Date = new Date()): number {
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}

/** Whether `dob` has reached its 16th birthday as of today. Gates student microsite access. */
export function isAtLeast16(dob: Date, today: Date = new Date()): boolean {
  return ageInYears(dob, today) >= 16;
}

/**
 * Whether `dob` has reached its 18th birthday as of today. Gates the new-student wizard's
 * "student pays themself" option — deliberately a HIGHER, separate threshold from the 16+
 * microsite-access rule (isAtLeast16): a 16-year-old can view their own schedule, but only an
 * 18-year-old (a legal adult) can be the billing party.
 */
export function isAtLeast18(dob: Date, today: Date = new Date()): boolean {
  return ageInYears(dob, today) >= 18;
}
