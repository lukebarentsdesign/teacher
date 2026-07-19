"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";

const createOrgSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

/** Starting an org makes the creator its OWNER — no separate promotion step needed. */
export async function createOrganisationAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";

  if (!(await hasModule(session.user.id, "ORGANISATION"))) {
    return "The Organisation module isn't enabled on this account";
  }

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session.user.id } });
  if (teacher.organisationId) return "You're already part of an organisation";

  const parsed = createOrgSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const org = await prisma.organisation.create({ data: { name: parsed.data.name } });
  await prisma.teacher.update({
    where: { id: session.user.id },
    data: { organisationId: org.id, role: "OWNER" },
  });

  revalidatePath("/dashboard/organisation");
}

/** Only the OWNER generates invites — an INSTRUCTOR can't pull other accounts in. */
export async function createInviteAction(): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "ORGANISATION"))) {
    return "The Organisation module isn't enabled on this account";
  }

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!teacher.organisationId) return "Start an organisation first";
  if (teacher.role !== "OWNER") return "Only the organisation owner can invite instructors";

  await prisma.organisationInvite.create({
    data: {
      organisationId: teacher.organisationId,
      invitedByTeacherId: session.user.id,
      token: crypto.randomUUID().replace(/-/g, ""),
    },
  });

  revalidatePath("/dashboard/organisation");
}

export async function revokeInviteAction(inviteId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!teacher.organisationId || teacher.role !== "OWNER") return;

  await prisma.organisationInvite.deleteMany({
    where: { id: inviteId, organisationId: teacher.organisationId, acceptedAt: null },
  });

  revalidatePath("/dashboard/organisation");
}

/** Self-removal only — an OWNER can't unilaterally remove another account, matching the
 *  consent-based join below. Leaving resets the teacher to a standalone OWNER of nobody. */
export async function leaveOrganisationAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.teacher.update({
    where: { id: session.user.id },
    data: { organisationId: null, role: "OWNER" },
  });

  revalidatePath("/dashboard/organisation");
}

/** Consent-based join, same pattern as embed/onboarding links elsewhere in this app — the
 *  invitee must actively accept while authenticated as themselves, not be silently attached. */
export async function acceptInviteAction(token: string): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "ORGANISATION"))) {
    return "The Organisation module isn't enabled on this account";
  }

  const invite = await prisma.organisationInvite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt) return "This invite is no longer valid";

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session.user.id } });
  if (teacher.organisationId) return "You're already part of an organisation — leave it first";

  await prisma.$transaction([
    prisma.teacher.update({
      where: { id: session.user.id },
      data: { organisationId: invite.organisationId, role: "INSTRUCTOR" },
    }),
    prisma.organisationInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);

  revalidatePath("/dashboard/organisation");
  redirect("/dashboard/organisation");
}
