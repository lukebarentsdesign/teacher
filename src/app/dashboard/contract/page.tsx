import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentContract } from "@/lib/contracts";
import { ContractEditorForm } from "./contract-editor-form";

export default async function ContractPage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const contract = await getCurrentContract(teacherId);

  const acceptanceCount = contract
    ? await prisma.contractAcceptance.count({
        where: { contractVersion: contract.version, payer: { teacherId } },
      })
    : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Your contract</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Shown to parents on the microsite as a clickwrap acceptance — no PDF signing, no email
          round-trip. Saving a change creates a new version; existing acceptances become stale and
          parents must re-accept before their next lesson booking or payment.
        </p>
      </div>

      {contract && (
        <p className="rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          Current version: <strong>{contract.version}</strong> · accepted by {acceptanceCount} payer
          {acceptanceCount === 1 ? "" : "s"} so far
        </p>
      )}

      <ContractEditorForm initialContent={contract?.content ?? ""} />
    </div>
  );
}
