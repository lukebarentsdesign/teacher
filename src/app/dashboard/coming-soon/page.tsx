import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { FeatureFeedbackForm } from "./feedback-form";

const COMING_SOON_FEATURES = [
  {
    key: "calendar_sync",
    title: "Two-way Calendar Sync",
    description: "Sync your lesson timetables automatically with Google Calendar, Apple Calendar, or Microsoft Outlook.",
  },
  {
    key: "sms_notifications",
    title: "SMS Reminders & Alerts",
    description: "Send automated text reminders to parents and students for upcoming lessons, cancellations, or overdue payments.",
  },
  {
    key: "accounting_export",
    title: "Accounting Integrations",
    description: "Export ledger and invoice data directly to QuickBooks, Xero, or FreeAgent for easy tax reporting.",
  },
  {
    key: "expense_receipt_scan",
    title: "AI Receipt Scanning",
    description: "Snap photos of receipts on your phone and automatically extract dates, tax, and categories for your expenses.",
  },
  {
    key: "interactive_whiteboard",
    title: "Interactive Classroom Whiteboard",
    description: "Share a live digital board with students during online lessons for real-time annotation and shared exercises.",
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
          Help us prioritize the development of TeachBase. Vote on the features that would make the biggest difference to your teaching business.
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
