import { prisma } from "@/lib/db";
import { getAppUrl } from "@/lib/stripe";
import { encrypt, decrypt } from "@/lib/encryption";

/**
 * Lets a teacher connect their own Gmail (separate OAuth grant, NOT the NextAuth login provider —
 * see src/auth.config.ts, login stays Credentials-only) so guardian emails go out from their real
 * address. Mirrors src/lib/connect.ts's Stripe Connect shape: connect → external consent →
 * callback stores a credential → later actions gate on a "connected" flag. Plain fetch against
 * Google's REST endpoints — no googleapis dependency, consistent with this project's style.
 */

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";
const SEND_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const SCOPE = "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email";

function getRedirectUri(): string {
  return `${getAppUrl()}/api/gmail/callback`;
}

function requireGoogleEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are not configured");
  }
  return { clientId, clientSecret };
}

/** Thrown when a teacher hasn't connected Gmail at all. */
export class GmailNotConnectedError extends Error {
  constructor() {
    super("Gmail isn't connected yet.");
    this.name = "GmailNotConnectedError";
  }
}

/** Thrown when the stored refresh token was revoked/expired — needs reconnecting, not retrying. */
export class GmailReauthRequiredError extends Error {
  constructor() {
    super("Your Gmail connection needs to be reconnected.");
    this.name = "GmailReauthRequiredError";
  }
}

/** `state` is a CSRF nonce only — the callback identifies the teacher from the real session, not this. */
export function getGmailAuthUrl(state: string): string {
  const { clientId } = requireGoogleEnv();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent", // forces a refresh_token on every connect, not just the first ever grant
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{ refreshToken: string; email: string }> {
  const { clientId, clientSecret } = requireGoogleEnv();

  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error(`Google token exchange failed: ${await tokenRes.text()}`);
  const tokens = await tokenRes.json();
  if (!tokens.refresh_token) {
    throw new Error("Google didn't return a refresh token — try connecting again.");
  }

  const userRes = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) throw new Error("Could not read the connected Google account's email");
  const userInfo = await userRes.json();

  return { refreshToken: tokens.refresh_token, email: userInfo.email };
}

async function getValidAccessToken(teacherId: string): Promise<string> {
  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } });
  if (!teacher.gmailConnected || !teacher.gmailRefreshTokenEncrypted) {
    throw new GmailNotConnectedError();
  }

  const { clientId, clientSecret } = requireGoogleEnv();
  const refreshToken = decrypt(teacher.gmailRefreshTokenEncrypted);

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (body.error === "invalid_grant") throw new GmailReauthRequiredError();
    throw new Error(`Google token refresh failed: ${JSON.stringify(body)}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildMimeMessage(from: string, to: string, subject: string, bodyText: string): string {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    bodyText,
  ];
  return lines.join("\r\n");
}

export async function sendEmailAsTeacher(
  teacherId: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<void> {
  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } });
  if (!teacher.gmailConnected || !teacher.gmailConnectedEmail) throw new GmailNotConnectedError();

  const accessToken = await getValidAccessToken(teacherId);
  const raw = toBase64Url(buildMimeMessage(teacher.gmailConnectedEmail, to, subject, bodyText));

  const res = await fetch(SEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (res.status === 401) throw new GmailReauthRequiredError();
  if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`);
}

export async function connectGmailAccount(teacherId: string, code: string): Promise<void> {
  const { refreshToken, email } = await exchangeCodeForTokens(code);
  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      gmailConnected: true,
      gmailConnectedEmail: email,
      gmailRefreshTokenEncrypted: encrypt(refreshToken),
      gmailTokenUpdatedAt: new Date(),
    },
  });
}

export async function disconnectGmailAccount(teacherId: string): Promise<void> {
  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      gmailConnected: false,
      gmailConnectedEmail: null,
      gmailRefreshTokenEncrypted: null,
      gmailTokenUpdatedAt: null,
    },
  });
}

export async function sendEmailWithAttachmentAsTeacher(
  teacherId: string,
  to: string,
  subject: string,
  bodyText: string,
  attachmentBuffer: Buffer,
  attachmentName: string
): Promise<void> {
  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } });
  if (!teacher.gmailConnected || !teacher.gmailConnectedEmail) throw new GmailNotConnectedError();

  const accessToken = await getValidAccessToken(teacherId);

  const boundary = "boundary_" + Math.random().toString(36).substring(2);
  const pdfBase64 = attachmentBuffer.toString("base64");
  const splitBase64 = pdfBase64.replace(/(.{76})/g, "$1\r\n");

  const lines = [
    `From: ${teacher.gmailConnectedEmail}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    bodyText,
    "",
    `--${boundary}`,
    `Content-Type: application/pdf; name="${attachmentName}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${attachmentName}"`,
    "",
    splitBase64,
    "",
    `--${boundary}--`
  ];
  const mimeMessage = lines.join("\r\n");
  const raw = Buffer.from(mimeMessage, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch(SEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (res.status === 401) throw new GmailReauthRequiredError();
  if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`);
}
