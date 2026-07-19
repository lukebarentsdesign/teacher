"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasModule } from "@/lib/modules";

const addOnSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  chargeUnit: z.enum(["PER_BOOKING", "PER_HOUR"]),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

export async function createAddOnAction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState requires this signature
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return "Not authenticated";
  if (!(await hasModule(session.user.id, "COMMERCE"))) {
    return "The Commerce add-ons module isn't enabled on this account";
  }

  const parsed = addOnSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    chargeUnit: formData.get("chargeUnit"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.addOn.create({
    data: { teacherId: session.user.id, ...parsed.data },
  });

  revalidatePath("/dashboard/addons");
}

export async function archiveAddOnAction(addOnId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const addOn = await prisma.addOn.findFirst({ where: { id: addOnId, teacherId: session.user.id } });
  if (!addOn) return;

  await prisma.addOn.update({ where: { id: addOnId }, data: { archivedAt: new Date() } });
  revalidatePath("/dashboard/addons");
}
