import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import {
  BUILT_IN_INVOICING_TARGET_OPTIONS,
  BUILT_IN_LOCATION_TYPE_OPTIONS,
  INVOICING_TARGET_CATEGORY_LABELS,
  LOCATION_TYPE_CATEGORY_LABELS,
} from "@/lib/location-types";
import { getAllInvoicingTargetOptions, getAllLocationTypeOptions } from "@/lib/menu-choice-options";
import { InvoicingTargetOptionsList } from "./invoicing-target-options-list";
import { LocationTypeOptionsList } from "./location-type-options-list";
import { NewInvoicingTargetOptionForm } from "./new-invoicing-target-option-form";
import { NewLocationTypeOptionForm } from "./new-location-type-option-form";

export default async function MenuChoicesPage() {
  const session = await auth();
  const teacherId = session!.user.id;
  const [locationTypeOptions, invoicingTargetOptions] = await Promise.all([
    getAllLocationTypeOptions(teacherId),
    getAllInvoicingTargetOptions(teacherId),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Menu choices</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Configure the choices that appear in setup menus. Built-ins stay available, and custom labels keep the underlying billing and scheduling category intact.
          </p>
        </div>
        <Link href="/dashboard/teaching-locations/new" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50">
          Add location
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">Built-in teaching location types</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {BUILT_IN_LOCATION_TYPE_OPTIONS.map((option) => (
            <div key={option.value} className="rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-sm font-medium text-neutral-900">{option.label}</div>
              <div className="mt-1 text-xs text-neutral-500">Category: {LOCATION_TYPE_CATEGORY_LABELS[option.value]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">Built-in billing choices</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {BUILT_IN_INVOICING_TARGET_OPTIONS.map((option) => (
            <div key={option.value} className="rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-sm font-medium text-neutral-900">{option.label}</div>
              <div className="mt-1 text-xs text-neutral-500">Bills like: {INVOICING_TARGET_CATEGORY_LABELS[option.invoicingTarget]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Your venue types</h2>
          <p className="mt-1 text-sm text-neutral-500">
            These are added to the Type dropdown on teaching locations. Hidden choices disappear from new forms but do not rewrite existing locations.
          </p>
        </div>
        <LocationTypeOptionsList options={locationTypeOptions} />
      </section>

      <NewLocationTypeOptionForm />

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Your billing choices</h2>
          <p className="mt-1 text-sm text-neutral-500">
            These are added to the &quot;Who gets billed&quot; dropdown. Use Parent/student payer when the person paying is an individual, and School/venue payer when an organisation is billed.
          </p>
        </div>
        <InvoicingTargetOptionsList options={invoicingTargetOptions} />
      </section>

      <NewInvoicingTargetOptionForm />
    </div>
  );
}