import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * AES-256-GCM at-rest encryption for real bearer secrets stored in the database — currently just
 * Teacher.gmailRefreshTokenEncrypted. Unlike the Stripe fields on Teacher (non-secret account IDs;
 * the actual API key lives only in .env), a Gmail refresh token IS usable on its own, so it's
 * encrypted rather than stored plain. No new dependency — Node's built-in `crypto`.
 */

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY is not set");
  const buffer = Buffer.from(key, "base64");
  if (buffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes, base64-encoded (openssl rand -base64 32)");
  }
  return buffer;
}

/** Returns "iv:authTag:ciphertext", each hex-encoded. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decrypt(payload: string): string {
  const [ivHex, authTagHex, ciphertextHex] = payload.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) throw new Error("Malformed encrypted payload");

  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
