const mockHeaders = jest.fn();
const mockGetSession = jest.fn();

jest.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

jest.mock("better-auth", () => ({
  betterAuth: () => ({
    api: {
      getSession: mockGetSession,
    },
    handler: jest.fn(),
  }),
}));

jest.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: jest.fn(() => ({})),
}));

jest.mock("better-auth/plugins", () => ({
  admin: jest.fn(() => ({})),
  organization: jest.fn(() => ({})),
}));

jest.mock("@/lib/db", () => ({
  prisma: {},
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const { getLegacyAuthSession, auth } = require("@/auth") as typeof import("@/auth");

const requestHeaders = new Headers({ cookie: "better-auth.session_token=session-token" });

function authenticatedBridgeSession() {
  return {
    user: {
      id: "user-1",
      name: "A Teacher",
      email: "teacher@example.com",
      emailVerified: true,
      image: null,
      role: "PLATFORM_ADMIN",
      banned: false,
      banReason: null,
      banExpires: null,
    },
    session: {
      id: "session-1",
      token: "session-token",
      userId: "user-1",
      expiresAt: new Date("2026-07-17T12:00:00.000Z"),
      createdAt: new Date("2026-07-16T12:00:00.000Z"),
      updatedAt: new Date("2026-07-16T12:00:00.000Z"),
      ipAddress: "127.0.0.1",
      userAgent: "jest",
      activeOrganizationId: "auth-org-1",
    },
    member: {
      id: "member-1",
      organizationId: "auth-org-1",
      userId: "user-1",
      role: "owner",
      createdAt: new Date("2026-07-16T12:00:00.000Z"),
    },
    organization: {
      id: "auth-org-1",
      name: "Org A",
      slug: "org-a",
      logo: null,
      createdAt: new Date("2026-07-16T12:00:00.000Z"),
      metadata: null,
    },
  };
}

describe("Better Auth legacy auth() bridge contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaders.mockResolvedValue(requestHeaders);
  });

  it("returns Better Auth's authenticated session shape for legacy callers", async () => {
    const session = authenticatedBridgeSession();
    mockGetSession.mockResolvedValueOnce(session);

    await expect(getLegacyAuthSession()).resolves.toEqual(session);
    expect(mockGetSession).toHaveBeenCalledWith({ headers: requestHeaders });
  });

  it("returns null for an unauthenticated request", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    await expect(getLegacyAuthSession()).resolves.toBeNull();
  });

  it("returns null for an expired session", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    await expect(getLegacyAuthSession()).resolves.toBeNull();
  });

  it("returns null for a revoked session", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    await expect(getLegacyAuthSession()).resolves.toBeNull();
  });

  it("preserves global role fields on the user object", async () => {
    const session = authenticatedBridgeSession();
    mockGetSession.mockResolvedValueOnce(session);

    const result = await getLegacyAuthSession();
    expect(result?.user).toMatchObject({
      role: "PLATFORM_ADMIN",
      banned: false,
      banReason: null,
      banExpires: null,
    });
  });

  it("preserves active organisation and membership fields", async () => {
    const session = authenticatedBridgeSession();
    mockGetSession.mockResolvedValueOnce(session);

    const result = await getLegacyAuthSession();
    expect(result?.session.activeOrganizationId).toBe("auth-org-1");
    expect(result?.member).toMatchObject({
      organizationId: "auth-org-1",
      userId: "user-1",
      role: "owner",
    });
    expect(result?.organization).toMatchObject({
      id: "auth-org-1",
      name: "Org A",
    });
  });

  it("is callable from Server Component-style code", async () => {
    mockGetSession.mockResolvedValueOnce(authenticatedBridgeSession());
    const ServerComponent = async () => (await auth())?.user.id;
    await expect(ServerComponent()).resolves.toBe("user-1");
  });

  it("is callable from Route Handler-style code", async () => {
    mockGetSession.mockResolvedValueOnce(authenticatedBridgeSession());
    const GET = async () => Response.json({ userId: (await auth())?.user.id });
    await expect(GET().then((res) => res.json())).resolves.toEqual({ userId: "user-1" });
  });

  it("is callable from Server Action-style code", async () => {
    mockGetSession.mockResolvedValueOnce(authenticatedBridgeSession());
    const action = async () => {
      "use server";
      return (await auth())?.session.activeOrganizationId;
    };
    await expect(action()).resolves.toBe("auth-org-1");
  });
});
