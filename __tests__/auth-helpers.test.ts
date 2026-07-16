import { requireSession, requireOrganisationMember, requirePlatformAdmin, UnauthorizedError, ForbiddenError } from "@/lib/auth-helpers";
import { auth } from "@/auth";

jest.mock("@/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn()
    }
  }
}));

describe("Auth Helpers", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("requireSession", () => {
    it("throws UnauthorizedError if no session is returned", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValueOnce(null);
      await expect(requireSession(new Headers())).rejects.toThrow(expect.objectContaining({ name: "UnauthorizedError" }));
    });

    it("returns context if session exists", async () => {
      const mockSession = { user: { id: "1" }, session: {} };
      (auth.api.getSession as jest.Mock).mockResolvedValueOnce(mockSession);
      const ctx = await requireSession(new Headers());
      expect(ctx).toEqual(mockSession);
    });
  });

  describe("requirePlatformAdmin", () => {
    it("throws ForbiddenError if role is not PLATFORM_ADMIN", async () => {
      const mockContext = { user: { role: "TEACHER" }, session: {} };
      await expect(requirePlatformAdmin(mockContext)).rejects.toThrow(expect.objectContaining({ name: "ForbiddenError" }));
    });

    it("returns context if role is PLATFORM_ADMIN", async () => {
      const mockContext = { user: { role: "PLATFORM_ADMIN" }, session: {} };
      const res = await requirePlatformAdmin(mockContext);
      expect(res).toEqual(mockContext);
    });
  });

  describe("requireOrganisationMember", () => {
    it("throws ForbiddenError if activeOrganizationId does not match", async () => {
      const mockContext = { user: { id: "1" }, session: { activeOrganizationId: "org-1" } };
      await expect(requireOrganisationMember(mockContext, "org-2")).rejects.toThrow(expect.objectContaining({ name: "ForbiddenError" }));
    });

    it("throws ForbiddenError if activeOrganizationId is missing", async () => {
      const mockContext = { user: { id: "1" }, session: {} };
      await expect(requireOrganisationMember(mockContext, "org-1")).rejects.toThrow(expect.objectContaining({ name: "ForbiddenError" }));
    });

    it("returns context if activeOrganizationId matches", async () => {
      const mockContext = { user: { id: "1" }, session: { activeOrganizationId: "org-1" } };
      const res = await requireOrganisationMember(mockContext, "org-1");
      expect(res).toEqual(mockContext);
    });
  });
});
