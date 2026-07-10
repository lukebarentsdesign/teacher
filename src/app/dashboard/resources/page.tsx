import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export default async function ResourcesPage() {
  const session = await auth();
  const resources = await prisma.resource.findMany({
    where: { teacherId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { student: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Resource library</h1>
        <Link
          href="/dashboard/resources/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          Add resource
        </Link>
      </div>

      {resources.length === 0 ? (
        <p className="text-sm text-neutral-500">No resources yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Attached to</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-neutral-900">
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {resource.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{resource.type}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {resource.student?.name ?? "General library"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
