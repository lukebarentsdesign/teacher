import { NewPayerForm } from "./new-payer-form";

export default function NewPayerPage() {
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add guardian / payer</h1>
      <NewPayerForm />
    </div>
  );
}
