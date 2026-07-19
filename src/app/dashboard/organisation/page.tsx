import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewOrgForm } from "./new-org-form";
import { InviteGenerator, InviteLink } from "./invite-generator";
import { LeaveOrgButton } from "./leave-org-button";
import { hasModule } from "@/lib/modules";

export default async function OrganisationPage() {
  const session = await auth();
  const moduleEnabled = await hasModule(session!.user.id, "ORGANISATION");

  const teacher = await prisma.teacher.findUniqueOrThrow({
    where: { id: session!.user.id },
    include: {
      organisation: {
        include: {
          teachers: { orderBy: { role: "asc" } },
          invites: { where: { acceptedAt: null }, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!teacher.organisation) {
    // Already-in-an-org teachers keep working below regardless of module status, so nobody
    // gets stranded mid-relationship if this ever gets locked for their account — only the
    // "start a new one" entry point (and, below, generating a new invite) is gated.
    if (!moduleEnabled) {
      return (
        <div className="max-w-lg space-y-3">
          <h1 className="text-2xl font-semibold text-neutral-900">Organisation</h1>
          <p className="text-sm text-neutral-500">
            The Organisation module isn&apos;t enabled on this account. It lets you invite other
            Learnio teacher accounts as instructors and log cover assignments between you — get
            in touch if you&apos;d like it switched on.
          </p>
        </div>
      );
    }

    return (
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Organisation</h1>
          <p className="mt-1 text-sm text-neutral-500">
            You&apos;re a standalone account today — exactly as before. Starting an organisation
            lets you invite other Learnio teacher accounts as instructors and log cover
            assignments between you. It doesn&apos;t change who owns any existing student, payer,
            or subscription record — those stay with whichever teacher account created them.
          </p>
        </div>
        <NewOrgForm />
      </div>
    );
  }

  const { organisation } = teacher;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{organisation.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          You&apos;re {teacher.role === "OWNER" ? "the owner" : "an instructor"} of this
          organisation.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Members</h2>
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {organisation.teachers.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-neutral-900">{t.name}</span>
              <span className="text-xs text-neutral-500">{t.role}</span>
            </li>
          ))}
        </ul>
      </section>

      {teacher.role === "OWNER" && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-neutral-900">Invite an instructor</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Share the link with another Learnio teacher — they accept it from their own account,
            you can&apos;t pull someone in without their consent. Only works while they aren&apos;t
            already part of an organisation.
          </p>
          {organisation.invites.length > 0 && (
            <div className="mb-3 space-y-2">
              {organisation.invites.map((inv) => (
                <InviteLink key={inv.id} inviteId={inv.id} token={inv.token} />
              ))}
            </div>
          )}
          {moduleEnabled ? (
            <InviteGenerator />
          ) : (
            <p className="text-sm text-neutral-500">
              The Organisation module isn&apos;t enabled on this account, so new invites
              can&apos;t be generated — get in touch if you&apos;d like it switched on.
            </p>
          )}
        </section>
      )}

      <LeaveOrgButton />
    </div>
  );
}
