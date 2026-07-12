"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { confirmUnavailability } from "@/lib/unavailability";
import { sendEmailAsTeacher } from "@/lib/gmail";

const confirmSchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
  reason: z.string().optional(),
  locationId: z.string().optional(),
});

export async function confirmUnavailabilityAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const teacherId = session.user.id;

  const parsed = confirmSchema.parse({
    start: formData.get("start"),
    end: formData.get("end"),
    reason: formData.get("reason") || undefined,
    locationId: formData.get("locationId") || undefined,
  });

  const result = await confirmUnavailability(
    teacherId,
    new Date(parsed.start),
    new Date(parsed.end),
    parsed.locationId,
    parsed.reason
  );

  // Email guardians AFTER the cancellation/credit transaction has committed — a mail failure must
  // never undo the DB work. Best-effort per recipient; if Gmail isn't connected we simply skip
  // (the teacher still saw the full affected list on the preview to follow up manually).
  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } });
  let emailsSent = 0;
  if (teacher.gmailConnected) {
    const reasonSuffix = parsed.reason ? ` (${parsed.reason})` : "";
    for (const entry of result.guardianEmails) {
      for (const email of entry.emails) {
        try {
          await sendEmailAsTeacher(
            teacherId,
            email,
            `Lesson cancellation — ${entry.studentName}`,
            `Hello,\n\nUnfortunately ${entry.studentName}'s upcoming lesson(s) have been cancelled${reasonSuffix}. A make-up credit has been added, and I'll be in touch to rearrange.\n\nWith apologies,\n${teacher.name}`
          );
          emailsSent++;
        } catch {
          // Skip this recipient; keep notifying the rest.
        }
      }
    }
  }

  revalidatePath("/dashboard/unavailability");
  redirect(
    `/dashboard/unavailability?cancelled=${result.cancelledCount}&credited=${result.creditedCount}&emailed=${emailsSent}`
  );
}
