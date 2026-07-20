import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { QuickToolsView } from "./quick-tools-view";
import { hasModule } from "@/lib/modules";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default async function QuickToolsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const teacherId = session.user.id;
  const hasInvoicing = await hasModule(teacherId, "INVOICING");
  const now = new Date();
  const recentStart = new Date(now);
  recentStart.setDate(recentStart.getDate() - 14);

  const [studentsRaw, locationsRaw, todayLessonsRaw, recentLessonsRaw, unpaidInvoicesRaw, payersRaw] = await Promise.all([
    prisma.student.findMany({
      where: { teacherId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      include: {
        location: { select: { id: true, name: true } },
        payerLinks: { where: { isPrimary: true }, include: { payer: true }, take: 1 },
      },
    }),
    prisma.teacherLocationLink.findMany({
      where: { teacherId },
      include: { location: true },
      orderBy: { location: { name: "asc" } },
    }),
    prisma.lesson.findMany({
      where: { teacherId, scheduledAt: { gte: startOfDay(now), lte: endOfDay(now) } },
      orderBy: { scheduledAt: "asc" },
      include: { student: true, location: true, note: true },
    }),
    prisma.lesson.findMany({
      where: { teacherId, scheduledAt: { gte: recentStart, lte: now } },
      orderBy: { scheduledAt: "desc" },
      include: { student: true, location: true, note: true },
      take: 20,
    }),
    prisma.quickInvoice.findMany({
      where: { teacherId, status: { in: ["unpaid", "partial"] } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: { student: true },
      take: 30,
    }),
    prisma.payer.findMany({
      where: { teacherId, isEmergencyContactOnly: false },
      orderBy: { name: "asc" },
      include: {
        studentLinks: { include: { student: true } },
      },
      take: 80,
    }),
  ]);

  const students = studentsRaw.map((student) => ({
    id: student.id,
    name: student.name,
    discipline: student.discipline,
    locationId: student.locationId,
    locationName: student.location?.name || "Home / Independent",
    payerName: student.payerLinks[0]?.payer.name || "",
    payerEmail: student.payerLinks[0]?.payer.email || "",
    payerPhone: student.payerLinks[0]?.payer.phone || "",
  }));

  const locations = locationsRaw.map((link) => ({
    id: link.location.id,
    name: link.location.name,
  }));

  const mapLesson = (lesson: (typeof todayLessonsRaw)[number]) => ({
    id: lesson.id,
    studentName: lesson.student.name,
    studentId: lesson.studentId,
    locationName: lesson.location.name,
    scheduledAt: lesson.scheduledAt.toISOString(),
    durationMins: lesson.durationMins,
    status: lesson.status,
    note: lesson.note?.content || "",
  });

  const unpaidInvoices = unpaidInvoicesRaw.map((invoice) => ({
    id: invoice.id,
    studentName: invoice.student.name,
    invoiceRef: invoice.invoiceRef,
    totalAmount: invoice.totalAmount,
    paidAmount: invoice.paidAmount || 0,
    dueDate: invoice.dueDate.toISOString(),
    status: invoice.status,
    emailedAt: invoice.emailedAt?.toISOString() || null,
  }));

  const payers = payersRaw.map((payer) => ({
    id: payer.id,
    name: payer.name,
    email: payer.email || "",
    phone: payer.phone || "",
    students: payer.studentLinks.map((link) => link.student.name),
  }));

  return (
    <QuickToolsView
      students={students}
      locations={locations}
      todayLessons={todayLessonsRaw.map(mapLesson)}
      recentLessons={recentLessonsRaw.map(mapLesson)}
      unpaidInvoices={unpaidInvoices}
      payers={payers}
      hasInvoicing={hasInvoicing}
    />
  );
}
