import { auth } from "@/auth";
import { SignOutButton } from "./sign-out-button";
import { NavLinks } from "./nav-links";

// Setup: occasional, guided configuration — schools, students, contracts, account-level billing.
// Operations: daily-use surface — schedule, day-to-day money, equipment. Split is a labeling/
// grouping change only; no page content or flow behavior differs between the two groups yet.
const SETUP_LINKS = [
  { href: "/dashboard/schools", label: "Schools" },
  { href: "/dashboard/students", label: "Students" },
  { href: "/dashboard/payers", label: "Payers" },
  { href: "/dashboard/contract", label: "Contract" },
  { href: "/dashboard/billing", label: "Billing" },
];

const OPERATIONS_LINKS = [
  { href: "/dashboard", label: "Calendar" },
  { href: "/dashboard/timetable/new", label: "Generate timetable" },
  { href: "/dashboard/lessons", label: "Lessons" },
  { href: "/dashboard/absences", label: "Absences" },
  { href: "/dashboard/loans", label: "Loans" },
  { href: "/dashboard/maintenance", label: "Maintenance" },
  { href: "/dashboard/payments", label: "Get paid" },
  { href: "/dashboard/forecast", label: "Forecast" },
  { href: "/dashboard/resources", label: "Resources" },
  { href: "/dashboard/assignments", label: "Assignments" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex w-full items-center justify-between sm:w-auto">
            <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-neutral-900">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-600 text-xs font-bold text-white">
                L
              </span>
              Learnio
            </span>
            <div className="flex items-center gap-3 sm:hidden">
              <span className="text-sm text-neutral-500">{session?.user?.name}</span>
              <SignOutButton />
            </div>
          </div>
          <NavLinks setupLinks={SETUP_LINKS} operationsLinks={OPERATIONS_LINKS} />
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-sm text-neutral-500">{session?.user?.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
