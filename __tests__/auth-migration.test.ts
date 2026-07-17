import bcrypt from "bcryptjs";
import { Client } from "pg";

const testUserId = "better-auth-migration-user";
const testAccountId = "better-auth-migration-account";
const testSessionId = "better-auth-migration-session";
const testSessionToken = "better-auth-migration-token";
const testEmail = "migration-teacher@example.com";
const testPassword = "changeme123";

async function deleteAuthFixture() {
  const client = await createClient();
  try {
    await client.query('DELETE FROM "session" WHERE "userId" = $1', [testUserId]);
    await client.query('DELETE FROM "account" WHERE "userId" = $1', [testUserId]);
    await client.query('DELETE FROM "auth_member" WHERE "userId" = $1', [testUserId]);
    await client.query('DELETE FROM "auth_invitation" WHERE "inviterId" = $1', [testUserId]);
    await client.query('DELETE FROM "user" WHERE "id" = $1', [testUserId]);
  } finally {
    await client.end();
  }
}

async function createAuthFixture() {
  const client = await createClient();
  const password = await bcrypt.hash(testPassword, 10);

  try {
    await client.query(
      `INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt", "role")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        testUserId,
        "Migration Test Teacher",
        testEmail,
        true,
        new Date("2026-07-16T12:00:00.000Z"),
        new Date("2026-07-16T12:00:00.000Z"),
        "TEACHER",
      ],
    );

    await client.query(
      `INSERT INTO "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        testAccountId,
        testEmail,
        "credential",
        testUserId,
        password,
        new Date("2026-07-16T12:00:00.000Z"),
        new Date("2026-07-16T12:00:00.000Z"),
      ],
    );
  } finally {
    await client.end();
  }

  return { password };
}

async function createClient() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const schema = new URL(process.env.DATABASE_URL ?? "").searchParams.get("schema");
  if (schema) {
    await client.query(`SET search_path TO "${schema.replace(/"/g, '""')}"`);
  }
  return client;
}

describe("Better Auth migration database contract", () => {
  beforeEach(async () => {
    await deleteAuthFixture();
  });

  afterAll(async () => {
    await deleteAuthFixture();
  });

  it("stores migrated users and bcrypt password credentials in Better Auth tables", async () => {
    const { password } = await createAuthFixture();

    const client = await createClient();
    const user = await client.query(
      `SELECT u."id", u."email", u."emailVerified", u."role",
              a."accountId", a."providerId", a."userId", a."password"
       FROM "user" u
       JOIN "account" a ON a."userId" = u."id"
       WHERE u."email" = $1`,
      [testEmail],
    );
    await client.end();

    expect(user.rows[0]).toMatchObject({
      id: testUserId,
      email: testEmail,
      emailVerified: true,
      role: "TEACHER",
      accountId: testEmail,
      providerId: "credential",
      userId: testUserId,
    });
    expect(user.rows[0].password).toBe(password);
    await expect(bcrypt.compare(testPassword, password)).resolves.toBe(true);
  });

  it("rejects an incorrect password against the migrated bcrypt hash", async () => {
    const { password } = await createAuthFixture();
    await expect(bcrypt.compare("wrongpassword!", password)).resolves.toBe(false);
  });

  it("can invalidate a Better Auth session by deleting the session row", async () => {
    await createAuthFixture();

    const client = await createClient();
    try {
      await client.query(
        `INSERT INTO "session" ("id", "token", "userId", "expiresAt", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          testSessionId,
          testSessionToken,
          testUserId,
          new Date("2026-07-17T12:00:00.000Z"),
          new Date("2026-07-16T12:00:00.000Z"),
          new Date("2026-07-16T12:00:00.000Z"),
        ],
      );

      await expect(
        client.query('SELECT "id" FROM "session" WHERE "token" = $1', [testSessionToken]),
      ).resolves.toMatchObject({ rowCount: 1 });

      await client.query('DELETE FROM "session" WHERE "token" = $1', [testSessionToken]);

      await expect(
        client.query('SELECT "id" FROM "session" WHERE "token" = $1', [testSessionToken]),
      ).resolves.toMatchObject({ rowCount: 0 });
    } finally {
      await client.end();
    }
  });
});
