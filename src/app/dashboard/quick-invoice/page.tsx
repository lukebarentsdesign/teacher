import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { QuickInvoiceView } from "./quick-invoice-view";

export default async function QuickInvoicePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const teacherId = session.user.id;

  // Fetch teacher details
  const teacher = await prisma.teacher.findUniqueOrThrow({
    where: { id: teacherId },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      businessAddress: true,
      paymentInstructions: true,
      invoiceStripeLink: true,
      invoiceEmailSubjectTemplate: true,
      invoiceEmailBodyTemplate: true,
      gmailConnected: true,
      gmailConnectedEmail: true,
    },
  });

  // Fetch all active students along with primary payer details and upcoming lessons count
  const studentsRaw = await prisma.student.findMany({
    where: {
      teacherId,
      status: "ACTIVE",
    },
    include: {
      location: true,
      payerLinks: {
        where: { isPrimary: true },
        include: {
          payer: true,
        },
      },
      lessons: {
        where: {
          scheduledAt: { gte: new Date() },
          status: "HELD",
        },
        select: {
          id: true,
          scheduledAt: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Map students data to include calculated count of upcoming lessons
  const students = studentsRaw.map((s) => ({
    id: s.id,
    name: s.name,
    discipline: s.discipline,
    billingFrequency: s.billingFrequency || "monthly",
    locationId: s.locationId,
    locationName: s.location?.name || null,
    payerName: s.payerLinks[0]?.payer.name || "Unknown Parent",
    payerEmail: s.payerLinks[0]?.payer.email || null,
    payerPhone: s.payerLinks[0]?.payer.phone || null,
    upcomingLessonsCount: s.lessons.length,
  }));

  // Fetch teacher location links for the list of teaching locations (venues)
  const links = await prisma.teacherLocationLink.findMany({
    where: { teacherId },
    include: { location: true },
  });

  const locations = links.map((l) => ({
    id: l.location.id,
    name: l.location.name,
  }));
  const reminderDate = new Date();
  reminderDate.setDate(reminderDate.getDate() - 7);
  const unpaidInvoices = await prisma.quickInvoice.findMany({
    where: {
      teacherId,
      status: { in: ["unpaid", "partial"] },
      emailedAt: { lte: reminderDate },
    },
    include: { student: { select: { name: true } } },
  });
  const now = new Date();
  const invoiceReminder = {
    count: unpaidInvoices.length,
    overdueCount: unpaidInvoices.filter((i) => i.dueDate < now).length,
    studentNames: [...new Set(unpaidInvoices.map((i) => i.student.name))] as string[],
  };

  return (
    <QuickInvoiceView
      teacher={teacher}
      students={students}
      locations={locations}
      invoiceReminder={invoiceReminder}
    />
  );
}




