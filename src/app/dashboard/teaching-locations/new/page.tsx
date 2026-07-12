import { NewLocationForm } from "./new-location-form";

export default function NewLocationPage() {
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add teaching location</h1>
      <NewLocationForm />
    </div>
  );
}
