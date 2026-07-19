"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  Banknote,
  CalendarPlus,
  Check,
  ClipboardCheck,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Send,
  Settings2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  quickCreateLessonAction,
  quickCreateStudentAction,
  quickMarkInvoicePaidAction,
  quickUpdateLessonAction,
} from "./actions";

type StudentRow = {
  id: string;
  name: string;
  discipline: string;
  locationId: string | null;
  locationName: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
};

type LocationRow = { id: string; name: string };

type LessonRow = {
  id: string;
  studentId: string;
  studentName: string;
  locationName: string;
  scheduledAt: string;
  durationMins: number;
  status: "HELD" | "CANCELLED_BY_STUDENT" | "CANCELLED_BY_TEACHER" | "RESCHEDULED";
  note: string;
};

type InvoiceRow = {
  id: string;
  studentName: string;
  invoiceRef: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  emailedAt: string | null;
};

type PayerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  students: string[];
};

function todayInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function formatMoney(value: number) {
  return `${String.fromCharCode(163)}${value.toFixed(2)}`;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function Panel({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: typeof UserPlus;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-900 text-white">
            <Icon className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-black uppercase tracking-wide text-neutral-900">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function QuickToolsView({
  students,
  locations,
  todayLessons,
  recentLessons,
  unpaidInvoices,
  payers,
}: {
  students: StudentRow[];
  locations: LocationRow[];
  todayLessons: LessonRow[];
  recentLessons: LessonRow[];
  unpaidInvoices: InvoiceRow[];
  payers: PayerRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [studentForm, setStudentForm] = useState({
    studentName: "",
    discipline: "",
    payerName: "",
    payerEmail: "",
    payerPhone: "",
    locationId: "",
  });
  const [lessonForm, setLessonForm] = useState({
    studentId: students[0]?.id || "",
    locationId: locations[0]?.id || "",
    scheduledAt: todayInputValue(),
    durationMins: 30,
    note: "",
  });
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, { status: LessonRow["status"]; note: string }>>(
    Object.fromEntries([...todayLessons, ...recentLessons].map((lesson) => [lesson.id, { status: lesson.status, note: lesson.note }]))
  );
  const [invoiceAmounts, setInvoiceAmounts] = useState<Record<string, number>>(
    Object.fromEntries(unpaidInvoices.map((invoice) => [invoice.id, invoice.totalAmount - invoice.paidAmount]))
  );
  const [selectedVenue, setSelectedVenue] = useState(locations[0]?.id || "");
  const [selectedPayerId, setSelectedPayerId] = useState(payers[0]?.id || "");
  const [quickSearch, setQuickSearch] = useState("");

  const selectedVenueStudents = useMemo(
    () => students.filter((student) => (selectedVenue ? student.locationId === selectedVenue : true)),
    [selectedVenue, students]
  );

  const filteredStudents = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return students.slice(0, 12);
    return students
      .filter((student) =>
        [student.name, student.discipline, student.payerName, student.locationName].some((value) => value.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [quickSearch, students]);

  const selectedPayer = payers.find((payer) => payer.id === selectedPayerId);

  const saveStudent = () => {
    setMessage("");
    startTransition(async () => {
      const res = await quickCreateStudentAction(studentForm);
      if (res.success) {
        setStudentForm({ studentName: "", discipline: "", payerName: "", payerEmail: "", payerPhone: "", locationId: "" });
        setMessage("Student added.");
      } else {
        setMessage(res.error || "Could not add student.");
      }
    });
  };

  const saveLesson = () => {
    setMessage("");
    startTransition(async () => {
      const res = await quickCreateLessonAction(lessonForm);
      setMessage(res.success ? "Lesson added." : res.error || "Could not add lesson.");
    });
  };

  const saveLessonRow = (lessonId: string) => {
    const draft = lessonDrafts[lessonId];
    if (!draft) return;
    setMessage("");
    startTransition(async () => {
      const res = await quickUpdateLessonAction({ lessonId, status: draft.status, note: draft.note });
      setMessage(res.success ? "Lesson updated." : res.error || "Could not update lesson.");
    });
  };

  const markPaid = (invoice: InvoiceRow) => {
    setMessage("");
    startTransition(async () => {
      const res = await quickMarkInvoicePaidAction(invoice.id, invoiceAmounts[invoice.id] || invoice.totalAmount);
      setMessage(res.success ? "Payment recorded." : res.error || "Could not record payment.");
    });
  };

  const openVenueMessage = () => {
    const emails = selectedVenueStudents.map((student) => student.payerEmail).filter(Boolean);
    if (emails.length === 0) return;
    window.location.href = `mailto:${emails.join(",")}?subject=${encodeURIComponent("Lesson update")}&body=${encodeURIComponent(
      "Hello,\n\nA quick update about lessons:\n\n"
    )}`;
  };

  const openPayerMessage = () => {
    if (!selectedPayer?.email) return;
    window.location.href = `mailto:${selectedPayer.email}?subject=${encodeURIComponent("Lesson update")}&body=${encodeURIComponent(
      "Hello,\n\nA quick update from lessons:\n\n"
    )}`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Quick Tools</h1>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            Fast lanes for daily teaching, setup, payments, messages, and term admin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/quick-invoice" className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-black text-white">
            Quick Invoice
          </Link>
          <Link href="/dashboard/timetable/new" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-black text-neutral-700">
            Timetable Builder
          </Link>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-800">{message}</div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Quick Student Setup" icon={UserPlus}>
          <div className="grid gap-2 md:grid-cols-3">
            <input className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold outline-none focus:border-neutral-900" placeholder="Student name" value={studentForm.studentName} onChange={(e) => setStudentForm({ ...studentForm, studentName: e.target.value })} />
            <input className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold outline-none focus:border-neutral-900" placeholder="Subject" value={studentForm.discipline} onChange={(e) => setStudentForm({ ...studentForm, discipline: e.target.value })} />
            <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold outline-none focus:border-neutral-900" value={studentForm.locationId} onChange={(e) => setStudentForm({ ...studentForm, locationId: e.target.value })}>
              <option value="">Home / independent</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
            <input className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold outline-none focus:border-neutral-900" placeholder="Payer name" value={studentForm.payerName} onChange={(e) => setStudentForm({ ...studentForm, payerName: e.target.value })} />
            <input className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold outline-none focus:border-neutral-900" placeholder="Payer email" value={studentForm.payerEmail} onChange={(e) => setStudentForm({ ...studentForm, payerEmail: e.target.value })} />
            <button type="button" onClick={saveStudent} disabled={isPending} className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300">
              <Plus className="mr-1 inline h-3.5 w-3.5" /> Add Student
            </button>
          </div>
        </Panel>

        <Panel title="Quick Add Lesson" icon={CalendarPlus}>
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_86px_auto]">
            <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold outline-none focus:border-neutral-900" value={lessonForm.studentId} onChange={(e) => setLessonForm({ ...lessonForm, studentId: e.target.value })}>
              {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
            </select>
            <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold outline-none focus:border-neutral-900" value={lessonForm.locationId} onChange={(e) => setLessonForm({ ...lessonForm, locationId: e.target.value })}>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
            <input type="datetime-local" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold outline-none focus:border-neutral-900" value={lessonForm.scheduledAt} onChange={(e) => setLessonForm({ ...lessonForm, scheduledAt: e.target.value })} />
            <input type="number" min="15" step="5" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold outline-none focus:border-neutral-900" value={lessonForm.durationMins} onChange={(e) => setLessonForm({ ...lessonForm, durationMins: Number(e.target.value) })} />
            <button type="button" onClick={saveLesson} disabled={isPending || !lessonForm.studentId || !lessonForm.locationId} className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300">
              Save
            </button>
          </div>
          <input className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold outline-none focus:border-neutral-900" placeholder="Optional note" value={lessonForm.note} onChange={(e) => setLessonForm({ ...lessonForm, note: e.target.value })} />
        </Panel>

        <Panel title="Today's Teaching Sheet" icon={ClipboardCheck}>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-neutral-200">
            {todayLessons.length === 0 ? (
              <p className="p-4 text-sm font-semibold text-neutral-400">No lessons today.</p>
            ) : todayLessons.map((lesson) => {
              const draft = lessonDrafts[lesson.id] || { status: lesson.status, note: lesson.note };
              return (
                <div key={lesson.id} className="grid gap-2 border-b border-neutral-100 p-3 last:border-0 md:grid-cols-[130px_1fr_150px_auto] md:items-center">
                  <div className="text-xs font-black text-neutral-900">{formatDateTime(lesson.scheduledAt)}</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-neutral-900">{lesson.studentName}</p>
                    <p className="truncate text-[10px] font-bold uppercase text-neutral-400">{lesson.locationName}</p>
                  </div>
                  <select className="rounded-lg border border-neutral-200 px-2 py-2 text-xs font-bold" value={draft.status} onChange={(e) => setLessonDrafts({ ...lessonDrafts, [lesson.id]: { ...draft, status: e.target.value as LessonRow["status"] } })}>
                    <option value="HELD">Present</option>
                    <option value="CANCELLED_BY_STUDENT">Absent</option>
                    <option value="CANCELLED_BY_TEACHER">Teacher cancelled</option>
                    <option value="RESCHEDULED">Rescheduled</option>
                  </select>
                  <button type="button" onClick={() => saveLessonRow(lesson.id)} className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-black text-white">
                    <Check className="mr-1 inline h-3.5 w-3.5" /> Save
                  </button>
                  <input className="md:col-span-4 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold" placeholder="Lesson note or homework" value={draft.note} onChange={(e) => setLessonDrafts({ ...lessonDrafts, [lesson.id]: { ...draft, note: e.target.value } })} />
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Quick Payment Tracker" icon={Banknote}>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-neutral-200">
            {unpaidInvoices.length === 0 ? (
              <p className="p-4 text-sm font-semibold text-neutral-400">No unpaid quick invoices.</p>
            ) : unpaidInvoices.map((invoice) => (
              <div key={invoice.id} className="grid gap-2 border-b border-neutral-100 p-3 last:border-0 md:grid-cols-[1fr_90px_100px_auto] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-neutral-900">{invoice.studentName}</p>
                  <p className="text-[10px] font-bold uppercase text-neutral-400">{invoice.invoiceRef} due {new Date(invoice.dueDate).toLocaleDateString("en-GB")}</p>
                </div>
                <p className="text-sm font-black text-neutral-900">{formatMoney(invoice.totalAmount)}</p>
                <input type="number" min="0" className="rounded-lg border border-neutral-200 px-2 py-2 text-sm font-black" value={invoiceAmounts[invoice.id] ?? invoice.totalAmount} onChange={(e) => setInvoiceAmounts({ ...invoiceAmounts, [invoice.id]: Number(e.target.value) })} />
                <button type="button" onClick={() => markPaid(invoice)} className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-black text-white">Paid</button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Quick Message Centre" icon={MessageSquare}>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase text-neutral-400">Venue group</label>
              <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold" value={selectedVenue} onChange={(e) => setSelectedVenue(e.target.value)}>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
              <p className="mt-1 text-[10px] font-bold text-neutral-400">{selectedVenueStudents.length} students with this venue filter.</p>
            </div>
            <button type="button" onClick={openVenueMessage} className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-black text-white">
              <Send className="mr-1 inline h-3.5 w-3.5" /> Email Venue
            </button>
          </div>
        </Panel>

        <Panel title="Quick Payer View" icon={Users}>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold" value={selectedPayerId} onChange={(e) => setSelectedPayerId(e.target.value)}>
              {payers.map((payer) => <option key={payer.id} value={payer.id}>{payer.name}</option>)}
            </select>
            <button type="button" onClick={openPayerMessage} disabled={!selectedPayer?.email} className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300">
              <Mail className="mr-1 inline h-3.5 w-3.5" /> Email
            </button>
          </div>
          {selectedPayer && (
            <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-xs font-semibold text-neutral-600">
              <p className="font-black text-neutral-900">{selectedPayer.name}</p>
              <p>{selectedPayer.email || "No email"} {selectedPayer.phone ? `- ${selectedPayer.phone}` : ""}</p>
              <p className="mt-1 text-neutral-400">Students: {selectedPayer.students.join(", ") || "None linked"}</p>
            </div>
          )}
        </Panel>

        <Panel title="Quick Attendance Catch-Up" icon={ClipboardCheck}>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-neutral-200">
            {recentLessons.slice(0, 8).map((lesson) => {
              const draft = lessonDrafts[lesson.id] || { status: lesson.status, note: lesson.note };
              return (
                <div key={lesson.id} className="grid gap-2 border-b border-neutral-100 p-3 last:border-0 md:grid-cols-[132px_1fr_150px_auto] md:items-center">
                  <p className="text-xs font-black text-neutral-700">{formatDateTime(lesson.scheduledAt)}</p>
                  <p className="truncate text-sm font-black text-neutral-900">{lesson.studentName}</p>
                  <select className="rounded-lg border border-neutral-200 px-2 py-2 text-xs font-bold" value={draft.status} onChange={(e) => setLessonDrafts({ ...lessonDrafts, [lesson.id]: { ...draft, status: e.target.value as LessonRow["status"] } })}>
                    <option value="HELD">Present</option>
                    <option value="CANCELLED_BY_STUDENT">Absent</option>
                    <option value="CANCELLED_BY_TEACHER">Teacher cancelled</option>
                    <option value="RESCHEDULED">Rescheduled</option>
                  </select>
                  <button type="button" onClick={() => saveLessonRow(lesson.id)} className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-black text-white">Save</button>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Quick Term Setup" icon={Settings2}>
          <div className="grid gap-2 sm:grid-cols-3">
            <Link href="/dashboard/term-calendars" className="rounded-lg border border-neutral-200 px-3 py-3 text-xs font-black text-neutral-800 hover:bg-neutral-50">Term Dates</Link>
            <Link href="/dashboard/timetable/new" className="rounded-lg border border-neutral-200 px-3 py-3 text-xs font-black text-neutral-800 hover:bg-neutral-50">Generate Timetable</Link>
            <Link href="/dashboard/quick-invoice" className="rounded-lg border border-neutral-200 px-3 py-3 text-xs font-black text-neutral-800 hover:bg-neutral-50">Invoice Periods</Link>
          </div>
        </Panel>
      </div>

      <Panel title="Quick Search" icon={Search}>
        <input className="mb-3 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold outline-none focus:border-neutral-900" placeholder="Find a student, payer, subject, or venue" value={quickSearch} onChange={(e) => setQuickSearch(e.target.value)} />
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {filteredStudents.map((student) => (
            <div key={student.id} className="rounded-lg border border-neutral-200 px-3 py-2">
              <p className="text-sm font-black text-neutral-900">{student.name}</p>
              <p className="text-[10px] font-bold uppercase text-neutral-400">{student.discipline} - {student.locationName}</p>
              <p className="mt-1 truncate text-xs font-semibold text-neutral-500">{student.payerName} {student.payerEmail ? `- ${student.payerEmail}` : ""}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}


