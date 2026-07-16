import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { admin, organization } from "better-auth/plugins";
import bcrypt from "bcryptjs";

const bAuth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => {
        return bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return bcrypt.compare(password, hash);
      },
    }
  },
  plugins: [
    admin(),
    organization()
  ]
});

export type LegacyAuthSession = Awaited<ReturnType<typeof bAuth.api.getSession>>;

/**
 * Temporary Better Auth migration bridge for legacy NextAuth-style `await auth()` call sites.
 *
 * Return shape is exactly Better Auth's `api.getSession` result:
 * - authenticated: `{ user, session }`
 * - unauthenticated, expired, or revoked: `null`
 *
 * The `user` object carries Better Auth user fields such as `id`, `name`, `email`,
 * `emailVerified`, optional `image`, and admin plugin fields such as `role`, `banned`,
 * `banReason`, and `banExpires`. The `session` object carries Better Auth session fields
 * such as `id`, `token`, `userId`, `expiresAt`, `createdAt`, `updatedAt`, optional
 * `ipAddress`, `userAgent`, and organization plugin `activeOrganizationId`.
 */
export async function getLegacyAuthSession(): Promise<LegacyAuthSession> {
  const { headers } = await import("next/headers");
  return bAuth.api.getSession({ headers: await headers() });
}

// Create a callable wrapper for legacy NextAuth `await auth()` compatibility.
export const auth = Object.assign(
  getLegacyAuthSession,
  bAuth
);
