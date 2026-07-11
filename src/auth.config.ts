import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the NextAuth config — no Credentials provider here, since it pulls in
 * bcryptjs (a Node-only package) which breaks in the Edge runtime that middleware executes in.
 * The full config with providers lives in src/auth.ts, used by API routes and server actions.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  // Needed once `next build && next start` is used (e.g. local production testing, or a host
  // without a fixed public URL known in advance) — without it Auth.js rejects the callback host
  // even when it matches NEXTAUTH_URL. Safe here: NEXTAUTH_URL is still what Stripe/Connect return
  // URLs are built from (see CLAUDE.md), this only affects Auth.js's own host-trust check.
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.teacherId = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.teacherId as string;
      }
      return session;
    },
  },
};
