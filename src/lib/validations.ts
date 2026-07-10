import { z } from "zod";

export const schoolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  invoicingTarget: z.enum(["SCHOOL", "PARENT"]),
});

export const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dob: z.string().optional(),
  discipline: z.string().min(1, "Discipline is required"),
  source: z.enum(["HOME", "SCHOOL_INQUIRY", "COLLEGE"]),
  schoolId: z.string().optional(),
  igCardId: z.string().optional(),
});

export const payerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});

export const subscriptionSchema = z.object({
  studentId: z.string().min(1),
  payerId: z.string().min(1),
  annualFee: z.coerce.number().positive("Annual fee must be greater than 0"),
  billingModel: z.enum(["SMOOTHED_SUBSCRIPTION", "PER_LESSON", "HOURLY", "TERMLY"]),
  startDate: z.string().min(1, "Start date is required"),
});
