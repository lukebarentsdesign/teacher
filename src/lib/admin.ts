/**
 * This app has no real admin/superuser role — it's a multi-tenant SaaS where every Teacher is
 * equal. The one screen that genuinely needs an operator-only view (OutOfScopeSignup review — the
 * spec frames it as the *product owner* periodically reviewing signal across all teachers, not
 * something any individual teacher has a reason to see about themselves) is gated by a plain
 * comma-separated env var instead of a new role/permission system, which would be a lot of new
 * infrastructure for a single internal screen.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
