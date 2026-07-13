import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthorizedStudentView } from "@/lib/microsite-access";
import { BookSessionForm } from "./book-session-form";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKS_AHEAD = 6;

function nextOccurrences(dayOfWeek: number, count: number): Date[] {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getDay() !== dayOfWeek) cursor.setDate(cursor.getDate() + 1);
  for (let i = 0; i < count; i++) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return dates;
}

export default async function StudentClassesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  const memberships = await prisma.groupClassMember.findMany({
    where: { studentId, leftAt: null },
    include: { groupClass: { include: { location: true } } },
  });

  if (context.viewerType !== "guardian") {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Classes</h1>
        <p className="text-sm text-neutral-500">Ask your guardian to book class sessions.</p>
      </div>
    );
  }

  const bookings = await prisma.groupSessionBooking.findMany({
    where: { studentId, status: { not: "CANCELLED" } },
  });
  const bookingLookup = new Map(bookings.map((b) => [`${b.groupClassId}|${b.sessionDate.toISOString().slice(0, 10)}`, b]));

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Classes</h1>
      <p className="mb-6 text-sm text-neutral-500">Book yourself into an upcoming session of a class you belong to.</p>

      {memberships.length === 0 ? (
        <p className="text-sm text-neutral-500">Not a member of any group class yet.</p>
      ) : (
        <div className="space-y-6">
          {memberships.map((m) => {
            const upcoming = nextOccurrences(m.groupClass.dayOfWeek, WEEKS_AHEAD).map((date) => {
              const key = `${m.groupClassId}|${date.toISOString().slice(0, 10)}`;
              const existing = bookingLookup.get(key);
              return {
                date: date.toISOString().slice(0, 10),
                label: `${DAY_LABELS[m.groupClass.dayOfWeek]} ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${m.groupClass.startTime}`,
                existingStatus: existing?.status ?? null,
                existingBookingId: existing?.id ?? null,
              };
            });

            return (
              <div key={m.id} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-neutral-900">
                  {m.groupClass.name}
                  <span className="ml-2 text-xs font-normal text-neutral-500">{m.groupClass.location.name}</span>
                </p>
                <BookSessionForm studentId={studentId} groupClassId={m.groupClassId} upcoming={upcoming} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
