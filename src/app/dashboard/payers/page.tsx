import Link from "next/link";
import { prisma } from "@/lib/db";
import { RegenerateCodeButton } from "./regenerate-code-button";

export default async function PayersPage() {
  const payers = await prisma.payer.findMany({
    orderBy: { name: "asc" },
    include: { studentLinks: { include: { student: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Guardians / payers</h1>
        <Link
          href="/dashboard/payers/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          Add payer
        </Link>
      </div>

      {payers.length === 0 ? (
        <p className="text-sm text-neutral-500">No payers yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Students</th>
                <th className="px-4 py-3 font-medium">Microsite access code</th>
              </tr>
            </thead>
            <tbody>
              {payers.map((payer) => (
                <tr key={payer.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-neutral-900">{payer.name}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {payer.studentLinks.map((link) => link.student.name).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base tracking-widest text-neutral-900">
                        {payer.accessCode}
                      </span>
                      <RegenerateCodeButton payerId={payer.id} />
                    </div>
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
