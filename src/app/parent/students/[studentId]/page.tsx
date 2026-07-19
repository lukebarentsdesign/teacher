import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  TrendingUp, DollarSign, BookOpen, FileText, CheckCircle2, 
  ArrowRight, ShieldCheck 
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getAuthorizedStudentView } from "@/lib/microsite-access";
import { calculateMakeUpCreditsOwed } from "@/lib/ledger";
import { RequestPrivateTuitionButton } from "./request-private-tuition-button";

export default async function StudentOverviewPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const context = await getAuthorizedStudentView(studentId);
  if (!context) notFound();

  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: { location: true, teacher: true },
  });

  const pendingPrivateTuitionRequest =
    context.viewerType === "guardian" && student.locationId
      ? await prisma.privateTuitionRequest.findFirst({ where: { studentId, status: "PENDING" } })
      : null;

  // Retrieve upcoming and past lessons
  const [upcomingLessons, pastLessons, activeAssignments] = await Promise.all([
    prisma.lesson.findMany({
      where: { studentId, scheduledAt: { gte: new Date() }, status: "HELD" },
      include: { location: true, room: true },
      orderBy: { scheduledAt: "asc" },
      take: 2,
    }),
    prisma.lesson.findMany({
      where: { studentId, scheduledAt: { lt: new Date() }, status: "HELD" },
      include: { location: true, room: true, note: true },
      orderBy: { scheduledAt: "desc" },
      take: 2,
    }),
    prisma.assignment.findMany({
      where: { studentId, status: "ASSIGNED" },
      orderBy: { assignedDate: "desc" },
      take: 3,
    }),
  ]);

  // Retrieve resources
  const lessonIds = (
    await prisma.lesson.findMany({ where: { studentId }, select: { id: true } })
  ).map((lesson) => lesson.id);

  const assignmentResourceIds = (
    await prisma.assignment.findMany({
      where: { studentId, resourceId: { not: null } },
      select: { resourceId: true },
    })
  )
    .map((assignment) => assignment.resourceId)
    .filter((id): id is string => id !== null);

  const resources = await prisma.resource.findMany({
    where: {
      OR: [
        { studentId },
        { lessonId: { in: lessonIds } },
        { id: { in: assignmentResourceIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // Calculate Ledger details
  const subscriptions = await prisma.subscription.findMany({
    where: { studentId },
    include: { ledgerEntries: true },
  });

  let totalPaid = 0;
  let totalPayable = 0;
  let makeUpCreditsTotal = 0;

  subscriptions.forEach((sub) => {
    makeUpCreditsTotal += calculateMakeUpCreditsOwed(sub.ledgerEntries);
    sub.ledgerEntries.forEach((entry) => {
      const amt = Number(entry.amount);
      if (entry.operation === "CREDIT") {
        totalPaid += amt;
      } else {
        totalPayable += amt;
      }
    });
  });

  const cashBalance = totalPaid - totalPayable;
  const showLedger = context.canSeeLedger;

  // Progress — the most recently started active curriculum, if any. Reads are never gated by
  // module entitlement, so this shows regardless of whether Curriculum is currently switched on.
  const activeCurriculum = await prisma.studentCurriculum.findFirst({
    where: { studentId, status: "ACTIVE" },
    include: { sections: true },
    orderBy: { startedDate: "desc" },
  });
  const progressTotal = activeCurriculum?.sections.length ?? 0;
  const progressCompleted = activeCurriculum?.sections.filter((s) => s.status === "COMPLETED").length ?? 0;
  const progressPercent = progressTotal === 0 ? 0 : Math.round((progressCompleted / progressTotal) * 100);

  return (
    <div className="space-y-8">
      {/* 2-Column Responsive Portal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Welcome Banner, Enrolled Courses, Assignments, Materials (70%) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Welcome Banner Card (Purple) */}
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white p-8 shadow-lg border border-[#7c3aed]">
            <div className="relative z-10 max-w-md">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">
                {new Date().toLocaleDateString("en-GB", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <h2 className="text-2xl font-black tracking-tight mt-1">
                Welcome back, {student.name}!
              </h2>
              <p className="text-xs text-white/80 font-medium leading-relaxed mt-1">
                Always stay updated with your schedule, progress notes, and study guides.
              </p>
            </div>
            {/* 3D Illustration notch styling */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
            <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-white/10 pointer-events-none" />
          </div>

          {/* Enrolled Courses / Subject Card */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Enrolled course</h3>
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center border border-brand-100 text-brand-700 shrink-0 shadow-sm">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-base">{student.discipline || "Class Study"}</h4>
                  {upcomingLessons.length > 0 ? (
                    <p className="text-xs text-neutral-500 font-semibold mt-0.5">
                      Next lesson: {new Date(upcomingLessons[0].scheduledAt).toLocaleDateString("en-GB")} at {new Date(upcomingLessons[0].scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-500 font-semibold mt-0.5">
                      {student.location?.name ?? "Home student"}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Instructor</p>
                  <p className="text-xs font-bold text-neutral-800">{student.teacher.name}</p>
                </div>
                <Link
                  href={`/parent/students/${studentId}/calendar`}
                  className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 transition-all shadow-sm"
                >
                  View Schedule
                </Link>
              </div>
            </div>
          </div>

          {/* Progress (curriculum completion) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Progress</h3>
              <Link href={`/parent/students/${studentId}/progress`} className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                See all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {!activeCurriculum ? (
              <p className="text-xs font-medium text-neutral-500 rounded-2xl bg-white border border-neutral-200/80 p-5 shadow-sm text-center">
                No curriculum plan set up yet.
              </p>
            ) : (
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-neutral-900 text-sm">{activeCurriculum.title}</h4>
                  <span className="text-xs font-bold text-brand-700">{progressPercent}%</span>
                </div>
                <div className="mt-2.5 h-2 w-full rounded-full bg-neutral-100">
                  <div
                    className="h-2 rounded-full bg-brand-500 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-neutral-400 font-semibold">
                  {progressCompleted} of {progressTotal} section{progressTotal === 1 ? "" : "s"} complete
                </p>
              </div>
            )}
          </div>

          {/* Practice for Next Week (Assignments) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Practice for next week</h3>
              <Link href={`/parent/students/${studentId}/assignments`} className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                See all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {activeAssignments.length === 0 ? (
              <p className="text-xs font-medium text-neutral-500 rounded-2xl bg-white border border-neutral-200/80 p-5 shadow-sm text-center">
                No active practices or assignments pending.
              </p>
            ) : (
              <div className="space-y-2">
                {activeAssignments.map((asg) => (
                  <div key={asg.id} className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-neutral-300 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900">{asg.title}</h4>
                        <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">
                          Assigned: {asg.assignedDate.toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/parent/students/${studentId}/assignments`}
                      className="text-xs font-semibold text-neutral-400 hover:text-neutral-700 p-1"
                      title="Review Assignment"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lesson Materials & Resources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Lesson materials</h3>
              <Link href={`/parent/students/${studentId}/resources`} className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                See all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {resources.length === 0 ? (
              <p className="text-xs font-medium text-neutral-500 rounded-2xl bg-white border border-neutral-200/80 p-5 shadow-sm text-center">
                No shared files or materials.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {resources.map((res) => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm hover:border-brand-300 transition-all flex items-start gap-2.5"
                  >
                    <FileText className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-neutral-950 truncate">{res.title}</h4>
                      <p className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider mt-0.5">
                        {res.sourceLabel || res.folder || res.type}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Finance, Notices & Feedback (30%) */}
        <div className="space-y-6">

          {/* Finance / Current Balance Plans */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Finance</h3>
            {!showLedger ? (
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                  Your guardian hasn&apos;t shared the financial ledger with you.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 1. Total Paid (Mockup central active card) */}
                <div className="bg-white border-2 border-brand-500 rounded-2xl p-5 shadow-md relative">
                  <span className="absolute top-4 right-4 h-6 w-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                    <DollarSign className="h-4.5 w-4.5" />
                  </span>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Paid</p>
                  <p className="text-2xl font-black text-neutral-900 mt-1">£{totalPaid.toFixed(2)}</p>
                  <p className="text-[9px] text-neutral-400 font-bold mt-1 uppercase tracking-wide">Fully Settled</p>
                </div>

                {/* 2. Total Payable / Balance */}
                <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Balance</p>
                  <p className={`text-xl font-extrabold mt-1 ${cashBalance < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {cashBalance < 0 ? "-" : ""}£{Math.abs(cashBalance).toFixed(2)}
                  </p>
                  <p className="text-[9px] text-neutral-400 font-semibold mt-1">
                    {cashBalance >= 0 ? "In Credit" : "Owed"}
                  </p>
                </div>

                {/* 3. Make-up Lessons Owed */}
                <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Makeup Owed</p>
                    <p className="text-xl font-extrabold text-neutral-900 mt-0.5">{makeUpCreditsTotal}</p>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Emergency Booking actions (if guardian) */}
          {context.viewerType === "guardian" && student.locationId && (
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Booking Action</span>
                <ShieldCheck className="h-4 w-4 text-brand-600" />
              </div>
              {pendingPrivateTuitionRequest ? (
                <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                  Your request for private lessons with {student.teacher.name} is pending.
                </p>
              ) : (
                <RequestPrivateTuitionButton studentId={studentId} teacherName={student.teacher.name} />
              )}
            </div>
          )}

          {/* Daily Notice & Lesson Feedback (History) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Daily notice & feedback</h3>
              <Link href={`/parent/students/${studentId}/notes`} className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                See all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {pastLessons.length === 0 ? (
              <p className="text-xs font-medium text-neutral-500 rounded-2xl bg-white border border-neutral-200/80 p-5 shadow-sm text-center">
                No past feedback logs.
              </p>
            ) : (
              <div className="space-y-3">
                {pastLessons.map((lesson) => {
                  const d = new Date(lesson.scheduledAt);
                  return (
                    <div key={lesson.id} className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm relative space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase">
                          {d.toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-[9px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md border border-teal-100 uppercase tracking-wider">
                          Held
                        </span>
                      </div>
                      
                      <div className="text-xs font-semibold text-neutral-800">
                        {student.discipline} - {lesson.location.name}
                      </div>

                      {lesson.note?.content && (
                        <p className="text-[10px] text-neutral-500 font-medium leading-relaxed bg-neutral-50 border border-neutral-100 rounded-xl p-2.5">
                          {lesson.note.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
