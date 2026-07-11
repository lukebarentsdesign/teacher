import { encrypt, decrypt } from "@/lib/encryption";

describe("encrypt/decrypt", () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeAll(() => {
    // Fixed 32-byte key for deterministic tests, base64-encoded like the real .env value.
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  it("round-trips a plaintext string", () => {
    const plaintext = "1//0gExampleRefreshToken";
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const a = encrypt("same input");
    const b = encrypt("same input");
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe("same input");
    expect(decrypt(b)).toBe("same input");
  });

  it("throws on a tampered payload (auth tag mismatch)", () => {
    const encrypted = encrypt("sensitive value");
    const [iv, authTag, ciphertext] = encrypted.split(":");
    const tampered = `${iv}:${authTag}:${ciphertext.slice(0, -2)}00`;
    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws when ENCRYPTION_KEY is missing", () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("x")).toThrow("ENCRYPTION_KEY is not set");
    process.env.ENCRYPTION_KEY = saved;
  });
});
