"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";

export async function createTermCalendarAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "TERM_CALENDARS"))) {
    return "The Term calendars module isn't enabled on this account";
  }

  const name = (formData.get("name") as string)?.trim();
  if (!name) return "Name is required";

  const calendar = await prisma.termCalendar.create({
    data: { teacherId: session.user.id, name },
  });

  revalidatePath("/dashboard/term-calendars");
  redirect(`/dashboard/term-calendars/${calendar.id}`);
}

export async function deleteTermCalendarAction(calendarId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const calendar = await prisma.termCalendar.findFirst({
    where: { id: calendarId, teacherId: session.user.id },
  });
  if (!calendar) return;

  await prisma.termCalendar.delete({ where: { id: calendarId } });
  revalidatePath("/dashboard/term-calendars");
}

const periodSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

async function assertOwnCalendar(calendarId: string, teacherId: string) {
  return prisma.termCalendar.findFirst({ where: { id: calendarId, teacherId } });
}

export async function addTermPeriodAction(
  calendarId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "TERM_CALENDARS"))) {
    return "The Term calendars module isn't enabled on this account";
  }
  if (!(await assertOwnCalendar(calendarId, session.user.id))) return "Calendar not found";

  const parsed = periodSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";
  if (new Date(parsed.data.endDate) < new Date(parsed.data.startDate)) return "End must be after start.";

  await prisma.termPeriod.create({
    data: {
      termCalendarId: calendarId,
      name: parsed.data.name,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
  });

  revalidatePath(`/dashboard/term-calendars/${calendarId}`);
}

export async function addHolidayPeriodAction(
  calendarId: string,
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "TERM_CALENDARS"))) {
    return "The Term calendars module isn't enabled on this account";
  }
  if (!(await assertOwnCalendar(calendarId, session.user.id))) return "Calendar not found";

  const parsed = periodSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";
  if (new Date(parsed.data.endDate) < new Date(parsed.data.startDate)) return "End must be after start.";

  await prisma.holidayPeriod.create({
    data: {
      termCalendarId: calendarId,
      name: parsed.data.name,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
  });

  revalidatePath(`/dashboard/term-calendars/${calendarId}`);
}

export async function deleteTermPeriodAction(periodId: string, calendarId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  if (!(await assertOwnCalendar(calendarId, session.user.id))) return;

  await prisma.termPeriod.deleteMany({ where: { id: periodId, termCalendarId: calendarId } });
  revalidatePath(`/dashboard/term-calendars/${calendarId}`);
}

export async function deleteHolidayPeriodAction(periodId: string, calendarId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  if (!(await assertOwnCalendar(calendarId, session.user.id))) return;

  await prisma.holidayPeriod.deleteMany({ where: { id: periodId, termCalendarId: calendarId } });
  revalidatePath(`/dashboard/term-calendars/${calendarId}`);
}
