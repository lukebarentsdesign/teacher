import { prisma } from "@/lib/db";
import { GET as accountingExportHandler } from "@/app/api/accounting-export/route";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { requireSession, requireOrganisationMember, ForbiddenError, UnauthorizedError } from "@/lib/auth-helpers";

// Mock the DB
jest.mock("@/lib/db", () => ({
  prisma: {
    ledgerEntry: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

describe("Tenant Isolation at the Application Boundary", () => {
  let orgA_Id = "test-org-a";
  let teacherA_Id = "test-teacher-a";
  let orgB_Id = "test-org-b";
  let teacherB_Id = "test-teacher-b";

  let getSessionSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    getSessionSpy = jest.spyOn(auth.api, "getSession");
  });

  it("returns 401 when no session is present", async () => {
    getSessionSpy.mockResolvedValueOnce(null);
    
    const req = new NextRequest("http://localhost:3000/api/accounting-export");
    const res = await accountingExportHandler(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when Teacher B tries to export Org A data", async () => {
    // Teacher B is authenticated
    const mockAuthContext = {
      user: { id: teacherB_Id },
      session: { activeOrganizationId: orgB_Id }
    };
    
    getSessionSpy.mockResolvedValue(mockAuthContext);

    // B tries to query Org A
    const req = new NextRequest(`http://localhost:3000/api/accounting-export?organisationId=${orgA_Id}`);
    const res = await accountingExportHandler(req);
    
    // Should be explicitly forbidden by the helper since activeOrganizationId (B) != organisationId (A)
    expect(res.status).toBe(403);
  });

  it("returns 200 and exports data when Teacher A accesses Org A", async () => {
    // Teacher A is authenticated and accessing Org A
    const mockAuthContext = {
      user: { id: teacherA_Id },
      session: { activeOrganizationId: orgA_Id }
    };
    
    getSessionSpy.mockResolvedValue(mockAuthContext);

    const req = new NextRequest(`http://localhost:3000/api/accounting-export?organisationId=${orgA_Id}`);
    const res = await accountingExportHandler(req);
    
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Date,Description"); // Header from formatLedgerEntriesAsCsv
  });
});
