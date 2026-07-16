import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Lightweight check for session token cookie
  const sessionToken = request.cookies.get("better-auth.session_token");

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Note: Authoritative session and permission validation MUST occur
  // within the protected API routes, Server Actions, and Server Components.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
