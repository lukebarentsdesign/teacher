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
  CalendarRange,
  CalendarClock,
  ScanLine,
  Tag,
  Music,
  ListMusic,
  GraduationCap,
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
  ShieldCheck,
  AlertTriangle,
  Gift,
  Percent,
  FileSpreadsheet,
  Code2,
  PlayCircle,
  Building,
  Car,
  Receipt,
  ListPlus,
  Handshake,
  Route,
  Signpost,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { UserMenu } from "@/components/ui/user-menu";
import { GlobalSearch } from "@/components/ui/global-search";

type NavLink = { href: string; label: string; icon: LucideIcon };
export type Archetype = "SOLO" | "GROUP_INDEPENDENT" | null;

// Onboarding-ux-spec Section 5: a genuinely shorter nav per archetype, not everything with items
// greyed out. CORE is the always-visible short list; PHASE3 items are added dynamically once
// their usage-signal trigger fires (see src/app/dashboard/layout.tsx for the trigger checks);
// everything else lives in a collapsible "More" section — nothing built becomes unreachable, but
// the primary nav a fresh teacher sees stays short.
const CORE_SOLO: NavLink[] = [
  { href: "/dashboard", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/students", label: "Students", icon: Users },
  { href: "/dashboard/forecast", label: "Income", icon: TrendingUp },
  { href: "/dashboard/billing", label: "Settings", icon: Settings },
];

const CORE_GROUP: NavLink[] = [
  { href: "/dashboard", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/group-classes", label: "Classes", icon: Users2 },
  { href: "/dashboard/students", label: "Members", icon: Users },
  { href: "/dashboard/forecast", label: "Income", icon: TrendingUp },
  { href: "/dashboard/billing", label: "Settings", icon: Settings },
];

const PHASE3_LINKS: Record<string, NavLink> = {
  curriculum: { href: "/dashboard/curriculum-templates", label: "Curriculum templates", icon: GraduationCap },
  termCalendar: { href: "/dashboard/term-calendars", label: "Term calendars", icon: CalendarRange },
  waitlist: { href: "/dashboard/waitlist", label: "Waitlist", icon: ListPlus },
  certifications: { href: "/dashboard/certifications", label: "Certifications", icon: ShieldCheck },
  taxSeasonMileage: { href: "/dashboard/mileage", label: "Mileage", icon: Car },
  taxSeasonPack: { href: "/dashboard/tax-pack", label: "Tax pack", icon: Receipt },
};

// Everything else — always reachable, just not in the short primary list until earned above.
const ALL_LINKS: NavLink[] = [
  { href: "/dashboard/teaching-locations", label: "Teaching locations", icon: Building2 },
  { href: "/dashboard/term-calendars", label: "Term calendars", icon: CalendarRange },
  { href: "/dashboard/subjects", label: "Subjects", icon: Music },
  { href: "/dashboard/lesson-types", label: "Lesson types", icon: ListMusic },
  { href: "/dashboard/curriculum-templates", label: "Curriculum templates", icon: GraduationCap },
  { href: "/dashboard/courses", label: "Courses", icon: PlayCircle },
  { href: "/dashboard/embeds", label: "Onboarding widget", icon: Code2 },
  { href: "/dashboard/students", label: "Students", icon: Users },
  { href: "/dashboard/waitlist", label: "Waitlist", icon: ListPlus },
  { href: "/dashboard/referrals", label: "Referrals", icon: Handshake },
  { href: "/dashboard/payers", label: "Payers", icon: Wallet },
  { href: "/dashboard/addons", label: "Add-ons", icon: Tag },
  { href: "/dashboard/gift-cards", label: "Gift cards", icon: Gift },
  { href: "/dashboard/promo-codes", label: "Promo codes", icon: Percent },
  { href: "/dashboard/accounting-export", label: "Accounting export", icon: FileSpreadsheet },
  { href: "/dashboard/contract", label: "Contract", icon: FileText },
  { href: "/dashboard/certifications", label: "Certifications", icon: ShieldCheck },
  { href: "/dashboard/organisation", label: "Organisation", icon: Building },
  { href: "/dashboard/billing", label: "Billing", icon: Settings },
  { href: "/dashboard", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/today", label: "Today", icon: Wifi },
  { href: "/dashboard/route-check", label: "Route check", icon: Route },
  { href: "/dashboard/checkin", label: "Check in", icon: ScanLine },
  { href: "/dashboard/timetable/new", label: "Generate timetable", icon: Wand2 },
  { href: "/dashboard/timetable/bulk", label: "Bulk timetable", icon: CalendarClock },
  { href: "/dashboard/lessons", label: "Lessons", icon: BookOpen },
  { href: "/dashboard/group-classes", label: "Group classes", icon: Users2 },
  { href: "/dashboard/absences", label: "Absences", icon: CalendarX },
  { href: "/dashboard/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/dashboard/unavailability", label: "Unavailability", icon: CalendarOff },
  { href: "/dashboard/loans", label: "Loans", icon: Package },
  { href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/dashboard/payments", label: "Get paid", icon: Banknote },
  { href: "/dashboard/forecast", label: "Forecast", icon: TrendingUp },
  { href: "/dashboard/mileage", label: "Mileage", icon: Car },
  { href: "/dashboard/travel-times", label: "Travel times", icon: Signpost },
  { href: "/dashboard/tax-pack", label: "Tax pack", icon: Receipt },
  { href: "/dashboard/resources", label: "Resources", icon: FolderOpen },
  { href: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinkItem({ link, pathname, onNavigate }: { link: NavLink; pathname: string; onNavigate?: () => void }) {
  const active = isActive(pathname, link.href);
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
        active ? "bg-brand-50 font-medium text-brand-700" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-brand-600" : "text-neutral-400"}`} />
      {link.label}
    </Link>
  );
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
  if (links.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{label}</p>
      <div className="space-y-0.5">
        {links.map((link) => (
          <NavLinkItem key={link.href} link={link} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

function MoreSection({ links, pathname, onNavigate }: { links: NavLink[]; pathname: string; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  if (links.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-1.5 flex w-full items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 hover:text-neutral-600"
      >
        More
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-0.5">
          {links.map((link) => (
            <NavLinkItem key={link.href} link={link} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      )}
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

function SidebarContent({
  pathname,
  archetype,
  earnedPhase3Keys,
  onNavigate,
}: {
  pathname: string;
  archetype: Archetype;
  earnedPhase3Keys: string[];
  onNavigate?: () => void;
}) {
  // No archetype recorded (a pre-existing account from before this onboarding flow, or someone
  // mid-onboarding) — fall back to the full historical list rather than guessing a short nav for
  // an archetype we don't actually know, so existing usage habits aren't disrupted.
  if (!archetype) {
    return (
      <div className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
        <Link href="/dashboard" className="px-1">
          <BrandMark />
        </Link>
        <NavGroup label="Everything" links={ALL_LINKS} pathname={pathname} onNavigate={onNavigate} />
      </div>
    );
  }

  const core = archetype === "GROUP_INDEPENDENT" ? CORE_GROUP : CORE_SOLO;
  const phase3Links = earnedPhase3Keys.map((key) => PHASE3_LINKS[key]).filter((l): l is NavLink => !!l);
  const primaryHrefs = new Set([...core, ...phase3Links].map((l) => l.href));
  const moreLinks = ALL_LINKS.filter((l) => !primaryHrefs.has(l.href));

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <Link href="/dashboard" className="px-1">
        <BrandMark />
      </Link>
      <NavGroup label="Menu" links={[...core, ...phase3Links]} pathname={pathname} onNavigate={onNavigate} />
      <MoreSection links={moreLinks} pathname={pathname} onNavigate={onNavigate} />
    </div>
  );
}

export function DashboardChrome({
  userName,
  archetype,
  earnedPhase3Keys,
  children,
}: {
  userName: string;
  archetype: Archetype;
  earnedPhase3Keys: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Desktop: persistent sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-neutral-200 bg-white sm:block">
        <SidebarContent pathname={pathname} archetype={archetype} earnedPhase3Keys={earnedPhase3Keys} />
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
            <SidebarContent
              pathname={pathname}
              archetype={archetype}
              earnedPhase3Keys={earnedPhase3Keys}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
