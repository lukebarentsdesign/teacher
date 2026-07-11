"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { sendEmailAsTeacher, GmailNotConnectedError, GmailReauthRequiredError } from "@/lib/gmail";

const sendEmailSchema = z.object({
  payerId: z.string().min(1),
  subject: z.string().trim().min(1, "Subject is required"),
  body: z.string().trim().min(1, "Message can't be empty"),
});

export async function sendPayerEmailAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  const parsed = sendEmailSchema.safeParse({
    payerId: formData.get("payerId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const payer = await prisma.payer.findFirst({
    where: { id: parsed.data.payerId, teacherId: session.user.id },
  });
  if (!payer) return "Payer not found";
  if (!payer.email) return "This payer has no email address on file.";

  try {
    await sendEmailAsTeacher(session.user.id, payer.email, parsed.data.subject, parsed.data.body);
  } catch (error) {
    if (error instanceof GmailNotConnectedError) return "Connect Gmail (Billing page) before sending.";
    if (error instanceof GmailReauthRequiredError) {
      return "Your Gmail connection expired — reconnect it on the Billing page.";
    }
    return "Couldn't send the email — please try again.";
  }
}
