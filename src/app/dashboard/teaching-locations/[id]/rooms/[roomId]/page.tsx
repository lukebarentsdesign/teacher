import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { EditRoomForm } from "./edit-room-form";

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ id: string; roomId: string }>;
}) {
  const { id, roomId } = await params;
  const session = await auth();

  const link = await prisma.teacherLocationLink.findFirst({
    where: { locationId: id, teacherId: session!.user.id },
  });
  if (!link) notFound();

  const room = await prisma.room.findFirst({ where: { id: roomId, locationId: id } });
  if (!room) notFound();

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/dashboard/teaching-locations/${id}`} className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to teaching location
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Edit room</h1>
      </div>
      <EditRoomForm
        room={{
          id: room.id,
          label: room.label,
          features: room.features as { hasPiano?: boolean; hasMirrors?: boolean; floor?: string | null },
          openHours: room.openHours as { dayOfWeek: number; openTime: string; closeTime: string }[],
        }}
      />
    </div>
  );
}
