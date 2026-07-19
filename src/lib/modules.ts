import { prisma } from "@/lib/db";
import type { ModuleKey } from "@prisma/client";

/**
 * Module separation (roadmap discussion, July 2026): the app is split into a Foundation layer
 * that's never gated — Student, Payer, StudentPayerLink, TeachingLocation, LessonType, Contract —
 * and a set of optional modules that can be switched on/off per teacher, eventually behind a
 * paywall. This file is the single place that decision gets enforced. Nothing outside this file
 * should read TeacherModuleAccess directly — always go through hasModule()/requireModule() so the
 * default-open policy below can change in one place later.
 */

export type ModuleDefinition = {
  key: ModuleKey;
  label: string;
  description: string;
};

export const MODULE_REGISTRY: Record<ModuleKey, ModuleDefinition> = {
  ORGANISATION: {
    key: "ORGANISATION",
    label: "Organisation",
    description:
      "Invite other Learnio teacher accounts as instructors and log cover assignments between them.",
  },
  TERM_CALENDARS: {
    key: "TERM_CALENDARS",
    label: "Term calendars",
    description:
      "Term/holiday-aware scheduling for teaching locations, instead of a plain continuous week.",
  },
  SCHEDULING: {
    key: "SCHEDULING",
    label: "Scheduling & timetable",
    description:
      "The timetable generator (single, bulk, and term-aware repeat scheduling), unavailability " +
      "rules, waitlist, route-check, and travel times. Deliberately does NOT gate the Lesson " +
      "record itself, lesson detail/attendance management, or Absences/make-up credits — those " +
      "stay open since too many other features (billing, check-in, parent microsite, session " +
      "plans) read from lessons that already exist. This only gates the tooling that creates new " +
      "lessons at scale; a teacher without it can still track lessons manually through Quick Invoice.",
  },
  CURRICULUM: {
    key: "CURRICULUM",
    label: "Curriculum & content",
    description:
      "Curriculum templates, per-student curriculum (assigned/imported/duplicated), resources, " +
      "and assignments — plus sellable courses. Zero other modules read from any of this " +
      "(confirmed: only the Today view's optional resource list and the course-purchase Stripe " +
      "flow touch it, and both degrade fine — an empty resource list, or a purchase against a " +
      "course created before this was ever locked). Gates creating new curriculum/resource/" +
      "assignment/course content; never gates viewing, publishing, or deleting what already exists.",
  },
  COMPLIANCE: {
    key: "COMPLIANCE",
    label: "Compliance & safety",
    description:
      "Only Cancellation policy is actually gated (creation/upsert; deletion always stays open). " +
      "Instructor certifications, incident log, and student medical notes are DELIBERATELY NEVER " +
      "GATED — explicit product decision: safeguarding-relevant records and credentials must " +
      "never sit behind a paywall, at any tier, under any circumstances. Do not add a hasModule() " +
      "check to createCertificationAction, createIncidentLogAction, or addMedicalNoteAction — " +
      "this is intentional, not an oversight. Cancellation policy IS read by lesson cancellation/" +
      "no-show handling (lessons/[id]/actions.ts) — but that read already treats 'no policy " +
      "exists' as a valid, intentional state (always-free behaviour), so locking this module " +
      "needs zero change to that consuming code.",
  },
  EMBEDS: {
    key: "EMBEDS",
    label: "Embeds & booking widget",
    description:
      "The embeddable booking-widget links (EmbedConfig) a teacher can put on their own site or " +
      "bio link. Zero external consumers. NOTE: this was originally scoped as a broader 'Growth " +
      "& Outreach' module alongside Referrals and Out-of-scope-signups, but neither of those " +
      "belongs here on inspection — Referrals is just a read-only rollup of Student.referredBy " +
      "(a Foundation field, no module-specific data or creation action of its own, same reasoning " +
      "as Absences staying ungated), and Out-of-scope-signups is admin-only platform tooling " +
      "(gated by isAdminEmail, not a teacher-facing feature at all). This module is Embeds alone.",
  },
};

/**
 * DEFAULT_OPEN_UNTIL_PAYWALL: no paywall UI or Stripe wiring exists yet, so a teacher with no
 * TeacherModuleAccess row for a given module is currently treated as ENABLED — this is what keeps
 * every existing teacher's Organisation/Term-calendar access working exactly as it did before
 * this migration, with zero data backfill required. The day a real paywall ships, flip this to
 * `false` (and backfill ENABLED rows for anyone who should keep grandfathered access) rather than
 * changing the call sites that use hasModule().
 */
const DEFAULT_OPEN_UNTIL_PAYWALL = true;

/** Whether `teacherId` currently has access to `moduleKey`. This is the only check any route,
 * server action, or nav item should use — never query TeacherModuleAccess directly. */
export async function hasModule(teacherId: string, moduleKey: ModuleKey): Promise<boolean> {
  const access = await prisma.teacherModuleAccess.findUnique({
    where: { teacherId_moduleKey: { teacherId, moduleKey } },
  });

  if (!access) return DEFAULT_OPEN_UNTIL_PAYWALL;
  return access.status === "ENABLED" || access.status === "TRIAL";
}

/** Bulk variant for gating a full nav render in one query instead of one round-trip per module. */
export async function getEnabledModules(teacherId: string): Promise<Set<ModuleKey>> {
  const rows = await prisma.teacherModuleAccess.findMany({ where: { teacherId } });
  const byKey = new Map(rows.map((r) => [r.moduleKey, r.status]));

  const enabled = new Set<ModuleKey>();
  for (const key of Object.keys(MODULE_REGISTRY) as ModuleKey[]) {
    const status = byKey.get(key);
    const isEnabled = status ? status === "ENABLED" || status === "TRIAL" : DEFAULT_OPEN_UNTIL_PAYWALL;
    if (isEnabled) enabled.add(key);
  }
  return enabled;
}

/** Throws if the module is locked — use at the top of a server action/route handler, not just in
 * the UI, so a locked-out teacher can't call the action directly once they can't see the button. */
export async function requireModule(teacherId: string, moduleKey: ModuleKey): Promise<void> {
  const allowed = await hasModule(teacherId, moduleKey);
  if (!allowed) {
    throw new Error(
      `The ${MODULE_REGISTRY[moduleKey].label} module isn't enabled on this account.`
    );
  }
}
