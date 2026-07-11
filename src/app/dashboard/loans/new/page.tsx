import { NewItemForm } from "./new-item-form";

export default function NewLoanableItemPage() {
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add equipment</h1>
      <NewItemForm />
    </div>
  );
}
