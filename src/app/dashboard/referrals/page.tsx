import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export default async function ReferralsPage() {
  const session = await auth();

  const students = await prisma.student.findMany({
    where: { teacherId: session!.user.id, referredBy: { not: null } },
    orderBy: { referredBy: "asc" },
    select: { id: true, name: true, referredBy: true },
  });

  const byReferrer = new Map<string, { id: string; name: string }[]>();
  for (const s of students) {
    if (!s.referredBy) continue;
    const list = byReferrer.get(s.referredBy) ?? [];
    list.push({ id: s.id, name: s.name });
    byReferrer.set(s.referredBy, list);
  }

  const sorted = [...byReferrer.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Referrals</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Who&apos;s sending you students — set &quot;Referred by&quot; on a student&apos;s edit
          page to track it.
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No referrals recorded yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {sorted.map(([referrer, referredStudents]) => (
            <li key={referrer} className="px-4 py-3 text-sm">
              <p className="font-medium text-neutral-900">
                {referrer}
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                  {referredStudents.length}
                </span>
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {referredStudents.map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && ", "}
                    <Link href={`/dashboard/students/${s.id}`} className="hover:underline">
                      {s.name}
                    </Link>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
