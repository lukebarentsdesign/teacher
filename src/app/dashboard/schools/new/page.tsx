import { NewSchoolForm } from "./new-school-form";

export default function NewSchoolPage() {
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add school / venue</h1>
      <NewSchoolForm />
    </div>
  );
}
