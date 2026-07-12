import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export default async function TeachingLocationsPage() {
  const session = await auth();
  const links = await prisma.teacherLocationLink.findMany({
    where: { teacherId: session!.user.id },
    include: { location: true },
    orderBy: { location: { name: "asc" } },
  });
  const locations = links.map((link) => link.location);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Teaching locations</h1>
        <Link
          href="/dashboard/teaching-locations/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          Add teaching location
        </Link>
      </div>

      {locations.length === 0 ? (
        <p className="text-sm text-neutral-500">No teaching locations yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Invoicing target</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-neutral-900">
                    <Link
                      href={`/dashboard/teaching-locations/${location.id}`}
                      className="hover:underline"
                    >
                      {location.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{location.address ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-500">{location.invoicingTarget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
