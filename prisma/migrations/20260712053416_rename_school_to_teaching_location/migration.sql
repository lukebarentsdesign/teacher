-- Rename School -> TeachingLocation, generalize with locationType + accessNotes,
-- and rename schoolId columns/relations -> locationId throughout.

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('SCHOOL', 'STUDENT_HOME', 'TEACHER_BASE', 'HIRED_VENUE', 'OTHER');

-- Rename table
ALTER TABLE "School" RENAME TO "TeachingLocation";
ALTER TABLE "TeachingLocation" RENAME CONSTRAINT "School_pkey" TO "TeachingLocation_pkey";

-- Add new columns
ALTER TABLE "TeachingLocation" ADD COLUMN "locationType" "LocationType" NOT NULL DEFAULT 'SCHOOL';
ALTER TABLE "TeachingLocation" ADD COLUMN "accessNotes" TEXT;

-- Rename TeacherSchoolLink -> TeacherLocationLink
ALTER TABLE "TeacherSchoolLink" RENAME TO "TeacherLocationLink";
ALTER TABLE "TeacherLocationLink" RENAME CONSTRAINT "TeacherSchoolLink_pkey" TO "TeacherLocationLink_pkey";
ALTER TABLE "TeacherLocationLink" RENAME COLUMN "schoolId" TO "locationId";
ALTER INDEX "TeacherSchoolLink_teacherId_schoolId_key" RENAME TO "TeacherLocationLink_teacherId_locationId_key";
ALTER TABLE "TeacherLocationLink" RENAME CONSTRAINT "TeacherSchoolLink_teacherId_fkey" TO "TeacherLocationLink_teacherId_fkey";
ALTER TABLE "TeacherLocationLink" RENAME CONSTRAINT "TeacherSchoolLink_schoolId_fkey" TO "TeacherLocationLink_locationId_fkey";

-- Unavailability.schoolId -> locationId
ALTER TABLE "Unavailability" RENAME COLUMN "schoolId" TO "locationId";
ALTER TABLE "Unavailability" RENAME CONSTRAINT "Unavailability_schoolId_fkey" TO "Unavailability_locationId_fkey";

-- Room.schoolId -> locationId
ALTER TABLE "Room" RENAME COLUMN "schoolId" TO "locationId";
ALTER TABLE "Room" RENAME CONSTRAINT "Room_schoolId_fkey" TO "Room_locationId_fkey";

-- Student.schoolId -> locationId
ALTER TABLE "Student" RENAME COLUMN "schoolId" TO "locationId";
ALTER TABLE "Student" RENAME CONSTRAINT "Student_schoolId_fkey" TO "Student_locationId_fkey";

-- Lesson.schoolId -> locationId
ALTER TABLE "Lesson" RENAME COLUMN "schoolId" TO "locationId";
ALTER TABLE "Lesson" RENAME CONSTRAINT "Lesson_schoolId_fkey" TO "Lesson_locationId_fkey";

-- GroupClass.schoolId -> locationId
ALTER TABLE "GroupClass" RENAME COLUMN "schoolId" TO "locationId";
ALTER TABLE "GroupClass" RENAME CONSTRAINT "GroupClass_schoolId_fkey" TO "GroupClass_locationId_fkey";

-- LoanableItem.schoolId -> locationId
ALTER TABLE "LoanableItem" RENAME COLUMN "schoolId" TO "locationId";
ALTER TABLE "LoanableItem" RENAME CONSTRAINT "LoanableItem_schoolId_fkey" TO "LoanableItem_locationId_fkey";

-- PrivateTuitionRequest.sourceSchoolId -> sourceLocationId
ALTER TABLE "PrivateTuitionRequest" RENAME COLUMN "sourceSchoolId" TO "sourceLocationId";
ALTER TABLE "PrivateTuitionRequest" RENAME CONSTRAINT "PrivateTuitionRequest_sourceSchoolId_fkey" TO "PrivateTuitionRequest_sourceLocationId_fkey";
