import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "teachbase_microsite_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — spec: re-enter code only on a new device or after expiry

/**
 * Deliberately separate from NextAuth (src/auth.ts), which is the Teacher's own login.
 * Guardians and 16+ students both authenticate with a 6-digit access code, sharing one flat
 * login screen and one code namespace (see src/lib/access-code.ts) — the session just needs to
 * remember which kind of viewer this is, since a student's view is narrower than a guardian's
 * (see Student.hasIndependentAccess/shareBalanceWithStudent in the schema).
 */
export type MicrositeSession =
  | { type: "guardian"; payerId: string }
  | { type: "student"; studentId: string };

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function createSession(type: "guardian" | "student", id: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${type}.${id}.${expiresAt}`;
  const value = `${payload}.${sign(payload)}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export function createGuardianSession(payerId: string): Promise<void> {
  return createSession("guardian", payerId);
}

export function createStudentSession(studentId: string): Promise<void> {
  return createSession("student", studentId);
}

export async function getMicrositeSession(): Promise<MicrositeSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 4) return null;
  const [type, id, expiresAtRaw, signature] = parts;
  if (type !== "guardian" && type !== "student") return null;

  const expectedSignature = sign(`${type}.${id}.${expiresAtRaw}`);
  if (!timingSafeEqual(signature, expectedSignature)) return null;

  const expiresAt = Number(expiresAtRaw);
  if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return null;

  return type === "guardian" ? { type, payerId: id } : { type, studentId: id };
}

export async function clearMicrositeSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
