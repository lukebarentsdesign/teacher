"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  GraduationCap, LayoutDashboard, Calendar, CreditCard, 
  Tag, BookOpen, MessageSquare, ClipboardList, 
  FolderOpen, Wrench, LogOut, Menu, X, Bell, TrendingUp,
  type LucideIcon
} from "lucide-react";
import { micrositeSignOutAction } from "@/app/parent/actions";
import { Logo } from "@/components/landing/logo";

type TabLink = {
  segment: string;
  label: string;
  icon: LucideIcon;
};

export function ParentChrome({
  studentId,
  studentName,
  viewerType,
  canSeeLedger,
  children,
}: {
  studentId: string;
  studentName: string;
  viewerType: string;
  canSeeLedger: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const base = `/parent/students/${studentId}`;

  const tabs: TabLink[] = [
    { segment: "", label: "Dashboard", icon: LayoutDashboard },
    { segment: "calendar", label: "Schedule", icon: Calendar },
    ...(canSeeLedger ? [{ segment: "ledger", label: "Payment Info", icon: CreditCard }] : []),
    { segment: "extras", label: "Registration", icon: Tag },
    { segment: "courses", label: "Courses", icon: BookOpen },
    { segment: "progress", label: "Progress", icon: TrendingUp },
    { segment: "notes", label: "Notice", icon: MessageSquare },
    { segment: "assignments", label: "Assignments", icon: ClipboardList },
    { segment: "resources", label: "Resources", icon: FolderOpen },
    { segment: "maintenance", label: "Maintenance", icon: Wrench },
  ];

  const getHref = (segment: string) => `${base}${segment ? `/${segment}` : ""}`;
  const isActive = (segment: string) => {
    const href = getHref(segment);
    if (segment === "") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinks = (onNavigate?: () => void) => (
    <nav className="space-y-1">
      {tabs.map((tab) => {
        const active = isActive(tab.segment);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.segment}
            href={getHref(tab.segment)}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              active
                ? "bg-white/20 text-white shadow-inner"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-white" : "text-white/60"}`} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#faf9f7] text-neutral-800">
      
      {/* Desktop Sidebar (Purple) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-gradient-to-b from-[#8b5cf6] to-[#5b21b6] text-white border-r border-[#7c3aed] md:flex flex-col p-5 z-20">
        {/* Logo Branding */}
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">
          <Logo size={28} wordmarkClassName="text-lg text-white font-bold" />
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto pr-1">
          {navLinks()}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-3">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white border border-white/10">
              {studentName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-normal">{studentName}</p>
              <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wider truncate leading-none mt-0.5">
                {viewerType}
              </p>
            </div>
          </div>
          <form action={micrositeSignOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-colors"
            >
              <LogOut className="h-4.5 w-4.5 text-white/60" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Header / Navigation */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 bg-white border-b border-neutral-200/80 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-1 hover:bg-neutral-100 rounded-lg md:hidden"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5 text-neutral-600" />
            </button>
            <div className="min-w-0 md:block hidden">
              <span className="text-sm font-bold text-neutral-800">Learnio Student Portal</span>
            </div>
          </div>

          {/* Search bar inside header */}
          <div className="flex-1 max-w-sm mx-4 md:block hidden">
            <input 
              type="search" 
              placeholder="Search..." 
              className="w-full bg-neutral-100/80 rounded-xl px-4 py-1.5 text-xs font-medium border border-neutral-200/40 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all placeholder-neutral-400"
            />
          </div>

          {/* User info, notification, avatar */}
          <div className="flex items-center gap-3.5">
            <button type="button" className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg relative" title="Notifications">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-brand-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-neutral-800">{studentName}</p>
                <p className="text-[9px] text-neutral-400 font-semibold">{viewerType}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-extrabold shadow-sm border border-brand-200">
                {studentName[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile slide-out drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative flex flex-col w-64 max-w-xs h-full bg-gradient-to-b from-[#8b5cf6] to-[#5b21b6] text-white p-5 shadow-2xl">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 text-white/80"
                title="Close Navigation"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                <Logo size={28} wordmarkClassName="text-lg text-white font-bold" />
              </div>

              <div className="flex-1 overflow-y-auto">
                {navLinks(() => setMobileOpen(false))}
              </div>

              <div className="pt-4 border-t border-white/10">
                <form action={micrositeSignOutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <LogOut className="h-4.5 w-4.5 text-white/60" />
                    Sign Out
                  </button>
                </form>
              </div>
            </aside>
          </div>
        )}

        {/* Main child viewport */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
