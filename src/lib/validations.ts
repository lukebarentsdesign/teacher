import { z } from "zod";

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #2a78d6")
  .optional()
  .or(z.literal(""));

export const teachingLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  invoicingTarget: z.enum(["SCHOOL", "PARENT"]),
  termStart: z.string().optional(),
  termEnd: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  locationType: z
    .enum(["SCHOOL", "STUDENT_HOME", "TEACHER_BASE", "HIRED_VENUE", "ONLINE", "OTHER"])
    .default("SCHOOL"),
  accessNotes: z.string().optional(),
  termCalendarId: z.string().optional(),
});

export const teacherBrandSchema = z.object({
  personalBrandLogoUrl: z.string().url().optional().or(z.literal("")),
  personalBrandColor: hexColorSchema,
});

export const payerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  contactPref: z.enum(["WHATSAPP", "SMS", "EMAIL"]).optional(),
  notes: z.string().optional(),
});

// One payer entry inside the new-student wizard payload. `payerId` set = link an existing payer;
// otherwise the contact fields describe a new payer to create.
const wizardPayerSchema = z.object({
  payerId: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  contactPref: z.enum(["WHATSAPP", "SMS", "EMAIL"]).optional(),
  notes: z.string().optional(),
  splitPercent: z.coerce.number().min(0).max(100).optional(),
  isSelf: z.boolean().optional(),
  isEmergencyContactOnly: z.boolean().optional(),
});

export const newStudentWizardSchema = z.object({
  name: z.string().min(1, "Student name is required"),
  dob: z.string().optional(),
  discipline: z.string().min(1, "Discipline is required"),
  source: z.enum(["HOME", "SCHOOL_INQUIRY", "COLLEGE"]),
  paymentResponsibility: z.enum(["SELF", "GUARDIAN", "SCHOOL"]),
  /// Teaching location the student attends — independent of who is billed.
  locationId: z.string().optional(),
  /// Set when paymentResponsibility is SCHOOL — the location being invoiced.
  invoicingSchoolId: z.string().optional(),
  payers: z.array(wizardPayerSchema),
});

export type WizardPayer = z.infer<typeof wizardPayerSchema>;

/// Part 4.2 self-serve questionnaire — same shape as the wizard, minus `discipline` (derived from
/// the chosen LessonType instead of freeform text) plus the LessonType itself.
export const selfServeOnboardingSchema = z.object({
  name: z.string().min(1, "Student name is required"),
  dob: z.string().optional(),
  lessonTypeId: z.string().min(1, "Choose what you're interested in"),
  paymentResponsibility: z.enum(["SELF", "GUARDIAN", "SCHOOL"]),
  locationId: z.string().optional(),
  invoicingSchoolId: z.string().optional(),
  payers: z.array(wizardPayerSchema),
});

export const subscriptionSchema = z.object({
  studentId: z.string().min(1),
  payerId: z.string().min(1),
  annualFee: z.coerce.number().positive("Annual fee must be greater than 0"),
  billingModel: z.enum(["SMOOTHED_SUBSCRIPTION", "PER_LESSON", "HOURLY", "TERMLY"]),
  startDate: z.string().min(1, "Start date is required"),
  lessonCount: z.coerce.number().int().positive().optional(),
  lessonPrice: z.coerce.number().positive().optional(),
  months: z.coerce.number().int().positive().optional(),
});

export const roomOpenHoursRowSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().min(1),
  closeTime: z.string().min(1),
});

export const roomSchema = z.object({
  locationId: z.string().min(1),
  label: z.string().min(1, "Label is required"),
  hasPiano: z.boolean().optional(),
  hasMirrors: z.boolean().optional(),
  floor: z.string().optional(),
  openHours: z.array(roomOpenHoursRowSchema).optional(),
});

export const groupClassSchema = z.object({
  locationId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  discipline: z.string().min(1, "Discipline is required"),
  roomId: z.string().optional(),
  subjectId: z.string().optional(),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm"),
  capacity: z.coerce.number().int().positive().optional(),
});

export const assessmentSchema = z.object({
  studentId: z.string().min(1),
  level: z.string().min(1, "Level/grade is required"),
  date: z.string().min(1, "Date is required"),
  canContinue: z.boolean().optional(),
  appointmentAt: z.string().optional(),
  roomId: z.string().optional(),
  examBoard: z.string().optional(),
  examFee: z.coerce.number().optional(),
});

export const loanableItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  condition: z.string().optional(),
  value: z.coerce.number().optional(),
});

export const checkOutLoanSchema = z.object({
  itemId: z.string().min(1),
  studentId: z.string().min(1),
  dueBackDate: z.string().min(1, "Due-back date is required"),
});

export const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});
