/** Whether `dob` has reached its 16th birthday as of today. */
export function isAtLeast16(dob: Date, today: Date = new Date()): boolean {
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age >= 16;
}
