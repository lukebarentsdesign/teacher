import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { acceptPrivateTuitionRequestAction } from "./actions";

export default async function PrivateTuitionRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const student = await prisma.student.findFirst({
    where: { id, teacherId: session!.user.id },
    include: { location: true },
  });
  if (!student) notFound();

  const request = await prisma.privateTuitionRequest.findFirst({
    where: { studentId: id, teacherId: session!.user.id, status: "PENDING" },
  });
  if (!request) notFound();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Accept private-tuition request</h1>

      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Check your agreement with {student.location?.name ?? "this teaching location"} before accepting.</p>
        <p className="mt-2">
          Many peripatetic teacher contracts restrict converting a school-sourced student into a
          private client — accepting this request does not check that for you.
        </p>
      </div>

      <p className="text-sm text-neutral-600">
        Accepting creates a new, separate private-student record for {student.name} (source: Home)
        alongside their existing {student.location?.name ?? "teaching location"} relationship — it does not
        remove or change the existing one.
      </p>

      <form action={acceptPrivateTuitionRequestAction.bind(null, request.id)}>
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
        >
          I&apos;ve checked — accept
        </button>
      </form>
    </div>
  );
}
