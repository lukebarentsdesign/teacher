import { auth } from "@/auth";
import { DashboardChrome } from "./sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return <DashboardChrome userName={session?.user?.name ?? "Account"}>{children}</DashboardChrome>;
}
