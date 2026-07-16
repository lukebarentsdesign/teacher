export type TeacherScopedResource =
  | "student"
  | "lesson"
  | "payer"
  | "lessonNote"
  | "invoice"
  | "payment"
  | "calendarConnection"
  | "file"
  | "invitation";

/**
 * Central where-clause builder for domain-resource authorization.
 * These predicates are intentionally teacher-scoped because the app's current durable tenancy
 * boundary is still Teacher, even when Better Auth organisation membership exists above it.
 */
export function teacherScopedWhere(resource: TeacherScopedResource, id: string, teacherId: string) {
  switch (resource) {
    case "student":
    case "lesson":
    case "payer":
      return { id, teacherId };
    case "lessonNote":
      return { id, lesson: { teacherId } };
    case "invoice":
      return { id, student: { teacherId } };
    case "payment":
      return { id, subscription: { student: { teacherId } } };
    case "calendarConnection":
      return { id, teacherId };
    case "file":
      return { id, teacherId };
    case "invitation":
      return { id, invitedByTeacherId: teacherId };
  }
}

export function teacherScopedWriteWhere(resource: TeacherScopedResource, id: string, teacherId: string) {
  return teacherScopedWhere(resource, id, teacherId);
}
