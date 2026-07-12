import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewAddOnForm } from "./new-addon-form";
import { ArchiveAddOnButton } from "./archive-addon-button";

export default async function AddOnsPage() {
  const session = await auth();
  const addOns = await prisma.addOn.findMany({
    where: { teacherId: session!.user.id, archivedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Add-ons</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Extras like instrument hire or sheet music — attach these to a lesson from its detail page
          without touching the subscription/billing model.
        </p>
      </div>

      {addOns.length === 0 ? (
        <p className="text-sm text-neutral-500">No add-ons yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {addOns.map((addOn) => (
                <tr key={addOn.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-neutral-900">{addOn.name}</td>
                  <td className="px-4 py-3 text-neutral-500">£{addOn.price.toString()}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {addOn.chargeUnit === "PER_BOOKING" ? "Per booking" : "Per hour"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {addOn.visibility === "PUBLIC" ? "Public" : "Private"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ArchiveAddOnButton addOnId={addOn.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewAddOnForm />
    </div>
  );
}
