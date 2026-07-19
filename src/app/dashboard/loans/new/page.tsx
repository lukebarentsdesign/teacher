import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";
import { NewItemForm } from "./new-item-form";

export default async function NewLoanableItemPage() {
  const session = await auth();

  if (!(await hasModule(session!.user.id, "GROUP_TEACHING"))) {
    return (
      <div className="max-w-lg space-y-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Add equipment</h1>
        <p className="text-sm text-neutral-500">
          The Group teaching module isn&apos;t enabled on this account — get in touch if
          you&apos;d like it switched on.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add equipment</h1>
      <NewItemForm />
    </div>
  );
}
