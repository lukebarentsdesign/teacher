import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewIncidentForm } from "./new-incident-form";
import { DeleteIncidentButton } from "./delete-incident-button";
import { hasModule } from "@/lib/modules";

export default async function IncidentsPage() {
  const session = await auth();
  const moduleEnabled = await hasModule(session!.user.id, "COMPLIANCE");

  const [incidents, students] = await Promise.all([
    prisma.incidentLog.findMany({
      where: { teacherId: session!.user.id },
      include: { student: true },
      orderBy: { date: "desc" },
    }),
    prisma.student.findMany({
      where: { teacherId: session!.user.id, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Incident log</h1>
        <p className="mt-1 text-sm text-neutral-500">
          A safeguarding/liability record, separate from lesson notes — never shown to guardians or
          students.
        </p>
      </div>

      {incidents.length === 0 ? (
        <p className="text-sm text-neutral-500">No incidents logged.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {incidents.map((incident) => (
            <li key={incident.id} className="px-4 py-3 text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-neutral-900">
                    {incident.date.toLocaleDateString("en-GB")}
                    {incident.student && (
                      <>
                        {" · "}
                        <Link href={`/dashboard/students/${incident.student.id}`} className="hover:underline">
                          {incident.student.name}
                        </Link>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-neutral-700">{incident.description}</p>
                  {incident.actionTaken && (
                    <p className="mt-1 text-xs text-neutral-500">Action taken: {incident.actionTaken}</p>
                  )}
                  {incident.reportedToWhom && (
                    <p className="text-xs text-neutral-500">Reported to: {incident.reportedToWhom}</p>
                  )}
                </div>
                <DeleteIncidentButton incidentId={incident.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {moduleEnabled ? (
        <NewIncidentForm students={students} />
      ) : (
        <p className="text-sm text-neutral-500">
          The Compliance &amp; safety module isn&apos;t enabled on this account, so new incidents
          can&apos;t be logged here — get in touch if you&apos;d like it switched on.
        </p>
      )}
    </div>
  );
}
