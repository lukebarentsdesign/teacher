import { prisma } from "../src/lib/db";
import { randomUUID } from "crypto";

/**
 * Migrates legacy NextAuth-era Teacher rows to Better Auth.
 *
 * CRITICAL: the Better Auth User.id MUST equal the existing Teacher.id. The whole app scopes
 * teacher-owned data by `session.user.id` used *as* `Teacher.id` (see the databaseHooks note in
 * src/auth.ts). An earlier version of this script minted a fresh `randomUUID()` for the User, which
 * silently broke every `where: { id: session.user.id }` / `teacherId: session.user.id` lookup. We
 * reuse `teacher.id` as the User id so that invariant holds.
 */
async function main() {
  const teachers = await prisma.teacher.findMany({
    where: { userId: null }
  });

  console.log(`Found ${teachers.length} teachers to migrate`);

  for (const teacher of teachers) {
    const userId = teacher.id; // MUST match Teacher.id — see note above.

    // 1. Create User (id === teacher.id)
    await prisma.user.create({
      data: {
        id: userId,
        email: teacher.email,
        name: teacher.name,
        emailVerified: true,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      }
    });

    // 2. Create Account
    // Better Auth stores email/password credentials in the Account table
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: teacher.email, // Some providers use email as accountId
        providerId: "credential",
        userId: userId,
        password: teacher.passwordHash,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      }
    });

    // 3. Link profile
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { userId }
    });

    console.log(`Migrated teacher ${teacher.email} to Better Auth User ${userId}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
