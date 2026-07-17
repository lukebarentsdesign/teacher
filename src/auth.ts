import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { admin, organization } from "better-auth/plugins";
import bcrypt from "bcryptjs";

/**
 * Better Auth rejects sign-in requests whose Origin isn't trusted (403 INVALID_ORIGIN). Without an
 * explicit list it only trusts its own inferred base URL, which breaks on any non-default host/port
 * (deploys, preview URLs, local test servers on alternate ports). Source the canonical URL from env
 * and always include the common localhost dev origins.
 */
const trustedOrigins = Array.from(
  new Set(
    [
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXTAUTH_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].filter((v): v is string => Boolean(v))
  )
);

const bAuth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  trustedOrigins,
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
  ],
  databaseHooks: {
    user: {
      create: {
        /**
         * The whole app scopes teacher-owned data by `session.user.id` used *as* `Teacher.id`
         * (e.g. `prisma.teacher.findUnique({ where: { id: session.user.id } })` and
         * `teacherId: session.user.id` in ~200 call sites). Better Auth only creates a `User`
         * row on sign-up, so without this hook a newly registered teacher has no `Teacher`
         * record and the first dashboard/onboarding lookup throws. We create the `Teacher` with
         * the SAME id as the User so that invariant holds (Teacher.id === user.id). The password
         * now lives in Better Auth's `account` table, so `passwordHash` here is vestigial — kept
         * non-null with a placeholder rather than migrating the column to nullable.
         */
        after: async (user) => {
          await prisma.teacher.upsert({
            where: { email: user.email },
            update: { userId: user.id },
            create: {
              id: user.id,
              userId: user.id,
              name: user.name || user.email,
              email: user.email,
              passwordHash: "better-auth-managed",
            },
          });
        },
      },
    },
  },
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
