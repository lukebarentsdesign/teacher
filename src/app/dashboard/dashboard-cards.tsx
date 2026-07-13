import Link from "next/link";
import { prisma } from "@/lib/db";
import { shouldShowCard, type DismissedCards } from "@/lib/onboarding";
import { DismissCardButton } from "./dismiss-card-button";

type Card = { id: string; title: string; description: string; href: string; cta: string; cooldownDays: number };

/**
 * Onboarding-ux-spec Section 3 (Phase 2) — dismissible, specific cards driven by what's actually
 * missing, ordered by what unblocks the most value. Not a generic progress bar. A dismissed card
 * resurfaces after its own cooldown if the underlying condition is still true (shouldShowCard) —
 * e.g. don't nag about Stripe daily, but do come back weekly until it's actually connected.
 */
export async function DashboardCards({ teacherId }: { teacherId: string }) {
  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } });
  if (!teacher.archetype) return null; // pre-existing account, never went through onboarding

  const dismissed = (teacher.dismissedCards as DismissedCards) ?? {};
  const now = new Date();
  const cards: Card[] = [];

  if (teacher.archetype === "SOLO") {
    const studentCount = await prisma.student.count({ where: { teacherId, status: "ACTIVE" } });

    if (!teacher.stripeConnectOnboarded) {
      cards.push({
        id: "stripe-connect",
        title: "Connect Stripe so parents can pay you",
        description: "Nothing gets paid until this is set up.",
        href: "/dashboard/payments",
        cta: "Connect Stripe",
        cooldownDays: 7,
      });
    }
    if (studentCount <= 1) {
      cards.push({
        id: "add-student",
        title: "Add another student",
        description: "Your dashboard gets more useful with more than one.",
        href: "/dashboard/students",
        cta: "Add a student",
        cooldownDays: 14,
      });
    }
    const hasCancellation = await prisma.lesson.findFirst({
      where: { teacherId, OR: [{ status: "CANCELLED_BY_TEACHER" }, { noShowConfirmed: true }] },
    });
    const hasCancellationPolicy = await prisma.cancellationPolicy.findFirst({ where: { teacherId } });
    if (hasCancellation && !hasCancellationPolicy) {
      cards.push({
        id: "cancellation-policy",
        title: "Set your cancellation policy",
        description: "You've had a cancellation — decide what happens automatically next time.",
        href: "/dashboard/billing",
        cta: "Set a policy",
        cooldownDays: 30,
      });
    }
    const hasSchoolLocation = await prisma.teacherLocationLink.findFirst({
      where: { teacherId, location: { locationType: "SCHOOL" } },
    });
    if (!hasSchoolLocation) {
      cards.push({
        id: "school-employment-note",
        title: "Also teach at a school sometimes?",
        description: "Optional — add it just for your own records, nothing required here.",
        href: "/dashboard/teaching-locations",
        cta: "Add a location",
        cooldownDays: 60,
      });
    }
  } else {
    if (!teacher.stripeConnectOnboarded) {
      cards.push({
        id: "stripe-connect",
        title: "Connect Stripe",
        description: "Nothing gets paid until this is set up.",
        href: "/dashboard/payments",
        cta: "Connect Stripe",
        cooldownDays: 7,
      });
    }
    const classesWithoutCapacity = await prisma.groupClass.count({ where: { teacherId, capacity: null } });
    if (classesWithoutCapacity > 0) {
      cards.push({
        id: "set-capacity",
        title: "Set a capacity for your class",
        description: "Without it, there's no waitlist once you're full.",
        href: "/dashboard/group-classes",
        cta: "Set capacity",
        cooldownDays: 14,
      });
    }
    const memberCount = await prisma.groupClassMember.count({ where: { groupClass: { teacherId }, leftAt: null } });
    if (memberCount === 0) {
      cards.push({
        id: "add-members",
        title: "Add your first few members",
        description: "Get your class roster started.",
        href: "/dashboard/group-classes",
        cta: "Add members",
        cooldownDays: 14,
      });
    }
    const hasCheckIn = await prisma.checkIn.findFirst({ where: { student: { teacherId } } });
    if (!hasCheckIn) {
      cards.push({
        id: "turn-on-checkin",
        title: "Turn on check-in for class sign-in",
        description: "Card-based sign-in for your classes.",
        href: "/dashboard/checkin",
        cta: "Set up check-in",
        cooldownDays: 30,
      });
    }
  }

  const visible = cards.filter((c) => shouldShowCard(c.id, dismissed, now, c.cooldownDays));
  if (visible.length === 0) return null;

  return (
    <div className="mb-8 space-y-2">
      {visible.map((card) => (
        <div key={card.id} className="flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">{card.title}</p>
            <p className="text-xs text-neutral-500">{card.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={card.href}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-brand-700"
            >
              {card.cta}
            </Link>
            <DismissCardButton cardId={card.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
