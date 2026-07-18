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
  MessageSquare,
  HelpCircle,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { UserMenu } from "@/components/ui/user-menu";
import { GlobalSearch } from "@/components/ui/global-search";

type NavLink = { href: string; label: string; icon: LucideIcon };
export type Archetype = "SOLO" | "GROUP_INDEPENDENT" | null;

const CAT_OPERATIONS_LIST: NavLink[] = [
  { href: "/dashboard", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/lessons", label: "Lessons", icon: BookOpen },
];

const CAT_CLIENTS_LIST: NavLink[] = [
  { href: "/dashboard/students", label: "Students", icon: Users },
  { href: "/dashboard/payers", label: "Payers", icon: Wallet },
];

const CAT_SETUP_LIST: NavLink[] = [
  { href: "/dashboard/teaching-locations", label: "Teaching locations", icon: Building2 },
  { href: "/dashboard/lesson-types", label: "Lesson types", icon: ListMusic },
  { href: "/dashboard/term-calendars", label: "Term calendars", icon: CalendarRange },
  { href: "/dashboard/contract", label: "Contract", icon: FileText },
];

const CAT_BUSINESS_LIST: NavLink[] = [
  { href: "/dashboard/quick-invoice", label: "Quick Invoice", icon: FileText },
  { href: "/dashboard/forecast", label: "Forecast", icon: TrendingUp },
  { href: "/dashboard/accounting-export", label: "Accounting export", icon: FileSpreadsheet },
  { href: "/dashboard/billing", label: "Billing & profile", icon: Settings },
];

const CAT_COMING_SOON_LIST: NavLink[] = [
  { href: "/dashboard/coming-soon", label: "Future features", icon: Sparkles },
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
        active
          ? "bg-white/15 text-white font-medium shadow-sm"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-white/50"}`} />
      {link.label}
    </Link>
  );
}

function SidebarCategory({
  label,
  links,
  coreHrefs,
  pathname,
  onNavigate,
  defaultOpen = false,
}: {
  label: string;
  links: NavLink[];
  coreHrefs: Set<string>;
  pathname: string;
  onNavigate?: () => void;
  defaultOpen?: boolean;
}) {
  const coreLinks = links.filter((l) => coreHrefs.has(l.href));
  const moreLinks = links.filter((l) => !coreHrefs.has(l.href));

  // Determine if any link in this category is currently active
  const isAnyActive = links.some((l) => isActive(pathname, l.href));
  const [open, setOpen] = useState(defaultOpen || isAnyActive);
  const [showMore, setShowMore] = useState(moreLinks.some((l) => isActive(pathname, l.href)));

  if (links.length === 0) return null;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-0.5 pl-1.5 border-l border-white/5 ml-3">
          {coreLinks.map((link) => (
            <NavLinkItem key={link.href} link={link} pathname={pathname} onNavigate={onNavigate} />
          ))}

          {moreLinks.length > 0 && (
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setShowMore((s) => !s)}
                className="flex w-full items-center justify-between px-3 py-1 text-[10px] font-semibold text-white/45 hover:text-white/70 transition-colors"
              >
                <span>{showMore ? "Show less" : "Show more"}</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${showMore ? "rotate-180" : ""}`} />
              </button>
              
              {showMore &&
                moreLinks.map((link) => (
                  <NavLinkItem key={link.href} link={link} pathname={pathname} onNavigate={onNavigate} />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { Logo } from "@/components/landing/logo";

function BrandMark() {
  return <Logo size={28} wordmarkClassName="text-lg text-white font-bold" />;
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
  const coreHrefs = new Set<string>([
    "/dashboard",
    "/dashboard/lessons",
    "/dashboard/students",
    "/dashboard/payers",
    "/dashboard/teaching-locations",
    "/dashboard/lesson-types",
    "/dashboard/term-calendars",
    "/dashboard/contract",
    "/dashboard/forecast",
    "/dashboard/accounting-export",
    "/dashboard/billing",
    "/dashboard/coming-soon",
  ]);

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <Link href="/dashboard" className="px-1">
        <BrandMark />
      </Link>

      <div className="space-y-4 flex-1">
        <SidebarCategory
          label="Operations"
          links={CAT_OPERATIONS_LIST}
          coreHrefs={coreHrefs}
          pathname={pathname}
          onNavigate={onNavigate}
          defaultOpen={true}
        />
        <SidebarCategory
          label="Students & Families"
          links={CAT_CLIENTS_LIST}
          coreHrefs={coreHrefs}
          pathname={pathname}
          onNavigate={onNavigate}
          defaultOpen={true}
        />
        <SidebarCategory
          label="Teaching Setup"
          links={CAT_SETUP_LIST}
          coreHrefs={coreHrefs}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <SidebarCategory
          label="Business & Admin"
          links={CAT_BUSINESS_LIST}
          coreHrefs={coreHrefs}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <SidebarCategory
          label="Coming Soon"
          links={CAT_COMING_SOON_LIST}
          coreHrefs={coreHrefs}
          pathname={pathname}
          onNavigate={onNavigate}
          defaultOpen={true}
        />
      </div>

      {/* Assistance Banner */}
      <div className="mt-auto px-1 pt-4 border-t border-white/10">
        <div className="relative overflow-hidden rounded-xl bg-white/10 p-4 border border-white/5 shadow-inner">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/90">Need assistance?</span>
            <span className="text-[10px] text-white/60 leading-normal">Access resources, class setups, and guides instantly.</span>
            <Link href="/dashboard/resources" onClick={onNavigate} className="mt-2 text-center text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
              Open Resources
            </Link>
          </div>
          <div className="absolute -right-3 -bottom-3 h-12 w-12 rounded-full bg-white/5 pointer-events-none" />
        </div>
      </div>
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
    <div className="flex min-h-screen bg-[#faf9f7]">
      {/* Desktop: persistent sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 bg-gradient-to-b from-[#1b4bbd] to-[#12368c] text-white border-r border-[#10308c] sm:block">
        <SidebarContent pathname={pathname} archetype={archetype} earnedPhase3Keys={earnedPhase3Keys} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Full-width top bar: hamburger+brand (mobile only), school switcher, search, help widgets, user menu. */}
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
            <Logo size={28} showWordmark={false} />
          </div>

          <div className="hidden items-center gap-3 sm:flex mr-4 shrink-0">
            <button className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-colors shadow-sm">
              <span>ABC School</span>
              <span className="text-neutral-400 font-normal text-xs">⇄</span>
            </button>
          </div>

          <div className="hidden flex-1 sm:block max-w-xs">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Help & Support bubbles */}
            <button className="hidden sm:grid h-9 w-9 place-items-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors" title="Messages">
              <MessageSquare className="h-4 w-4" />
            </button>
            <button className="hidden sm:grid h-9 w-9 place-items-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors" title="Help Centre">
              <HelpCircle className="h-4 w-4" />
            </button>
            <UserMenu name={userName} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-neutral-900/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-gradient-to-b from-[#1b4bbd] to-[#12368c] text-white shadow-card animate-slide-in">
            <div className="flex items-center gap-2 px-3 pt-3 border-b border-white/10 pb-3">
              <div className="flex-1">
                <GlobalSearch onNavigate={() => setMobileOpen(false)} />
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
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
