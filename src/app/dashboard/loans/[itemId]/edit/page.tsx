import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { EditItemForm } from "./edit-item-form";

export default async function EditLoanableItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const session = await auth();

  const item = await prisma.loanableItem.findFirst({
    where: { id: itemId, teacherId: session!.user.id },
  });
  if (!item) notFound();

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/dashboard/loans" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to equipment &amp; loans
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Edit equipment</h1>
      </div>
      <EditItemForm
        item={{
          id: item.id,
          name: item.name,
          type: item.type,
          condition: item.condition,
          value: item.value ? item.value.toString() : null,
        }}
      />
    </div>
  );
}
