"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createConnectOnboardingLink } from "@/lib/connect";

export async function startConnectOnboardingAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const url = await createConnectOnboardingLink(session.user.id);
  redirect(url);
}
