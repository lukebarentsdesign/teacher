const mockAuth = jest.fn();
const mockGetMicrositeSession = jest.fn();
const mockFindLesson = jest.fn();
const mockFindStudentPayerLink = jest.fn();

jest.mock("@/auth", () => ({
  auth: mockAuth,
}));

jest.mock("@/lib/microsite-session", () => ({
  getMicrositeSession: mockGetMicrositeSession,
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    lesson: {
      findUnique: mockFindLesson,
    },
    studentPayerLink: {
      findFirst: mockFindStudentPayerLink,
    },
  },
}));

const { GET } = require("@/app/api/lessons/[id]/ics/route") as typeof import("@/app/api/lessons/[id]/ics/route");

const orgALesson = {
  id: "lesson-org-a-real-id",
  teacherId: "teacher-org-a",
  studentId: "student-org-a",
  scheduledAt: new Date("2026-07-20T10:00:00.000Z"),
  durationMins: 45,
  meetingUrl: "https://meet.example/lesson-a",
  student: {
    id: "student-org-a",
    name: "Alice Private",
    dob: new Date("2012-01-01T00:00:00.000Z"),
    studentAccessCode: "111111",
  },
  location: {
    id: "location-org-a",
    name: "Studio A",
    accessNotes: "Back door code 1234",
  },
};

async function requestIcs(lessonId = orgALesson.id) {
  return GET(new Request(`http://localhost:3000/api/lessons/${lessonId}/ics`), {
    params: Promise.resolve({ id: lessonId }),
  });
}

describe("lesson ICS route authorization and privacy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindLesson.mockResolvedValue(orgALesson);
    mockFindStudentPayerLink.mockResolvedValue(null);
    mockAuth.mockResolvedValue(null);
    mockGetMicrositeSession.mockResolvedValue(null);
  });

  it("allows the owning teacher to download a real lesson ICS with private no-store caching", async () => {
    mockAuth.mockResolvedValue({ user: { id: "teacher-org-a" }, session: {} });

    const res = await requestIcs();

    expect(res.status).toBe(200);
    expect(mockFindLesson).toHaveBeenCalledWith({
      where: { id: "lesson-org-a-real-id" },
      include: { student: true, location: true },
    });
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.headers.get("Content-Type")).toBe("text/calendar");
  });

  it("rejects a teacher from another organisation for Organisation A's lesson", async () => {
    mockAuth.mockResolvedValue({ user: { id: "teacher-org-b" }, session: { activeOrganizationId: "org-b" } });

    const res = await requestIcs();

    expect(res.status).toBe(403);
    await expect(res.text()).resolves.not.toContain("BEGIN:VCALENDAR");
  });

  it("rejects a revoked parent microsite session", async () => {
    mockGetMicrositeSession.mockResolvedValue(null);

    const res = await requestIcs();

    expect(res.status).toBe(403);
    expect(mockFindStudentPayerLink).not.toHaveBeenCalled();
  });

  it("allows a linked guardian and rejects Family B for Family A's real student ID", async () => {
    mockGetMicrositeSession.mockResolvedValue({ type: "guardian", payerId: "payer-family-b" });
    mockFindStudentPayerLink.mockResolvedValueOnce(null);

    await expect(requestIcs().then((res) => res.status)).resolves.toBe(403);
    expect(mockFindStudentPayerLink).toHaveBeenCalledWith({
      where: { studentId: "student-org-a", payerId: "payer-family-b" },
    });

    mockGetMicrositeSession.mockResolvedValue({ type: "guardian", payerId: "payer-family-a" });
    mockFindStudentPayerLink.mockResolvedValueOnce({ id: "link-family-a" });

    await expect(requestIcs().then((res) => res.status)).resolves.toBe(200);
  });

  it("allows the matching student session and denies another student's session", async () => {
    mockGetMicrositeSession.mockResolvedValueOnce({ type: "student", studentId: "student-family-b" });
    await expect(requestIcs().then((res) => res.status)).resolves.toBe(403);

    mockGetMicrositeSession.mockResolvedValueOnce({ type: "student", studentId: "student-org-a" });
    await expect(requestIcs().then((res) => res.status)).resolves.toBe(200);
  });

  it("exposes only minimal calendar personal data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "teacher-org-a" }, session: {} });

    const res = await requestIcs();
    const ics = await res.text();

    expect(ics).toContain("SUMMARY:Lesson");
    expect(ics).toContain("DESCRIPTION:Lesson at Studio A");
    expect(ics).not.toContain("Alice Private");
    expect(ics).not.toContain("2012");
    expect(ics).not.toContain("111111");
    expect(ics).not.toContain("Back door code");
  });
});
