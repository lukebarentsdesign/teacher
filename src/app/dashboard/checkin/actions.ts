"use server";

import { auth } from "@/auth";
import { findScanTargets, signIn, signOut, type ScanResult } from "@/lib/checkin";

export type ScanState = { result?: ScanResult; error?: string; message?: string };

export async function scanCardAction(_prevState: ScanState, formData: FormData): Promise<ScanState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const igCardId = (formData.get("igCardId") as string)?.trim();
  if (!igCardId) return { error: "Scan or enter a card ID." };

  const result = await findScanTargets(session.user.id, igCardId);
  if (!result) return { error: `No student found for card "${igCardId}".` };
  if (result.targets.length === 0) {
    return { error: `${result.studentName} has no lesson or class scheduled today.` };
  }

  return { result };
}

export async function signInAction(
  studentId: string,
  targetType: "lesson" | "groupClass",
  targetId: string
): Promise<ScanState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  await signIn(session.user.id, studentId, { type: targetType, id: targetId });
  return { message: "Signed in." };
}

export async function signOutAction(
  studentId: string,
  targetType: "lesson" | "groupClass",
  targetId: string
): Promise<ScanState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await signOut(studentId, { type: targetType, id: targetId });
  if (!result) return { error: "No open sign-in found to close." };
  return { message: "Signed out." };
}
