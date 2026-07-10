import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getParentSession } from "@/lib/parent-session";
import { getCurrentContract, getAcceptanceForContract } from "@/lib/contracts";
import { AcceptContractForm } from "./accept-contract-form";

export default async function ParentContractPage() {
  const session = await getParentSession();
  if (!session) redirect("/parent/login");

  const payer = await prisma.payer.findUnique({ where: { id: session.payerId } });
  if (!payer) redirect("/parent/login");

  const contract = await getCurrentContract(payer.teacherId);

  if (!contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <p className="text-sm text-neutral-500">Your teacher hasn&apos;t set up a contract yet.</p>
      </div>
    );
  }

  const acceptance = await getAcceptanceForContract(payer.id, contract.version);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {acceptance ? (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-neutral-900">You&apos;re all set</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Accepted by <strong>{acceptance.typedName}</strong> on{" "}
              {acceptance.acceptedAt.toLocaleDateString("en-GB")} (version {acceptance.contractVersion}).
            </p>
            <Link
              href="/parent/contract/pdf"
              className="mt-4 inline-block text-sm text-neutral-900 underline"
            >
              Download a copy for your records (PDF)
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">
                Please review and accept your teacher&apos;s terms
              </h1>
              <p className="mt-1 text-sm text-neutral-500">Version {contract.version}</p>
            </div>
            <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white p-6 text-sm text-neutral-700 shadow-sm">
              {contract.content}
            </div>
            <AcceptContractForm />
          </>
        )}
      </div>
    </div>
  );
}
