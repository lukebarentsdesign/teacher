import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { JoinInviteButton } from "./join-invite-button";

export default async function JoinOrganisationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();

  const invite = await prisma.organisationInvite.findUnique({
    where: { token },
    include: { organisation: true, invitedByTeacher: true },
  });
  if (!invite) notFound();

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold text-neutral-900">Join {invite.organisation.name}?</h1>

      {invite.acceptedAt ? (
        <p className="text-sm text-neutral-500">This invite has already been used.</p>
      ) : teacher.organisationId ? (
        <p className="text-sm text-neutral-500">
          You&apos;re already part of an organisation — leave it first from{" "}
          <a href="/dashboard/organisation" className="underline">
            your organisation page
          </a>
          .
        </p>
      ) : (
        <>
          <p className="text-sm text-neutral-600">
            {invite.invitedByTeacher.name} has invited you to join as an instructor. This joins
            your existing account to their organisation — your own students, payers, and
            subscriptions stay exactly as they are; nothing is transferred or shared automatically.
          </p>
          <JoinInviteButton token={token} />
        </>
      )}
    </div>
  );
}
