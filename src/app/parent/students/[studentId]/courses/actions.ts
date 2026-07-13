"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getMicrositeSession } from "@/lib/microsite-session";
import { createCoursePurchaseCheckoutSession } from "@/lib/course-payments";

export async function startCourseCheckoutAction(studentId: string, courseId: string): Promise<string | undefined> {
  const session = await getMicrositeSession();
  if (!session || session.type !== "guardian") return "Not authorized";

  const link = await prisma.studentPayerLink.findFirst({ where: { studentId, payerId: session.payerId } });
  if (!link) return "Not authorized";

  let url: string;
  try {
    url = await createCoursePurchaseCheckoutSession(courseId, session.payerId);
  } catch (error) {
    return error instanceof Error ? error.message : "Couldn't start checkout";
  }

  redirect(url);
}
