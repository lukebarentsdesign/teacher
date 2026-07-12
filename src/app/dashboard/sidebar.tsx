"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Wand2,
  BookOpen,
  CalendarX,
  CalendarOff,
  ScanLine,
  Tag,
  Music,
  Package,
  Wrench,
  Banknote,
  TrendingUp,
  FolderOpen,
  ClipboardList,
  Building2,
  Users,
  Users2,
  Wallet,
  FileText,
  Settings,
  Menu as MenuIcon,
  X,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { UserMenu } from "@/components/ui/user-menu";
import { GlobalSearch } from "@/components/ui/global-search";

type NavLink = { href: string; label: string; icon: LucideIcon };

// Setup: occasional, guided configuration — schools, students, contracts, account-level billing.
// Operations: daily-use surface — schedule, day-to-day money, equipment.
const SETUP_LINKS: NavLink[] = [
  { href: "/dashboard/schools", label: "Schools", icon: Building2 },
  { href: "/dashboard/subjects", label: "Subjects", icon: Music },
  { href: "/dashboard/students", label: "Students", icon: Users },
  { href: "/dashboard/payers", label: "Payers", icon: Wallet },
  { href: "/dashboard/addons", label: "Add-ons", icon: Tag },
  { href: "/dashboard/contract", label: "Contract", icon: FileText },
  { href: "/dashboard/billing", label: "Billing", icon: Settings },
];

const OPERATIONS_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/today", label: "Today", icon: Wifi },
  { href: "/dashboard/checkin", label: "Check in", icon: ScanLine },
  { href: "/dashboard/timetable/new", label: "Generate timetable", icon: Wand2 },
  { href: "/dashboard/lessons", label: "Lessons", icon: BookOpen },
  { href: "/dashboard/group-classes", label: "Group classes", icon: Users2 },
  { href: "/dashboard/absences", label: "Absences", icon: CalendarX },
  { href: "/dashboard/unavailability", label: "Unavailability", icon: CalendarOff },
  { href: "/dashboard/loans", label: "Loans", icon: Package },
  { href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/dashboard/payments", label: "Get paid", icon: Banknote },
  { href: "/dashboard/forecast", label: "Forecast", icon: TrendingUp },
  { href: "/dashboard/resources", label: "Resources", icon: FolderOpen },
  { href: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroup({
  label,
  links,
  pathname,
  onNavigate,
}: {
  label: string;
  links: NavLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      <div className="space-y-0.5">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                active
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-brand-600" : "text-neutral-400"}`} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-neutral-900">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-600 text-xs font-bold text-white">
        L
      </span>
      Learnio
    </span>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <Link href="/dashboard" className="px-1">
        <BrandMark />
      </Link>
      <NavGroup label="Operations" links={OPERATIONS_LINKS} pathname={pathname} onNavigate={onNavigate} />
      <NavGroup label="Setup" links={SETUP_LINKS} pathname={pathname} onNavigate={onNavigate} />
    </div>
  );
}

export function DashboardChrome({ userName, children }: { userName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Desktop: persistent sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-neutral-200 bg-white sm:block">
        <SidebarContent pathname={pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Full-width top bar: hamburger+brand (mobile only), global search, user menu. */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white/90 px-4 py-2.5 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3 sm:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-neutral-300 p-2 text-neutral-700"
              aria-label="Open menu"
            >
              <MenuIcon className="h-4 w-4" />
            </button>
            <BrandMark />
          </div>
          <div className="hidden flex-1 sm:block">
            <GlobalSearch />
          </div>
          <UserMenu name={userName} />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-neutral-900/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-card">
            <div className="flex items-center gap-2 px-3 pt-3">
              <div className="flex-1">
                <GlobalSearch onNavigate={() => setMobileOpen(false)} />
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
