import { auth } from "@/auth";
import { TodayView } from "./today-view";

export default async function TodayPage() {
  const session = await auth();
  return <TodayView teacherId={session!.user.id} />;
}
