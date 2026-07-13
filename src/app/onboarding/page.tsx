import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session.user.id } });

  // Already been through onboarding — don't re-show it (e.g. a bookmarked/back-button visit).
  if (teacher.onboardingCompletedAt) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-md">
        <OnboardingWizard
          initialTeachesGroups={teacher.teachesGroups}
          initialControlsOwnSchedule={teacher.controlsOwnSchedule}
        />
      </div>
    </div>
  );
}
