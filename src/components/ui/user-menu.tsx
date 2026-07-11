"use client";

import { Menu } from "@base-ui/react/menu";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { signOutAction } from "@/app/dashboard/actions";
import { clearOfflineCache } from "@/lib/offline-cache";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ name }: { name: string }) {
  return (
    <Menu.Root>
      <Menu.Trigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-700 transition-colors duration-150 hover:bg-neutral-100 data-[popup-open]:bg-neutral-100">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
          {initials(name)}
        </span>
        <span className="hidden sm:inline">{name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end">
          <Menu.Popup className="w-48 rounded-lg border border-neutral-200 bg-white p-1 shadow-card outline-none">
            <Menu.Item
              render={<Link href="/dashboard/billing" />}
              className="block cursor-pointer rounded-md px-2.5 py-2 text-sm text-neutral-700 outline-none data-[highlighted]:bg-neutral-100"
            >
              Billing &amp; settings
            </Menu.Item>
            <Menu.Separator className="my-1 h-px bg-neutral-200" />
            <form action={signOutAction}>
              <button
                type="submit"
                onClick={() => void clearOfflineCache()}
                className="block w-full cursor-pointer rounded-md px-2.5 py-2 text-left text-sm text-neutral-700 outline-none hover:bg-neutral-100"
              >
                Sign out
              </button>
            </form>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
