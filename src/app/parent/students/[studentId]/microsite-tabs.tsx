"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { segment: string; label: string };

export function MicrositeTabs({ studentId, tabs }: { studentId: string; tabs: Tab[] }) {
  const pathname = usePathname();
  const base = `/parent/students/${studentId}`;

  return (
    <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-6 pb-2">
      {tabs.map((tab) => {
        const href = `${base}${tab.segment ? `/${tab.segment}` : ""}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.segment}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150 ${
              active
                ? "bg-brand-50 font-medium text-brand-700"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
