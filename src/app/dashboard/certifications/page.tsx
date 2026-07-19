import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewCertificationForm } from "./new-certification-form";
import { DeleteCertificationButton } from "./delete-certification-button";
import { hasModule } from "@/lib/modules";

function expiryBadge(expiryDate: Date | null, reminderDaysBefore: number | null): { label: string; className: string } | null {
  if (!expiryDate) return null;
  const now = new Date();
  const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (daysLeft < 0) return { label: "Expired", className: "bg-red-50 text-red-700" };
  if (reminderDaysBefore != null && daysLeft <= reminderDaysBefore) {
    return { label: `Expires in ${daysLeft}d`, className: "bg-amber-50 text-amber-700" };
  }
  return null;
}

export default async function CertificationsPage() {
  const session = await auth();
  const moduleEnabled = await hasModule(session!.user.id, "COMPLIANCE");

  const certifications = await prisma.instructorCertification.findMany({
    where: { teacherId: session!.user.id },
    orderBy: [{ expiryDate: "asc" }, { certType: "asc" }],
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Certifications</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your own professional certifications and qualifications (first aid, safeguarding, DBS,
          instrument-specific teaching qualifications) with renewal-date tracking.
        </p>
      </div>

      {certifications.length === 0 ? (
        <p className="text-sm text-neutral-500">No certifications recorded yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {certifications.map((cert) => {
            const badge = expiryBadge(cert.expiryDate, cert.reminderDaysBefore);
            return (
              <li key={cert.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-neutral-900">
                    {cert.certType}
                    {cert.certNumber ? ` · ${cert.certNumber}` : ""}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Issued {cert.issuedDate.toLocaleDateString("en-GB")}
                    {cert.expiryDate ? ` · Expires ${cert.expiryDate.toLocaleDateString("en-GB")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {badge && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span>
                  )}
                  <DeleteCertificationButton certId={cert.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {moduleEnabled ? (
        <NewCertificationForm />
      ) : (
        <p className="text-sm text-neutral-500">
          The Compliance &amp; safety module isn&apos;t enabled on this account, so new
          certifications can&apos;t be added — get in touch if you&apos;d like it switched on.
        </p>
      )}
    </div>
  );
}
