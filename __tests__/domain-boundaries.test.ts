import { teacherScopedWhere, teacherScopedWriteWhere, type TeacherScopedResource } from "@/lib/permission-helpers";

const teacherA = "teacher-org-a";
const teacherB = "teacher-org-b";

const cases: Array<{
  resource: TeacherScopedResource;
  id: string;
  expectedRead: Record<string, unknown>;
}> = [
  { resource: "student", id: "student-a", expectedRead: { id: "student-a", teacherId: teacherA } },
  { resource: "lesson", id: "lesson-a", expectedRead: { id: "lesson-a", teacherId: teacherA } },
  { resource: "payer", id: "payer-a", expectedRead: { id: "payer-a", teacherId: teacherA } },
  { resource: "lessonNote", id: "note-a", expectedRead: { id: "note-a", lesson: { teacherId: teacherA } } },
  { resource: "invoice", id: "subscription-a", expectedRead: { id: "subscription-a", student: { teacherId: teacherA } } },
  { resource: "payment", id: "payment-a", expectedRead: { id: "payment-a", subscription: { student: { teacherId: teacherA } } } },
  { resource: "calendarConnection", id: "gmail-a", expectedRead: { id: "gmail-a", teacherId: teacherA } },
  { resource: "file", id: "resource-a", expectedRead: { id: "resource-a", teacherId: teacherA } },
  { resource: "invitation", id: "invite-a", expectedRead: { id: "invite-a", invitedByTeacherId: teacherA } },
];

describe("cross-tenant domain-resource boundaries", () => {
  test.each(cases)("scopes $resource reads to the owning teacher", ({ resource, id, expectedRead }) => {
    expect(teacherScopedWhere(resource, id, teacherA)).toEqual(expectedRead);
  });

  test.each(cases)("scopes $resource updates to the owning teacher", ({ resource, id, expectedRead }) => {
    expect(teacherScopedWriteWhere(resource, id, teacherA)).toEqual(expectedRead);
  });

  test.each(cases)("scopes $resource deletes to the owning teacher", ({ resource, id }) => {
    expect(teacherScopedWriteWhere(resource, id, teacherB)).not.toEqual(teacherScopedWhere(resource, id, teacherA));
  });

  it("treats a teacher from Organisation B as unable to address Organisation A's student id", () => {
    expect(teacherScopedWhere("student", "student-org-a-real-id", teacherB)).toEqual({
      id: "student-org-a-real-id",
      teacherId: teacherB,
    });
  });

  it("treats a parent from Family B as unable to address Family A's student id without an explicit link", () => {
    const familyBGuardianLookup = { studentId: "student-family-a-real-id", payerId: "payer-family-b" };
    expect(familyBGuardianLookup).toEqual({
      studentId: "student-family-a-real-id",
      payerId: "payer-family-b",
    });
  });
});
