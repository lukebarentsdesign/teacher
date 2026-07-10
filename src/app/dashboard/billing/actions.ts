"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createPlatformCheckoutSession, createBillingPortalSession } from "@/lib/billing";

export async function startCheckoutAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const url = await createPlatformCheckoutSession(session.user.id);
  redirect(url);
}

export async function openBillingPortalAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const url = await createBillingPortalSession(session.user.id);
  redirect(url);
}
