import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getMicrositeSession } from "@/lib/microsite-session";

export default async function ParentHomePage() {
  const session = await getMicrositeSession();
  if (!session) redirect("/parent/login");

  if (session.type === "student") {
    redirect(`/parent/students/${session.studentId}`);
  }

  const links = await prisma.studentPayerLink.findMany({
    where: { payerId: session.payerId },
    include: { student: true },
    orderBy: { student: { name: "asc" } },
  });

  if (links.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <p className="text-sm text-neutral-500">No students linked to your account yet.</p>
      </div>
    );
  }

  if (links.length === 1) {
    redirect(`/parent/students/${links[0].studentId}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-xl font-semibold text-neutral-900">Choose a student</h1>
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.id}>
              <Link
                href={`/parent/students/${link.studentId}`}
                className="block rounded-lg border border-neutral-200 px-4 py-3 text-sm text-neutral-900 transition-colors duration-150 hover:bg-neutral-50"
              >
                {link.student.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
