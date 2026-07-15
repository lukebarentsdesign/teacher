import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ResourceCentre } from "./resource-centre";

export default async function ResourcesPage() {
  const session = await auth();
  const resources = await prisma.resource.findMany({
    where: { teacherId: session!.user.id },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { student: { select: { name: true } } },
  });

  return (
    <ResourceCentre
      resources={resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        url: resource.url,
        description: resource.description,
        folder: resource.folder,
        sourceLabel: resource.sourceLabel,
        tags: resource.tags,
        thumbnailUrl: resource.thumbnailUrl,
        pinned: resource.pinned,
        createdAt: resource.createdAt.toISOString(),
        student: resource.student,
      }))}
    />
  );
}