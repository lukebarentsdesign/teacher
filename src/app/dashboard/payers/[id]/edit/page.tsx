import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { EditPayerForm } from "./edit-payer-form";

export default async function EditPayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const payer = await prisma.payer.findFirst({ where: { id, teacherId: session!.user.id } });
  if (!payer) notFound();

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/dashboard/payers/${payer.id}`} className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to {payer.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Edit payer</h1>
      </div>
      <EditPayerForm
        payer={{
          id: payer.id,
          name: payer.name,
          email: payer.email,
          phone: payer.phone,
          contactPref: payer.contactPref,
          notes: payer.notes,
        }}
      />
    </div>
  );
}
