import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { FeatureFeedbackForm } from "./feedback-form";

const COMING_SOON_FEATURES = [
  {
    key: "parent_portal",
    title: "Parent Portal",
    description: "Self-service microsite for parents to view schedules, see lesson feedback, check outstanding balances, and sign contracts.",
  },
  {
    key: "stripe_payments",
    title: "Stripe Online Payments",
    description: "Automatically collect payments via credit/debit card or Direct Debit links so payments sync directly into your cash balance.",
  },
  {
    key: "calendar_sync",
    title: "Two-way Calendar Sync",
    description: "Sync your lesson timetables automatically with Google Calendar, Apple Calendar, or Microsoft Outlook.",
  },
  {
    key: "lesson_notes_sharing",
    title: "Lesson Notes & Resource Library",
    description: "Share teaching notes, sheets, audio tracks, and reference videos directly with students between lessons.",
  },
  {
    key: "group_classes",
    title: "Group Classes & Shared Lessons",
    description: "Schedule group bookings, manage waitlists, and calculate shared lesson rates automatically.",
  },
  {
    key: "loans_maintenance",
    title: "Equipment Loans & Maintenance Tracking",
    description: "Track instruments, books, or materials lent to students and set alerts for service or repair schedules.",
  },
  {
    key: "lone_worker_safety",
    title: "Lone-Worker Safety & Routing",
    description: "Check in/out of home visits with safety alerts for family contacts and track travel times between teaching locations.",
  },
  {
    key: "gift_promo_courses",
    title: "Gift Cards, Promo Codes & Courses",
    description: "Sell structured lessons as package courses, offer seasonal gift cards, or distribute percentage/fixed discount codes.",
  },
];

export default async function ComingSoonPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const existingFeedback = await prisma.comingSoonFeedback.findMany({
    where: { teacherId: session.user.id },
  });

  const feedbackMap = new Map(existingFeedback.map((f) => [f.featureKey, f]));

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Future Features Roadmap</h1>
        <p className="mt-1.5 text-sm text-neutral-500 max-w-xl leading-relaxed">
          Help us prioritize the development of Learnio. Vote on the features that would make the biggest difference to your teaching business.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {COMING_SOON_FEATURES.map((feature) => {
          const vote = feedbackMap.get(feature.key);
          return (
            <FeatureFeedbackForm
              key={feature.key}
              featureKey={feature.key}
              title={feature.title}
              description={feature.description}
              initialRating={vote?.rating}
              initialComment={vote?.comment ?? ""}
            />
          );
        })}
      </div>
    </div>
  );
}
