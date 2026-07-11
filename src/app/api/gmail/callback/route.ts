import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectGmailAccount } from "@/lib/gmail";

const STATE_COOKIE = "gmail_oauth_state";

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const redirectBase = new URL("/dashboard/billing", request.url);

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    redirectBase.searchParams.set("gmail", "error");
    return NextResponse.redirect(redirectBase);
  }

  try {
    await connectGmailAccount(session.user.id, code);
    redirectBase.searchParams.set("gmail", "connected");
  } catch {
    redirectBase.searchParams.set("gmail", "error");
  }

  return NextResponse.redirect(redirectBase);
}
