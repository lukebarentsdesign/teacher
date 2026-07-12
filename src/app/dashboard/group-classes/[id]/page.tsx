import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { AddMemberForm } from "./add-member-form";
import { RemoveMemberButton } from "./remove-member-button";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function GroupClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const groupClass = await prisma.groupClass.findFirst({
    where: { id, teacherId: session!.user.id },
    include: {
      location: true,
      room: true,
      subject: true,
      members: { where: { leftAt: null }, include: { student: true }, orderBy: { joinedAt: "asc" } },
    },
  });
  if (!groupClass) notFound();

  const memberStudentIds = groupClass.members.map((m) => m.studentId);
  const availableStudents = await prisma.student.findMany({
    where: { teacherId: session!.user.id, id: { notIn: memberStudentIds } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{groupClass.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {groupClass.discipline} · {groupClass.location.name} · {DAY_LABELS[groupClass.dayOfWeek]}{" "}
            {groupClass.startTime}–{groupClass.endTime}
            {groupClass.room ? ` · ${groupClass.room.label}` : ""}
          </p>
          {groupClass.subject && (
            <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
              {groupClass.subject.name}
            </span>
          )}
        </div>
        <Link
          href={`/dashboard/group-classes/${groupClass.id}/edit`}
          className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-100"
        >
          Edit
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Members</h2>
        {groupClass.members.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">No members yet.</p>
        ) : (
          <div className="mb-4 overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Student</th>
                  <th className="px-4 py-2 font-medium">Joined</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {groupClass.members.map((member) => (
                  <tr key={member.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-2 text-neutral-900">{member.student.name}</td>
                    <td className="px-4 py-2 text-neutral-600">
                      {member.joinedAt.toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <RemoveMemberButton memberId={member.id} groupClassId={groupClass.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AddMemberForm groupClassId={groupClass.id} students={availableStudents} />
      </section>
    </div>
  );
}
