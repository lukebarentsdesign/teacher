import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const timeSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, "Use HH:mm"),
  endTime: z.string().regex(timeRegex, "Use HH:mm"),
});

export const protectedBlockSchema = timeSlotSchema.extend({
  label: z.string().optional(),
});

export const availabilityArraySchema = z.array(timeSlotSchema);
export const protectedBlocksArraySchema = z.array(protectedBlockSchema);

/** Parses a TeacherSchoolLink's Json `availability`/`protectedBlocks` fields at the runtime boundary. */
export function parseAvailability(value: unknown) {
  return availabilityArraySchema.parse(value);
}

export function parseProtectedBlocks(value: unknown) {
  return protectedBlocksArraySchema.parse(value ?? []);
}
