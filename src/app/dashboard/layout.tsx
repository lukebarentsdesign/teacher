import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "./sign-out-button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Calendar" },
  { href: "/dashboard/schools", label: "Schools" },
  { href: "/dashboard/students", label: "Students" },
  { href: "/dashboard/payers", label: "Payers" },
  { href: "/dashboard/timetable/new", label: "Generate timetable" },
  { href: "/dashboard/billing", label: "Billing" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6">
            <span className="font-semibold text-neutral-900">Learnio</span>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-600 transition-colors duration-150 hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-500">{session?.user?.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
