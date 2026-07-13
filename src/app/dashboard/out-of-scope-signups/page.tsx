import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";

export default async function OutOfScopeSignupsPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) notFound();

  const signups = await prisma.outOfScopeSignup.findMany({
    include: { teacher: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Out-of-scope signups</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Onboarding responses from teachers whose setup (groups + venue-controlled schedule) this
          product isn&apos;t built for yet — worth reviewing periodically to see if there&apos;s a
          real second product hiding in here. Admin-only (set <code>ADMIN_EMAILS</code>).
        </p>
      </div>

      {signups.length === 0 ? (
        <p className="text-sm text-neutral-500">No out-of-scope signups yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {signups.map((s) => (
            <li key={s.id} className="px-4 py-3 text-sm">
              <p className="font-medium text-neutral-900">
                {s.email}
                {s.teacher && <span className="ml-2 text-xs text-neutral-500">({s.teacher.name})</span>}
              </p>
              <p className="mt-1 text-xs text-neutral-400">{s.createdAt.toLocaleString("en-GB")}</p>
              {s.freeTextAnswer && <p className="mt-1 text-neutral-700">{s.freeTextAnswer}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
