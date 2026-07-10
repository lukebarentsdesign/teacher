"use server";

import { redirect } from "next/navigation";
import { clearMicrositeSession } from "@/lib/microsite-session";

export async function micrositeSignOutAction() {
  await clearMicrositeSession();
  redirect("/parent/login");
}
