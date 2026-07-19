"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";

const createSchema = z.object({
  fromLocationId: z.string().min(1, "Pick a from location"),
  toLocationId: z.string().min(1, "Pick a to location"),
  minutes: z.coerce.number().int().positive("Minutes must be more than 0"),
});

export async function upsertTravelTimeAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "SCHEDULING"))) {
    return "The Scheduling & timetable module isn't enabled on this account";
  }

  const parsed = createSchema.safeParse({
    fromLocationId: formData.get("fromLocationId"),
    toLocationId: formData.get("toLocationId"),
    minutes: formData.get("minutes"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";
  if (parsed.data.fromLocationId === parsed.data.toLocationId) return "From and to must be different";

  await prisma.locationTravelTime.upsert({
    where: {
      teacherId_fromLocationId_toLocationId: {
        teacherId: session.user.id,
        fromLocationId: parsed.data.fromLocationId,
        toLocationId: parsed.data.toLocationId,
      },
    },
    update: { minutes: parsed.data.minutes },
    create: {
      teacherId: session.user.id,
      fromLocationId: parsed.data.fromLocationId,
      toLocationId: parsed.data.toLocationId,
      minutes: parsed.data.minutes,
    },
  });

  revalidatePath("/dashboard/travel-times");
}

export async function deleteTravelTimeAction(travelTimeId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.locationTravelTime.deleteMany({ where: { id: travelTimeId, teacherId: session.user.id } });
  revalidatePath("/dashboard/travel-times");
}
