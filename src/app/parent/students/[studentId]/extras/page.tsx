import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthorizedStudentView } from "@/lib/microsite-access";

export default async function StudentExtrasPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  // Only PUBLIC add-ons are ever shown here — this is the one place AddOn.visibility is actually
  // read. PRIVATE add-ons (teacher-use-only extras) never reach a guardian/student view.
  const bookings = await prisma.addOnBooking.findMany({
    where: { lesson: { studentId }, addOn: { visibility: "PUBLIC" } },
    include: { addOn: true, lesson: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Extras</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Extras booked onto a lesson — instrument hire, sheet music, and the like.
      </p>
      {bookings.length === 0 ? (
        <p className="text-sm text-neutral-500">No extras booked yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Extra</th>
                <th className="px-4 py-3 font-medium">Lesson date</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-neutral-900">{booking.addOn.name}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {booking.lesson?.scheduledAt.toLocaleDateString("en-GB") ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{booking.quantity}</td>
                  <td className="px-4 py-3 text-neutral-500">£{booking.priceAtTime.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
