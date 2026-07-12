import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { LinkPayerForm } from "./link-payer-form";
import { NewSubscriptionForm } from "./new-subscription-form";
import { AccessSettings } from "./access-settings";
import { IgCardSettings } from "./ig-card-settings";
import { SubjectsSettings } from "./subjects-settings";
import { NewAssessmentForm } from "./new-assessment-form";
import { DeclinePrivateTuitionRequestButton } from "./decline-private-tuition-request-button";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const student = await prisma.student.findFirst({
    where: { id, teacherId: session!.user.id },
    include: {
      location: true,
      payerLinks: { include: { payer: true }, orderBy: { isPrimary: "desc" } },
      subscriptions: { include: { payer: true }, orderBy: { startDate: "desc" } },
      assessments: { orderBy: { date: "desc" } },
      subjects: true,
    },
  });

  if (!student) notFound();

  const allPayers = await prisma.payer.findMany({
    where: { teacherId: session!.user.id },
    orderBy: { name: "asc" },
  });
  const allSubjects = await prisma.subject.findMany({
    where: { teacherId: session!.user.id },
    orderBy: { name: "asc" },
  });
  const linkedPayerIds = new Set(student.payerLinks.map((link) => link.payerId));
  const unlinkedPayers = allPayers.filter((payer) => !linkedPayerIds.has(payer.id));

  const assessmentRooms = student.locationId
    ? await prisma.room.findMany({ where: { locationId: student.locationId }, orderBy: { label: "asc" } })
    : [];

  const pendingPrivateTuitionRequest = student.locationId
    ? await prisma.privateTuitionRequest.findFirst({ where: { studentId: student.id, status: "PENDING" } })
    : null;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{student.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {student.discipline} · {student.source} · {student.location?.name ?? "Home student"}
          </p>
        </div>
        <Link
          href={`/dashboard/students/${student.id}/edit`}
          className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-100"
        >
          Edit
        </Link>
      </div>
      <div>
        {student.subjects.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {student.subjects.map((subject) => (
              <span
                key={subject.id}
                className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700"
              >
                {subject.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {pendingPrivateTuitionRequest && (
        <section className="rounded-xl bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            {student.name}&apos;s guardian has requested to convert this to a private-tuition relationship.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/dashboard/students/${student.id}/private-tuition-request`}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
            >
              Review &amp; accept
            </Link>
            <DeclinePrivateTuitionRequestButton requestId={pendingPrivateTuitionRequest.id} studentId={student.id} />
          </div>
        </section>
      )}

      <section id="payers" className="scroll-mt-20">
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Payer(s)</h2>
        {student.payerLinks.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">No payer linked yet.</p>
        ) : (
          <ul className="mb-4 space-y-2 text-sm text-neutral-700">
            {student.payerLinks.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center gap-2">
                <Link href={`/dashboard/payers/${link.payer.id}`} className="text-neutral-900 hover:underline">
                  {link.payer.name}
                </Link>
                {link.isPrimary && student.payerLinks.length > 1 && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">primary</span>
                )}
                {student.payerLinks.length > 1 && link.splitPercent != null && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                    {link.splitPercent.toString()}% split
                  </span>
                )}
                {link.payer.isEmergencyContactOnly && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                    contact only — not billed
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {unlinkedPayers.length > 0 && (
          <LinkPayerForm studentId={student.id} payers={unlinkedPayers} />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Subscriptions</h2>
        {student.subscriptions.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">No subscription yet.</p>
        ) : (
          <div className="mb-4 overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Payer</th>
                  <th className="px-4 py-3 font-medium">Billing model</th>
                  <th className="px-4 py-3 font-medium">Annual fee</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {student.subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-900">
                      <Link
                        href={`/dashboard/subscriptions/${sub.id}`}
                        className="hover:underline"
                      >
                        {sub.payer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{sub.billingModel}</td>
                    <td className="px-4 py-3 text-neutral-500">£{sub.annualFee.toString()}</td>
                    <td className="px-4 py-3 text-neutral-500">{sub.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {student.payerLinks.length > 0 && (
          <NewSubscriptionForm studentId={student.id} payers={student.payerLinks.map((l) => l.payer)} />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Assessments</h2>
        {student.assessments.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">No assessments yet.</p>
        ) : (
          <div className="mb-4 overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Exam board</th>
                  <th className="px-4 py-3 font-medium">Can continue</th>
                </tr>
              </thead>
              <tbody>
                {student.assessments.map((a) => (
                  <tr key={a.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-900">{a.level}</td>
                    <td className="px-4 py-3 text-neutral-500">{a.date.toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3 text-neutral-500">{a.examBoard ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-500">{a.canContinue ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <NewAssessmentForm studentId={student.id} rooms={assessmentRooms} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Subjects taught</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Tag every subject this student is taught — a student can span more than one. Use these
          tags to group or filter students (and the lessons they need) on the Students list.
        </p>
        <SubjectsSettings
          studentId={student.id}
          allSubjects={allSubjects}
          selectedIds={student.subjects.map((s) => s.id)}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Check-in</h2>
        <IgCardSettings studentId={student.id} igCardId={student.igCardId} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Microsite access</h2>
        <AccessSettings
          studentId={student.id}
          dob={student.dob ? student.dob.toISOString() : null}
          hasIndependentAccess={student.hasIndependentAccess}
          studentAccessCode={student.studentAccessCode}
          shareBalanceWithStudent={student.shareBalanceWithStudent}
        />
      </section>
    </div>
  );
}
