"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroup({ label, links, pathname }: { label: string; links: NavLink[]; pathname: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </span>
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150 ${
              active
                ? "bg-brand-50 font-medium text-brand-700"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

export function NavLinks({ setupLinks, operationsLinks }: { setupLinks: NavLink[]; operationsLinks: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 sm:hidden"
        aria-expanded={open}
      >
        {open ? "Close" : "Menu"}
      </button>

      <nav className={`${open ? "flex" : "hidden"} w-full flex-col gap-2 sm:flex sm:w-auto sm:flex-1`}>
        <NavGroup label="Operations" links={operationsLinks} pathname={pathname} />
        <NavGroup label="Setup" links={setupLinks} pathname={pathname} />
      </nav>
    </>
  );
}
