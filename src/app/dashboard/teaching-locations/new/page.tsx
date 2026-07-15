import { auth } from "@/auth";
import { getActiveInvoicingTargetOptions, getActiveLocationTypeOptions } from "@/lib/menu-choice-options";
import { NewLocationForm } from "./new-location-form";

export default async function NewLocationPage() {
  const session = await auth();
  const teacherId = session!.user.id;
  const [locationTypeOptions, invoicingTargetOptions] = await Promise.all([
    getActiveLocationTypeOptions(teacherId),
    getActiveInvoicingTargetOptions(teacherId),
  ]);

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Add teaching location</h1>
      <NewLocationForm locationTypeOptions={locationTypeOptions} invoicingTargetOptions={invoicingTargetOptions} />
    </div>
  );
}