import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "learnio_parent_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — spec: re-enter code only on a new device or after expiry

/**
 * Deliberately separate from NextAuth (src/auth.ts), which is the Teacher's own login.
 * Parents authenticate with a 6-digit access code, not email/password — see spec section 5.
 * Reuses AUTH_SECRET to sign the cookie rather than introducing a second secret to manage.
 */
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

export async function createParentSession(payerId: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${payerId}.${expiresAt}`;
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

export async function getParentSession(): Promise<{ payerId: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [payerId, expiresAtRaw, signature] = parts;

  const expectedSignature = sign(`${payerId}.${expiresAtRaw}`);
  if (!timingSafeEqual(signature, expectedSignature)) return null;

  const expiresAt = Number(expiresAtRaw);
  if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return null;

  return { payerId };
}

export async function clearParentSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
