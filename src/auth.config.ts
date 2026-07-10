import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the NextAuth config — no Credentials provider here, since it pulls in
 * bcryptjs (a Node-only package) which breaks in the Edge runtime that middleware executes in.
 * The full config with providers lives in src/auth.ts, used by API routes and server actions.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
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
