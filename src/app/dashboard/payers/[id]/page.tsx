import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ageInYears } from "@/lib/age";
import { RegenerateCodeButton } from "../regenerate-code-button";
import { SendEmailForm } from "./send-email-form";

const CONTACT_PREF_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
  EMAIL: "Email",
};

export default async function PayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const [payer, teacher] = await Promise.all([
    prisma.payer.findFirst({
      where: { id, teacherId: session!.user.id },
      include: {
        studentLinks: {
          include: {
            student: {
              include: {
                school: true,
                subscriptions: { orderBy: { startDate: "desc" }, take: 1 },
              },
            },
          },
        },
      },
    }),
    prisma.teacher.findUniqueOrThrow({ where: { id: session!.user.id } }),
  ]);

  if (!payer) notFound();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{payer.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {[payer.phone, payer.email].filter(Boolean).join(" · ") || "No contact details on file"}
          {payer.isEmergencyContactOnly && " · Emergency contact only (not billed)"}
          {payer.isSelf && " · Self-paying student"}
        </p>
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-500">Preferred contact</p>
            <p className="text-neutral-900">
              {payer.contactPref ? CONTACT_PREF_LABEL[payer.contactPref] : "—"}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">Microsite access code</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-base tracking-widest text-neutral-900">{payer.accessCode}</span>
              <RegenerateCodeButton payerId={payer.id} />
            </div>
          </div>
          {payer.notes && (
            <div className="col-span-2">
              <p className="text-neutral-500">Notes</p>
              <p className="whitespace-pre-wrap text-neutral-900">{payer.notes}</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Send an email</h2>
        {!payer.email ? (
          <p className="text-sm text-neutral-500">This payer has no email address on file.</p>
        ) : !teacher.gmailConnected ? (
          <p className="rounded-xl bg-white p-4 text-sm text-neutral-500 shadow-sm">
            <Link href="/dashboard/billing" className="text-neutral-900 underline">
              Connect Gmail
            </Link>{" "}
            first so you can email guardians from here.
          </p>
        ) : (
          <SendEmailForm payerId={payer.id} />
        )}
      </section>

      <section id="pupils" className="scroll-mt-20">
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Pupils</h2>
        {payer.studentLinks.length === 0 ? (
          <p className="text-sm text-neutral-500">No pupils linked to this payer yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Pupil</th>
                  <th className="px-4 py-3 font-medium">Age</th>
                  <th className="px-4 py-3 font-medium">School</th>
                  <th className="px-4 py-3 font-medium">Subscription</th>
                </tr>
              </thead>
              <tbody>
                {payer.studentLinks.map((link) => {
                  const sub = link.student.subscriptions[0];
                  return (
                    <tr key={link.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3 text-neutral-900">
                        <Link href={`/dashboard/students/${link.student.id}`} className="hover:underline">
                          {link.student.name}
                        </Link>
                        {link.splitPercent != null && (
                          <span className="ml-2 text-xs text-neutral-400">{link.splitPercent.toString()}% split</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {link.student.dob ? ageInYears(link.student.dob) : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{link.student.school?.name ?? "Home"}</td>
                      <td className="px-4 py-3 text-neutral-500">{sub ? sub.status : "None"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
