"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, MapPin, Calendar, FileDown, Share2, Send, Mail, Check, Settings, Sparkles, User, AlertCircle
} from "lucide-react";
import {
  quickAddStudentAction,
  saveTeacherInvoiceSettingsAction,
  sendQuickInvoiceEmailAction,
  sendBatchQuickInvoicesAction,
  createQuickInvoiceAction,
  recordQuickInvoiceSentAction,
  markQuickInvoicesSentAction,
  markInvoicePaidAction,
  updateLessonAttendanceAction,
  getStudentInvoicesAction,
  type QuickAddStudentInput,
  type QuickInvoiceSettingsInput,
  type BatchInvoiceItem,
  type CreateQuickInvoiceInput,
  type InvoiceHistoryItem
} from "./actions";

type TeacherType = {
  id: string;
  name: string;
  email: string;
  businessName: string | null;
  businessAddress: string | null;
  paymentInstructions: string | null;
  invoiceStripeLink: string | null;
  invoiceEmailSubjectTemplate: string | null;
  invoiceEmailBodyTemplate: string | null;
  gmailConnected: boolean;
  gmailConnectedEmail: string | null;
};

type StudentType = {
  id: string;
  name: string;
  discipline: string;
  billingFrequency: string;
  locationId: string | null;
  locationName: string | null;
  payerName: string;
  payerEmail: string | null;
  payerPhone: string | null;
  upcomingLessonsCount: number;
};

type LocationType = {
  id: string;
  name: string;
};
const DEFAULT_INVOICE_EMAIL_SUBJECT_TEMPLATE = "Invoice for {studentName}'s lessons";
const DEFAULT_INVOICE_EMAIL_BODY_TEMPLATE = [
  "Hi {payerName},",
  "",
  "Please find attached the invoice for {studentName}'s lessons.",
  "",
  "Total due: {totalDue}",
  "Due date: {dueDate}",
  "{paymentLinkLine}",
  "If you have any questions, feel free to reply directly to this email.",
  "",
  "Best regards,",
  "{teacherName}",
].join("\n");

type InvoiceEmailTemplateValues = {
  payerName: string;
  studentName: string;
  lessonsCount: number;
  billingUnit: string;
  totalDue: string;
  dueDate: string;
  stripeLink: string;
  teacherName: string;
  invoiceRef: string;
};

function renderInvoiceEmailTemplate(template: string, values: InvoiceEmailTemplateValues): string {
  const paymentLinkLine = values.stripeLink ? `Stripe online payment link: ${values.stripeLink}` : "";
  return template
    .replaceAll("{payerName}", values.payerName)
    .replaceAll("{studentName}", values.studentName)
    .replaceAll("{lessonsCount}", String(values.lessonsCount))
    .replaceAll("{billingUnit}", values.billingUnit)
    .replaceAll("{totalDue}", values.totalDue)
    .replaceAll("{dueDate}", values.dueDate)
    .replaceAll("{stripeLink}", values.stripeLink)
    .replaceAll("{paymentLinkLine}", paymentLinkLine)
    .replaceAll("{teacherName}", values.teacherName)
    .replaceAll("{invoiceRef}", values.invoiceRef)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function QuickInvoiceView({
  teacher,
  students,
  locations,
  invoiceReminder,
}: {
  teacher: TeacherType;
  students: StudentType[];
  locations: LocationType[];
  invoiceReminder: { count: number; overdueCount: number; studentNames: string[] };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<"venue" | "upcoming">("upcoming");
  const [selectedVenueFilter, setSelectedVenueFilter] = useState("home");
  const [globalQuantity, setGlobalQuantity] = useState<number>(4);
  const [venueRates, setVenueRates] = useState<Record<string, number>>({});
  const [globalUnit, setGlobalUnit] = useState<"lessons" | "hours">("lessons");
  const [invoicePeriodMode, setInvoicePeriodMode] = useState<"this" | "last">("this");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Quick Add Student Modal/Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentForm, setStudentForm] = useState<Omit<QuickAddStudentInput, "locationChoice">>({
    studentName: "",
    discipline: "",
    billingFrequency: "monthly",
    payerName: "",
    payerEmail: "",
    payerPhone: "",
  });
  const [locationChoice, setLocationChoice] = useState("home");
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");
  const [addError, setAddError] = useState("");

  // Invoice Parameters
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null);
  const [lessonsCount, setLessonsCount] = useState<number>(4);
  const [costPerLesson, setCostPerLesson] = useState<number>(30);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toDateInputValue(d);
  });
  const [invoiceRef, setInvoiceRef] = useState<string>("");

  // Teacher Invoicing Profile Settings State
  const [teacherProfile, setTeacherProfile] = useState<QuickInvoiceSettingsInput>({
    businessName: teacher.businessName || teacher.name,
    businessAddress: teacher.businessAddress || "",
    paymentInstructions: teacher.paymentInstructions || "",
    invoiceStripeLink: teacher.invoiceStripeLink || "",
    invoiceEmailSubjectTemplate: teacher.invoiceEmailSubjectTemplate || DEFAULT_INVOICE_EMAIL_SUBJECT_TEMPLATE,
    invoiceEmailBodyTemplate: teacher.invoiceEmailBodyTemplate || DEFAULT_INVOICE_EMAIL_BODY_TEMPLATE,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState(false);

  // Email template state
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sentInvoiceIds, setSentInvoiceIds] = useState<Record<string, { invoiceId: string; invoiceUrl: string }>>({});
  // Invoice Calendar & Billing State
  const [billingMode, setBillingMode] = useState<"upfront" | "arrears">("upfront");
  const [periodStart, setPeriodStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return toDateInputValue(d);
  });
  const [periodEnd, setPeriodEnd] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0);
    return toDateInputValue(d);
  });
  const [lessonDates, setLessonDates] = useState<{ date: string; attended: boolean }[]>([]);
  const [saveInvoiceSuccess, setSaveInvoiceSuccess] = useState(false);
  const [saveInvoiceError, setSaveInvoiceError] = useState("");

  // Invoice History State
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Mark Paid Modal State
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [markPaidPending, setMarkPaidPending] = useState(false);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const attendedCount = billingMode === "arrears"
    ? lessonDates.filter((d) => d.attended).length
    : lessonDates.length;
  const computedTotal = attendedCount * costPerLesson;
  const formatCurrency = (amount: number) => `${String.fromCharCode(163)}${amount.toFixed(2)}`;
  const formatDisplayDueDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("en-GB");
  const getInvoiceTemplateValues = (student: StudentType, count: number, rate: number): InvoiceEmailTemplateValues => ({
    payerName: student.payerName,
    studentName: student.name,
    lessonsCount: count,
    billingUnit: globalUnit,
    totalDue: formatCurrency(count * rate),
    dueDate: formatDisplayDueDate(dueDate),
    stripeLink: teacherProfile.invoiceStripeLink || "",
    teacherName: teacherProfile.businessName || teacher.name,
    invoiceRef,
  });
  const renderSubjectForStudent = (student: StudentType, count: number, rate: number) =>
    renderInvoiceEmailTemplate(
      teacherProfile.invoiceEmailSubjectTemplate || DEFAULT_INVOICE_EMAIL_SUBJECT_TEMPLATE,
      getInvoiceTemplateValues(student, count, rate)
    );
  const renderBodyForStudent = (student: StudentType, count: number, rate: number) =>
    renderInvoiceEmailTemplate(
      teacherProfile.invoiceEmailBodyTemplate || DEFAULT_INVOICE_EMAIL_BODY_TEMPLATE,
      getInvoiceTemplateValues(student, count, rate)
    );
  const applyStandardEmailMessage = () => {
    if (!selectedStudent) return;
    setEmailSubject(renderSubjectForStudent(selectedStudent, attendedCount, costPerLesson));
    setEmailBody(renderBodyForStudent(selectedStudent, attendedCount, costPerLesson));
  };
  // Batch Mode State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [batchLessonsConfig, setBatchLessonsConfig] = useState<Record<string, number>>({});
  const [batchCostConfig, setBatchCostConfig] = useState<Record<string, number>>({});
  const [batchSendStatus, setBatchSendStatus] = useState<{
    inProgress: boolean;
    success?: boolean;
    results?: { studentName: string; success: boolean; error?: string }[];
  }>({ inProgress: false });
  const [mailtoQueue, setMailtoQueue] = useState<{
    items: { studentId: string; studentName: string; payerEmail: string; subject: string; body: string; pdfUrl: string; invoiceId: string; invoiceUrl: string; lessonsCount: number; costPerLesson: number }[];
    currentIndex: number;
  } | null>(null);

  // Sync batch lessons and costs when student selection updates
  useEffect(() => {
    const updatedLessons = { ...batchLessonsConfig };
    const updatedCosts = { ...batchCostConfig };
    let changed = false;

    selectedStudentIds.forEach((id) => {
      const match = students.find((s) => s.id === id);
      if (match) {
        if (updatedLessons[id] === undefined) {
          updatedLessons[id] = match.upcomingLessonsCount > 0 ? match.upcomingLessonsCount : 
                               match.billingFrequency === "weekly" ? 1 : 
                               match.billingFrequency === "termly" ? 10 : 4;
          changed = true;
        }
        if (updatedCosts[id] === undefined) {
          updatedCosts[id] = 30; // default rate
          changed = true;
        }
      }
    });

    if (changed) {
      setBatchLessonsConfig(updatedLessons);
      setBatchCostConfig(updatedCosts);
    }
  }, [selectedStudentIds, students, batchLessonsConfig, batchCostConfig]);

  // Update selected student details when ID changes
  useEffect(() => {
    if (selectedStudentId) {
      const match = students.find((s) => s.id === selectedStudentId);
      if (match) {
        setSelectedStudent(match);
        // Pre-fill lessons count based on upcoming scheduled classes, or default to frequency
        const count = match.upcomingLessonsCount > 0 ? match.upcomingLessonsCount : 
                      match.billingFrequency === "weekly" ? 1 : 
                      match.billingFrequency === "termly" ? 10 : 4;
        setLessonsCount(count);
        setInvoiceRef(`INV-${match.name.replace(/\s+/g, "").toUpperCase()}-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,"0")}`);
        
        // Setup initial email body
        setEmailSubject(`Invoice for ${match.name}'s Lessons`);
      }
    } else {
      setSelectedStudent(null);
    }
  }, [selectedStudentId, students]);

  // Sync email body when invoice params or the saved standard template change.
  useEffect(() => {
    if (selectedStudent) {
      setEmailSubject(renderSubjectForStudent(selectedStudent, attendedCount, costPerLesson));
      setEmailBody(renderBodyForStudent(selectedStudent, attendedCount, costPerLesson));
    }
  }, [attendedCount, costPerLesson, dueDate, invoiceRef, teacherProfile.invoiceStripeLink, teacherProfile.businessName, teacherProfile.invoiceEmailSubjectTemplate, teacherProfile.invoiceEmailBodyTemplate, selectedStudent, teacher.name]);

  // Show the saved standard message with placeholders while preparing a batch.
  useEffect(() => {
    if (selectedStudentIds.length > 0 && !selectedStudentId) {
      setEmailSubject(teacherProfile.invoiceEmailSubjectTemplate || DEFAULT_INVOICE_EMAIL_SUBJECT_TEMPLATE);
      setEmailBody(teacherProfile.invoiceEmailBodyTemplate || DEFAULT_INVOICE_EMAIL_BODY_TEMPLATE);
    }
  }, [selectedStudentIds.length, selectedStudentId, teacherProfile.invoiceEmailSubjectTemplate, teacherProfile.invoiceEmailBodyTemplate]);

  // Filter students based on search
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.payerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.discipline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group students by venue
  const groupedByVenue = filteredStudents.reduce((groups, student) => {
    const venueName = student.locationName || (student.locationId === "online" ? "Online" : "Home / Independent");
    if (!groups[venueName]) groups[venueName] = [];
    groups[venueName].push(student);
    return groups;
  }, {} as Record<string, StudentType[]>);

  // Group by upcoming (just sort)
  const sortedByUpcoming = [...filteredStudents].sort(
    (a, b) => b.upcomingLessonsCount - a.upcomingLessonsCount
  );


  const venueOptions = [
    { id: "home", name: "Home / Independent" },
    { id: "online", name: "Online" },
    ...locations,
  ];

  const getStudentVenueId = (student: StudentType) => student.locationId || "home";
  const invoiceMachineStudents = filteredStudents.filter((student) => getStudentVenueId(student) === selectedVenueFilter);
  const selectedVenueRate = venueRates[selectedVenueFilter] || costPerLesson;
  const updateSelectedVenueRate = (rate: number) => {
    const safeRate = Math.max(1, rate);
    setCostPerLesson(safeRate);
    setVenueRates((prev) => ({ ...prev, [selectedVenueFilter]: safeRate }));
  };
  const invoiceMachineSelectedStudents = selectedStudentIds
    .map((id) => students.find((student) => student.id === id))
    .filter((student): student is StudentType => Boolean(student));
  const selectedBatchTotal = invoiceMachineSelectedStudents.reduce((sum, student) => {
    const count = batchLessonsConfig[student.id] || globalQuantity;
    const rate = batchCostConfig[student.id] || venueRates[getStudentVenueId(student)] || costPerLesson;
    return sum + count * rate;
  }, 0);
  // Add Student Handler
  const handleAddStudent = () => {
    setAddError("");
    if (!studentForm.studentName || !studentForm.discipline || !studentForm.payerName || !studentForm.payerEmail) {
      setAddError("Please fill out all required fields.");
      return;
    }

    startTransition(async () => {
      const res = await quickAddStudentAction({
        ...studentForm,
        locationChoice,
        newLocationName,
        newLocationAddress,
      });

      if (res.success && res.studentId) {
        setShowAddModal(false);
        setSelectedStudentId(res.studentId);
        // Clear student form
        setStudentForm({
          studentName: "",
          discipline: "",
          billingFrequency: "monthly",
          payerName: "",
          payerEmail: "",
          payerPhone: "",
        });
        setLocationChoice("home");
        setNewLocationName("");
        setNewLocationAddress("");
        router.refresh();
      } else {
        setAddError(res.error || "Failed to add student");
      }
    });
  };

  // Save Settings Handler
  const handleSaveSettings = () => {
    setSettingsSuccess(false);
    setSettingsError(false);
    startTransition(async () => {
      const res = await saveTeacherInvoiceSettingsAction(teacherProfile);
      if (res.success) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        setSettingsError(true);
      }
    });
  };


  const handleSaveCurrentEmailAsStandard = () => {
    setSettingsSuccess(false);
    setSettingsError(false);
    const nextProfile = {
      ...teacherProfile,
      invoiceEmailSubjectTemplate: emailSubject || DEFAULT_INVOICE_EMAIL_SUBJECT_TEMPLATE,
      invoiceEmailBodyTemplate: emailBody || DEFAULT_INVOICE_EMAIL_BODY_TEMPLATE,
    };
    setTeacherProfile(nextProfile);
    startTransition(async () => {
      const res = await saveTeacherInvoiceSettingsAction(nextProfile);
      if (res.success) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        setSettingsError(true);
      }
    });
  };


  const applyPeriodShortcut = (period: "this" | "last") => {
    setInvoicePeriodMode(period);
    const now = new Date();
    const offset = period === "this" ? 0 : -1;
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
    setPeriodStart(toDateInputValue(start));
    setPeriodEnd(toDateInputValue(end));
    setDueDate(toDateInputValue(new Date(now.getFullYear(), now.getMonth() + offset + 1, 7)));
  };

  const handleVenueMachineChange = (venueId: string) => {
    setSelectedVenueFilter(venueId);
    setSelectedStudentId(null);
    const matching = filteredStudents.filter((student) => getStudentVenueId(student) === venueId);
    setSelectedStudentIds(matching.map((student) => student.id));
    const nextLessons = { ...batchLessonsConfig };
    const nextCosts = { ...batchCostConfig };
    matching.forEach((student) => {
      nextLessons[student.id] = nextLessons[student.id] || globalQuantity;
      nextCosts[student.id] = nextCosts[student.id] || venueRates[venueId] || costPerLesson;
    });
    setBatchLessonsConfig(nextLessons);
    setBatchCostConfig(nextCosts);
  };

  const applyGlobalInvoiceSettings = () => {
    const nextLessons = { ...batchLessonsConfig };
    const nextCosts = { ...batchCostConfig };
    selectedStudentIds.forEach((id) => {
      nextLessons[id] = globalQuantity;
      nextCosts[id] = selectedVenueRate;
    });
    setBatchLessonsConfig(nextLessons);
    setBatchCostConfig(nextCosts);
  };

  const buildInvoiceRecordKey = (studentId: string, count: number, rate: number) =>
    `${studentId}-${periodStart}-${periodEnd}-${dueDate}-${count}-${rate}`;

  const getHostedInvoiceUrl = (invoiceId: string, accessCode: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/invoice/${invoiceId}?code=${encodeURIComponent(accessCode)}`;
  };

  const recordSentInvoice = async (student: StudentType, count: number, rate: number) => {
    const key = buildInvoiceRecordKey(student.id, count, rate);
    if (sentInvoiceIds[key]) return sentInvoiceIds[key];

    const res = await recordQuickInvoiceSentAction({
      studentId: student.id,
      lessonsCount: count,
      costPerLesson: rate,
      billingUnit: globalUnit,
      periodStart,
      periodEnd,
      dueDate,
      markSent: false,
      invoiceRef: `INV-${student.name.replace(/\s+/g, "").toUpperCase()}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    });

    if (res.success && res.invoiceId && res.accessCode) {
      const invoiceLink = { invoiceId: res.invoiceId, invoiceUrl: getHostedInvoiceUrl(res.invoiceId, res.accessCode) };
      setSentInvoiceIds((prev) => ({ ...prev, [key]: invoiceLink }));
      return invoiceLink;
    }

    setSendError(res.error || "Could not create the hosted invoice link");
    return null;
  };

  const appendHostedInvoiceLink = (body: string, invoiceUrl: string) =>
    `${body}\n\nView or download the invoice here:\n${invoiceUrl}`;

  const openDefaultEmailForStudent = async (student: StudentType, count: number, rate: number) => {
    if (!student.payerEmail) return;
    setSendError("");
    const invoiceLink = await recordSentInvoice(student, count, rate);
    if (!invoiceLink) return;

    const values = getInvoiceTemplateValues(student, count, rate);
    const subject = renderInvoiceEmailTemplate(emailSubject || DEFAULT_INVOICE_EMAIL_SUBJECT_TEMPLATE, values);
    const baseBody = renderInvoiceEmailTemplate(emailBody || DEFAULT_INVOICE_EMAIL_BODY_TEMPLATE, values);
    const body = appendHostedInvoiceLink(baseBody, invoiceLink.invoiceUrl);
    const pdfUrl = getPdfUrlForStudent(student.id, count, rate);

    window.location.href = `mailto:${student.payerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setMailtoQueue({
      items: [{
        studentId: student.id,
        studentName: student.name,
        payerEmail: student.payerEmail,
        subject,
        body,
        pdfUrl,
        invoiceId: invoiceLink.invoiceId,
        invoiceUrl: invoiceLink.invoiceUrl,
        lessonsCount: count,
        costPerLesson: rate,
      }],
      currentIndex: 1,
    });
  };
  const openPdfAndRecordInvoice = async (student: StudentType, count: number, rate: number) => {
    setSendError("");
    window.open(getPdfUrlForStudent(student.id, count, rate), "_blank");
  };

  // Toggle student selection in roster
  const handleToggleStudentSelection = (studentId: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        setSelectedStudentId(null);
        setSelectedStudent(null);
        return [...prev, studentId];
      }
    });
  };

  const handleSelectSingleStudent = (studentId: string) => {
    setSelectedStudentIds([]);
    setSelectedStudentId(studentId);
  };

  // Direct Gmail Sender
  const handleSendGmail = () => {
    if (!selectedStudent) return;
    setSendSuccess(false);
    setSendError("");
    startTransition(async () => {
      const res = await sendQuickInvoiceEmailAction({
        studentId: selectedStudent.id,
        lessonsCount,
        costPerLesson,
        billingUnit: globalUnit,
        dueDate,
        emailSubject,
        emailBody,
        teacherAddress: teacherProfile.businessAddress,
        teacherBankDetails: teacherProfile.paymentInstructions,
        teacherStripeLink: teacherProfile.invoiceStripeLink || undefined,
      });

      if (res.success) {
        setSendSuccess(true);
      } else {
        setSendError(res.error || "Failed to send email");
      }
    });
  };

  // Batch Gmail Sender
  const handleBatchSendGmail = () => {
    if (selectedStudentIds.length === 0) return;
    setBatchSendStatus({ inProgress: true });

    startTransition(async () => {
      const invoicesToSend: BatchInvoiceItem[] = selectedStudentIds.map((id) => {
        const match = students.find((s) => s.id === id)!;
        const count = batchLessonsConfig[id] || 4;
        const rate = batchCostConfig[id] || 30;

        const values = getInvoiceTemplateValues(match, count, rate);
        const itemSubject = renderInvoiceEmailTemplate(
          emailSubject || DEFAULT_INVOICE_EMAIL_SUBJECT_TEMPLATE,
          values
        );
        const itemBody = renderInvoiceEmailTemplate(
          emailBody || DEFAULT_INVOICE_EMAIL_BODY_TEMPLATE,
          values
        );

        return {
          studentId: id,
          lessonsCount: count,
          costPerLesson: rate,
          billingUnit: globalUnit,
          emailSubject: itemSubject,
          emailBody: itemBody,
        };
      });

      const res = await sendBatchQuickInvoicesAction({
        dueDate,
        teacherAddress: teacherProfile.businessAddress,
        teacherBankDetails: teacherProfile.paymentInstructions,
        teacherStripeLink: teacherProfile.invoiceStripeLink || undefined,
        invoices: invoicesToSend,
      });

      setBatchSendStatus({
        inProgress: false,
        success: res.success,
        results: res.results,
      });
    });
  };

  // Next Native Mail client Queue helper
  const handleNextMailtoQueueItem = async () => {
    if (!mailtoQueue) return;
    const item = mailtoQueue.items[mailtoQueue.currentIndex];
    if (!item) {
      return;
    }

    const mailto = `mailto:${item.payerEmail}?subject=${encodeURIComponent(item.subject)}&body=${encodeURIComponent(item.body)}`;
    window.location.href = mailto;

    setMailtoQueue((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentIndex: prev.currentIndex + 1,
      };
    });
  };

  // Batch Native Mail Launcher Start
  const handleConfirmMailtoQueueSent = async () => {
    if (!mailtoQueue) return;
    setSendError("");

    const invoiceIds = mailtoQueue.items.map((item) => item.invoiceId);
    const res = await markQuickInvoicesSentAction(invoiceIds);
    if (!res.success) {
      setSendError(res.error || "Could not mark invoices as sent");
      return;
    }

    setMailtoQueue(null);
    setSendSuccess(true);
    router.refresh();
  };

  const handleMailtoQueueNotSent = () => {
    setMailtoQueue(null);
    setSendError("No invoices were marked as sent. Open the email queue again when you are ready to send.");
  };

  const handleStartMailtoQueue = async () => {
    setSendError("");
    const items = (
      await Promise.all(
        selectedStudentIds.map(async (id) => {
          const match = students.find((s) => s.id === id);
          if (!match?.payerEmail) return null;
          const count = batchLessonsConfig[id] || 4;
          const rate = batchCostConfig[id] || 30;
          const invoiceLink = await recordSentInvoice(match, count, rate);
          if (!invoiceLink) return null;

          const values = getInvoiceTemplateValues(match, count, rate);
          const itemSubject = renderInvoiceEmailTemplate(
            emailSubject || DEFAULT_INVOICE_EMAIL_SUBJECT_TEMPLATE,
            values
          );
          const itemBody = appendHostedInvoiceLink(
            renderInvoiceEmailTemplate(emailBody || DEFAULT_INVOICE_EMAIL_BODY_TEMPLATE, values),
            invoiceLink.invoiceUrl
          );

          return {
            studentId: match.id,
            studentName: match.name,
            payerEmail: match.payerEmail,
            subject: itemSubject,
            body: itemBody,
            pdfUrl: getPdfUrlForStudent(id, count, rate),
            invoiceId: invoiceLink.invoiceId,
            invoiceUrl: invoiceLink.invoiceUrl,
            lessonsCount: count,
            costPerLesson: rate,
          };
        })
      )
    ).filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (items.length === 0) return;

    setMailtoQueue({ items, currentIndex: 0 });
  };
  // Native Mail Client Launcher
  const handleOpenNativeMail = async () => {
    if (!selectedStudent || !selectedStudent.payerEmail) return;
    setSendError("");
    const invoiceLink = await recordSentInvoice(selectedStudent, attendedCount, costPerLesson);
    if (!invoiceLink) return;

    const body = appendHostedInvoiceLink(emailBody, invoiceLink.invoiceUrl);
    const mailto = `mailto:${selectedStudent.payerEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;

    setMailtoQueue({
      items: [{
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        payerEmail: selectedStudent.payerEmail,
        subject: emailSubject,
        body,
        pdfUrl: getPdfUrl(),
        invoiceId: invoiceLink.invoiceId,
        invoiceUrl: invoiceLink.invoiceUrl,
        lessonsCount: attendedCount,
        costPerLesson,
      }],
      currentIndex: 1,
    });
  };
  // Share Sheet trigger (Web Share API)
  const handleShareInvoice = async () => {
    if (!selectedStudent) return;
    try {
      const response = await fetch(getPdfUrl());
      const blob = await response.blob();
      const file = new File([blob], `invoice-${selectedStudent.name.replace(/\s+/g, "_")}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice for ${selectedStudent.name}`,
          text: `Invoice details for ${selectedStudent.payerName}`,
        });
      } else {
        // Fallback to downloading
        window.open(getPdfUrl(), "_blank");
      }
    } catch {
      // Fallback
      window.open(getPdfUrl(), "_blank");
    }
  };

  const getPdfUrlForStudent = (studentId: string, lCount: number, cPerLesson: number) => {
    const params = new URLSearchParams({
      studentId,
      lessonsCount: String(lCount),
      costPerLesson: String(cPerLesson),
      billingUnit: globalUnit,
      dueDate,
      teacherAddress: teacherProfile.businessAddress || "",
      teacherBankDetails: teacherProfile.paymentInstructions || "",
      teacherStripeLink: teacherProfile.invoiceStripeLink || "",
    });
    return `/api/quick-invoice/pdf?${params.toString()}`;
  };

  const getPdfUrl = () => {
    if (!selectedStudent) return "";
    return getPdfUrlForStudent(selectedStudent.id, Math.max(1, attendedCount), costPerLesson);
  };
  const generateLessonDates = (
    start: string,
    end: string,
    frequency: string
  ): { date: string; attended: boolean }[] => {
    const dates: { date: string; attended: boolean }[] = [];
    const startDate = new Date(`${start}T12:00:00`);
    const endDate = new Date(`${end}T12:00:00`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
      return dates;
    }

    if (frequency === "monthly") {
      return [{ date: toDateInputValue(startDate), attended: false }];
    }

    const intervalDays = 7;
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push({ date: toDateInputValue(current), attended: false });
      current.setDate(current.getDate() + intervalDays);
    }
    return dates;
  };

  useEffect(() => {
    if (selectedStudent && periodStart && periodEnd) {
      const generated = generateLessonDates(periodStart, periodEnd, selectedStudent.billingFrequency);
      setLessonDates(generated);
      setLessonsCount(Math.max(1, generated.length));
    }
  }, [periodStart, periodEnd, selectedStudent]);

  useEffect(() => {
    if (selectedStudentId) {
      setLoadingHistory(true);
      getStudentInvoicesAction(selectedStudentId).then((res) => {
        setLoadingHistory(false);
        if (res.success && res.invoices) setInvoiceHistory(res.invoices);
        else setInvoiceHistory([]);
      });
    } else {
      setInvoiceHistory([]);
      setShowHistory(false);
    }
  }, [selectedStudentId]);

  const refreshInvoiceHistory = async (studentId: string) => {
    const hist = await getStudentInvoicesAction(studentId);
    if (hist.success && hist.invoices) setInvoiceHistory(hist.invoices);
  };

  const getSavedInvoiceUrl = (inv: InvoiceHistoryItem) => {
    if (!inv.accessCode) return null;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/invoice/${inv.id}?code=${encodeURIComponent(inv.accessCode)}`;
  };

  const getSavedInvoicePdfUrl = (inv: InvoiceHistoryItem) => {
    if (!inv.accessCode) return null;
    return `/api/quick-invoice/${inv.id}/pdf?code=${encodeURIComponent(inv.accessCode)}`;
  };

  const handleCopySavedInvoiceLink = async (inv: InvoiceHistoryItem) => {
    const url = getSavedInvoiceUrl(inv);
    if (!url) {
      setSendError("This invoice does not have a hosted access link yet.");
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopiedInvoiceId(inv.id);
    window.setTimeout(() => setCopiedInvoiceId(null), 1800);
  };

  const handleResendSavedInvoice = (inv: InvoiceHistoryItem) => {
    if (!selectedStudent?.payerEmail) {
      setSendError("No payer email is available for this invoice.");
      return;
    }
    const url = getSavedInvoiceUrl(inv);
    const pdfUrl = getSavedInvoicePdfUrl(inv);
    if (!url || !pdfUrl) {
      setSendError("This invoice does not have a hosted access link yet.");
      return;
    }

    const subject = renderSubjectForStudent(selectedStudent, inv.lessonsCount, inv.costPerLesson);
    const body = appendHostedInvoiceLink(renderBodyForStudent(selectedStudent, inv.lessonsCount, inv.costPerLesson), url);
    window.location.href = `mailto:${selectedStudent.payerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMailtoQueue({
      items: [{
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        payerEmail: selectedStudent.payerEmail,
        subject,
        body,
        pdfUrl,
        invoiceId: inv.id,
        invoiceUrl: url,
        lessonsCount: inv.lessonsCount,
        costPerLesson: inv.costPerLesson,
      }],
      currentIndex: 1,
    });
  };
  const handleSaveInvoice = () => {
    if (!selectedStudent || lessonDates.length === 0) return;
    setSaveInvoiceSuccess(false);
    setSaveInvoiceError("");
    const payload: CreateQuickInvoiceInput = {
      studentId: selectedStudent.id,
      invoiceRef,
      billingMode,
      periodStart,
      periodEnd,
      costPerLesson,
      dueDate,
      lessonDates,
    };

    startTransition(async () => {
      const res = await createQuickInvoiceAction(payload);
      if (res.success) {
        setSaveInvoiceSuccess(true);
        await refreshInvoiceHistory(selectedStudent.id);
        router.refresh();
      } else {
        setSaveInvoiceError(res.error || "Failed to save invoice");
      }
    });
  };

  const handleToggleLessonDate = (index: number) => {
    setLessonDates((prev) =>
      prev.map((d, i) => (i === index ? { ...d, attended: !d.attended } : d))
    );
  };

  const handleRemoveLessonDate = (index: number) => {
    setLessonDates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLessonDate = (dateStr: string) => {
    if (!dateStr || lessonDates.some((d) => d.date === dateStr)) return;
    setLessonDates((prev) =>
      [...prev, { date: dateStr, attended: false }].sort((a, b) => a.date.localeCompare(b.date))
    );
  };

  const handleMarkPaid = async () => {
    if (!payingInvoiceId || !payAmount) return;
    setMarkPaidPending(true);
    const res = await markInvoicePaidAction({
      invoiceId: payingInvoiceId,
      paidAmount: parseFloat(payAmount),
    });
    setMarkPaidPending(false);
    if (res.success) {
      setPayingInvoiceId(null);
      setPayAmount("");
      if (selectedStudentId) await refreshInvoiceHistory(selectedStudentId);
      router.refresh();
    }
  };

  const handleSavedAttendanceToggle = async (
    invoiceId: string,
    lessonDateId: string,
    attended: boolean
  ) => {
    const res = await updateLessonAttendanceAction({ invoiceId, lessonDateId, attended });
    if (res.success && selectedStudentId) {
      await refreshInvoiceHistory(selectedStudentId);
      router.refresh();
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Unpaid Invoice Reminder Banner */}
      {invoiceReminder.count > 0 && (
        <div className={`flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between ${
          invoiceReminder.overdueCount > 0
            ? "border-rose-200 bg-rose-50 text-rose-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}>
          <div className="flex items-start gap-2.5">
            <AlertCircle className={`mt-0.5 h-5 w-5 shrink-0 ${invoiceReminder.overdueCount > 0 ? "text-rose-500" : "text-amber-500"}`} />
            <div>
              <p className="text-xs font-black uppercase tracking-wide">
                {invoiceReminder.overdueCount > 0
                  ? `${invoiceReminder.overdueCount} Overdue Invoice${invoiceReminder.overdueCount !== 1 ? "s" : ""}`
                  : `${invoiceReminder.count} Unpaid Invoice${invoiceReminder.count !== 1 ? "s" : ""}`}
              </p>
              <p className="mt-1 text-xs font-semibold">
                {invoiceReminder.studentNames.slice(0, 4).join(", ")}
                {invoiceReminder.studentNames.length > 4 ? ` and ${invoiceReminder.studentNames.length - 4} more` : ""}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wide">
            {invoiceReminder.count} awaiting payment
          </span>
        </div>
      )}
      
      {/* Upper Navigation & Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-600 animate-pulse" />
            Quick Invoicing Workspace
          </h1>
          <p className="text-xs text-neutral-500 font-semibold mt-1">
            Mobile-optimized pipeline to create students, review scheduling tallies, compile PDF invoices, and send them instantly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <Settings className="h-4 w-4" />
            {showSettings ? "Hide Settings" : "Configure Payments"}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-4 py-2 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Quick Add Student
          </button>
        </div>
      </div>

      {/* Collapsible Payment Config Settings Panel */}
      {showSettings && (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-4 max-w-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">
            Your Business & Bank Details (PDF Layout defaults)
          </h2>
          <p className="text-xs text-neutral-500">
            These will display at the top and bottom of generated invoices. Custom details are persisted to the database.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-600 mb-1">Business or Teacher Name</label>
              <input
                type="text"
                value={teacherProfile.businessName}
                onChange={(e) => setTeacherProfile({ ...teacherProfile, businessName: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 p-2.5 text-sm outline-none focus:border-brand-500"
                placeholder={teacher.name}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-600 mb-1">Physical / Business Address</label>
              <textarea
                rows={2}
                value={teacherProfile.businessAddress}
                onChange={(e) => setTeacherProfile({ ...teacherProfile, businessAddress: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 p-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="123 Music Lane, London, SW1A 1AA"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-600 mb-1">Bank Payment Instructions (Sort & Acc)</label>
              <textarea
                rows={2}
                value={teacherProfile.paymentInstructions}
                onChange={(e) => setTeacherProfile({ ...teacherProfile, paymentInstructions: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 p-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="Bank: Barclays Bank&#10;Sort Code: 20-00-00 | Account: 12345678"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-600 mb-1">Stripe Online Payment Link (Optional)</label>
              <input
                type="url"
                value={teacherProfile.invoiceStripeLink}
                onChange={(e) => setTeacherProfile({ ...teacherProfile, invoiceStripeLink: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 p-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="https://buy.stripe.com/abc..."
              />
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">Standard Invoice Email Subject</label>
                <input
                  type="text"
                  value={teacherProfile.invoiceEmailSubjectTemplate}
                  onChange={(e) => setTeacherProfile({ ...teacherProfile, invoiceEmailSubjectTemplate: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder={DEFAULT_INVOICE_EMAIL_SUBJECT_TEMPLATE}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">Standard Invoice Email Message</label>
                <textarea
                  rows={8}
                  value={teacherProfile.invoiceEmailBodyTemplate}
                  onChange={(e) => setTeacherProfile({ ...teacherProfile, invoiceEmailBodyTemplate: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-sm leading-relaxed outline-none focus:border-brand-500"
                  placeholder={DEFAULT_INVOICE_EMAIL_BODY_TEMPLATE}
                />
              </div>
              <p className="text-[10px] font-semibold leading-relaxed text-neutral-500">
                Placeholders: {"{payerName}"}, {"{studentName}"}, {"{lessonsCount}"}, {"{billingUnit}"}, {"{totalDue}"}, {"{dueDate}"}, {"{invoiceRef}"}, {"{teacherName}"}, {"{paymentLinkLine}"}.
              </p>
            </div>
          </div>
          {settingsSuccess && (
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Settings saved successfully!
            </p>
          )}
          {settingsError && <p className="text-xs text-rose-600 font-semibold">Failed to save settings. Try again.</p>}
          <button
            onClick={handleSaveSettings}
            disabled={isPending}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-bold text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}

      {/* Quick Invoice Sheet */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm">
        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-neutral-900">Quick Invoice Sheet</h2>
            <p className="mt-1 text-xs font-semibold text-neutral-500">Pick one venue, set that venue rate, adjust rows, then create PDFs or emails.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-1 text-[10px] font-black uppercase tracking-wide">
            <button
              type="button"
              onClick={() => applyPeriodShortcut("this")}
              className={`rounded-lg px-3 py-2 transition-colors ${invoicePeriodMode === "this" ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500 hover:bg-white hover:text-neutral-800"}`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => applyPeriodShortcut("last")}
              className={`rounded-lg px-3 py-2 transition-colors ${invoicePeriodMode === "last" ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500 hover:bg-white hover:text-neutral-800"}`}
            >
              Last Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-[1.35fr_.42fr_.48fr_.5fr_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-neutral-400">Venue</label>
            <select
              value={selectedVenueFilter}
              onChange={(e) => handleVenueMachineChange(e.target.value)}
              className="min-h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-bold text-neutral-800 outline-none focus:border-brand-500"
            >
              {venueOptions.map((venue) => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-neutral-400">Qty</label>
            <input
              type="number"
              min="1"
              value={globalQuantity}
              onChange={(e) => setGlobalQuantity(Math.max(1, Number(e.target.value)))}
              className="min-h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-black text-neutral-800 outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-neutral-400">Unit</label>
            <select
              value={globalUnit}
              onChange={(e) => setGlobalUnit(e.target.value as "lessons" | "hours")}
              className="min-h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-bold text-neutral-800 outline-none focus:border-brand-500"
            >
              <option value="lessons">Lessons</option>
              <option value="hours">Hours</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-neutral-400">Venue Rate</label>
            <input
              type="number"
              min="1"
              value={selectedVenueRate}
              onChange={(e) => updateSelectedVenueRate(Number(e.target.value))}
              className="min-h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-black text-neutral-800 outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="button"
            onClick={applyGlobalInvoiceSettings}
            disabled={selectedStudentIds.length === 0}
            className="min-h-10 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-black text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            Apply to Rows
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
            {invoiceMachineStudents.length} visible - {selectedStudentIds.length} selected - {formatCurrency(selectedBatchTotal)} total
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedStudentIds(invoiceMachineStudents.map((student) => student.id))}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-bold text-neutral-700 hover:bg-neutral-50"
            >
              Select Visible
            </button>
            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleStartMailtoQueue}
              disabled={selectedStudentIds.length === 0}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-[10px] font-black text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-neutral-200"
            >
              Batch Default Email App
            </button>
          </div>
        </div>
        {/* Fast venue invoice rows */}
        <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200">
          <div className="grid grid-cols-[28px_minmax(150px,1.4fr)_88px_68px_68px_78px_116px] items-center bg-neutral-50 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-neutral-400">
            <span></span>
            <span>Name</span>
            <span className="text-center">Period</span>
            <span className="text-center">{globalUnit === "hours" ? "Hours" : "Lessons"}</span>
            <span className="text-center">Rate</span>
            <span className="text-right">Total</span>
            <span className="text-center">Create</span>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            {invoiceMachineStudents.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs font-semibold text-neutral-400">No students match this venue/search.</p>
            ) : (
              invoiceMachineStudents.map((student) => {
                const checked = selectedStudentIds.includes(student.id);
                const quantity = batchLessonsConfig[student.id] || globalQuantity;
                const rate = batchCostConfig[student.id] || venueRates[getStudentVenueId(student)] || selectedVenueRate;
                return (
                  <div key={student.id} className={`grid grid-cols-[28px_minmax(150px,1.4fr)_88px_68px_68px_78px_116px] items-center border-t border-neutral-100 px-3 py-1.5 text-xs ${checked ? "bg-white" : "bg-neutral-50/45"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleToggleStudentSelection(student.id, e)}
                      className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-neutral-900">{student.name}</p>
                      <p className="truncate text-[10px] font-bold uppercase tracking-wide text-neutral-400">{student.payerName} - {student.payerEmail || "No email"}</p>
                    </div>
                    <div className="mx-auto flex rounded-lg border border-neutral-200 bg-white p-0.5 text-[9px] font-black uppercase">
                      <button type="button" onClick={() => applyPeriodShortcut("this")} className={`rounded-md px-2 py-1 ${invoicePeriodMode === "this" ? "bg-brand-600 text-white" : "text-neutral-500"}`}>This</button>
                      <button type="button" onClick={() => applyPeriodShortcut("last")} className={`rounded-md px-2 py-1 ${invoicePeriodMode === "last" ? "bg-brand-600 text-white" : "text-neutral-500"}`}>Last</button>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setBatchLessonsConfig({ ...batchLessonsConfig, [student.id]: Math.max(1, Number(e.target.value)) })}
                      className="mx-auto h-8 w-14 rounded-lg border border-neutral-200 bg-white px-2 text-center text-sm font-black outline-none focus:border-brand-500"
                    />
                    <input
                      type="number"
                      min="1"
                      value={rate}
                      onChange={(e) => setBatchCostConfig({ ...batchCostConfig, [student.id]: Math.max(1, Number(e.target.value)) })}
                      className="mx-auto h-8 w-14 rounded-lg border border-neutral-200 bg-white px-2 text-center text-sm font-black outline-none focus:border-brand-500"
                    />
                    <p className="text-right text-sm font-black text-neutral-900">{formatCurrency(quantity * rate)}</p>
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => openPdfAndRecordInvoice(student, quantity, rate)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] font-bold text-neutral-700 shadow-sm hover:bg-neutral-50">
                        <FileDown className="h-3.5 w-3.5" /> PDF
                      </button>
                      <button type="button" onClick={() => openDefaultEmailForStudent(student, quantity, rate)} disabled={!student.payerEmail} className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand-600 px-2 text-[10px] font-bold text-white shadow-sm hover:bg-brand-700 disabled:bg-neutral-200 disabled:text-neutral-500">
                        <Mail className="h-3.5 w-3.5" /> Email
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {mailtoQueue && mailtoQueue.currentIndex < mailtoQueue.items.length && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-[10px] font-bold text-amber-800">Email queue {mailtoQueue.currentIndex + 1} of {mailtoQueue.items.length}: {mailtoQueue.items[mailtoQueue.currentIndex].studentName}</p>
            <button type="button" onClick={handleNextMailtoQueueItem} className="rounded-lg bg-amber-600 px-3 py-2 text-[10px] font-black text-white hover:bg-amber-700">Open Next Email</button>
          </div>
        )}
        {mailtoQueue && mailtoQueue.currentIndex >= mailtoQueue.items.length && (
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-teal-200 bg-teal-50 px-3 py-3 md:flex-row md:items-center md:justify-between">
            <p className="text-[10px] font-bold text-teal-800">Opened {mailtoQueue.items.length} prepared email{mailtoQueue.items.length !== 1 ? "s" : ""}. Confirm they were sent to start 7-day payment reminders.</p>
            <div className="flex gap-2">
              <button type="button" onClick={handleMailtoQueueNotSent} className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-[10px] font-black text-teal-700 hover:bg-teal-50">Not Sent Yet</button>
              <button type="button" onClick={handleConfirmMailtoQueueSent} className="rounded-lg bg-teal-600 px-3 py-2 text-[10px] font-black text-white hover:bg-teal-700">Confirm Sent</button>
            </div>
          </div>
        )}
      </div>
      {/* 2-Column Responsive Board */}
      <div className="hidden">
        
        {/* Left List Pane (1/3 width) */}
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm space-y-4">
            
            {/* Search and Filters */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-neutral-50 border-none pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
              />
            </div>

            <div className="flex border-b border-neutral-100 pb-2">
              <button
                onClick={() => setGroupBy("upcoming")}
                className={`flex-1 text-center py-1 text-[11px] font-bold border-b-2 transition-all ${
                  groupBy === "upcoming" ? "border-brand-600 text-neutral-900" : "border-transparent text-neutral-400"
                }`}
              >
                Calendar Tally
              </button>
              <button
                onClick={() => setGroupBy("venue")}
                className={`flex-1 text-center py-1 text-[11px] font-bold border-b-2 transition-all ${
                  groupBy === "venue" ? "border-brand-600 text-neutral-900" : "border-transparent text-neutral-400"
                }`}
              >
                By Venue
              </button>
            </div>

            {/* Student List */}
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                {selectedStudentIds.length > 0 ? `${selectedStudentIds.length} Selected` : "Roster"}
              </span>
              {selectedStudentIds.length > 0 ? (
                <button
                  onClick={() => setSelectedStudentIds([])}
                  className="text-[10px] font-bold text-rose-500 hover:underline"
                >
                  Deselect All
                </button>
              ) : (
                <button
                  onClick={() => setSelectedStudentIds(filteredStudents.map(s => s.id))}
                  className="text-[10px] font-bold text-brand-600 hover:underline"
                >
                  Select All
                </button>
              )}
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-1">
              {groupBy === "upcoming" ? (
                sortedByUpcoming.length === 0 ? (
                  <p className="text-center text-xs text-neutral-400 py-6">No students found.</p>
                ) : (
                  <div className="space-y-2">
                    {sortedByUpcoming.map((student) => (
                      <div key={student.id} className="flex items-center gap-2 w-full">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={(e) => handleToggleStudentSelection(student.id, e)}
                          className="h-4.5 w-4.5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                        />
                        <button
                          onClick={() => handleSelectSingleStudent(student.id)}
                          className={`flex-1 text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            selectedStudentId === student.id
                              ? "bg-brand-50/55 border-brand-300 ring-1 ring-brand-300"
                              : "bg-white border-neutral-100 hover:border-neutral-200"
                          }`}
                        >
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-neutral-900 truncate">{student.name}</h4>
                            <p className="text-[10px] text-neutral-500 font-semibold mt-0.5 uppercase tracking-wide">
                              {student.discipline} - {student.locationName || "Home"}
                            </p>
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1 ${
                            student.upcomingLessonsCount > 0
                              ? "bg-teal-50 text-teal-700 border border-teal-100"
                              : "bg-neutral-50 text-neutral-400 border border-neutral-100"
                          }`}>
                            <Calendar className="h-3 w-3 shrink-0" />
                            {student.upcomingLessonsCount}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                Object.entries(groupedByVenue).length === 0 ? (
                  <p className="text-center text-xs text-neutral-400 py-6">No venues mapped.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedByVenue).map(([venueName, groupStudents]) => (
                      <div key={venueName} className="space-y-1.5">
                        <h4 className="text-[9px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                          {venueName} ({groupStudents.length})
                        </h4>
                        <div className="space-y-1.5 pl-2 border-l border-neutral-100">
                          {groupStudents.map((student) => (
                            <div key={student.id} className="flex items-center gap-2 w-full">
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={(e) => handleToggleStudentSelection(student.id, e)}
                                className="h-4.5 w-4.5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                              />
                              <button
                                onClick={() => handleSelectSingleStudent(student.id)}
                                className={`flex-1 text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                                  selectedStudentId === student.id
                                    ? "bg-brand-50/55 border-brand-300 ring-1 ring-brand-300"
                                    : "bg-white border-neutral-100 hover:border-neutral-200"
                                }`}
                              >
                                <div className="min-w-0">
                                  <h5 className="font-bold text-xs text-neutral-900 truncate">{student.name}</h5>
                                  <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                                    {student.discipline} - {student.billingFrequency}
                                  </p>
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

          </div>
        </div>

        {/* Right Workspace Panel (2/3 width) */}
        <div className="lg:col-span-2">
          {!selectedStudent && selectedStudentIds.length === 0 ? (
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-12 text-center shadow-sm h-full flex flex-col justify-center items-center space-y-4">
              <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 border border-neutral-100 shadow-inner">
                <Mail className="h-8 w-8" />
              </div>
              <div className="max-w-xs space-y-1">
                <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">No Student Selected</h3>
                <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                  Choose a student from the left panel to prepare their invoice, or select multiple checkboxes to batch bill.
                </p>
              </div>
            </div>
          ) : selectedStudentIds.length > 0 ? (
            /* Batch Invoicing Workspace Dashboard */
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-600 shrink-0" />
                  Batch Invoice Generation ({selectedStudentIds.length} Selected)
                </h2>
                <p className="text-xs text-neutral-500 font-bold mt-1">
                  Adjust lessons and rates for each student below, then send or queue them.
                </p>
              </div>

              {/* Bulk Apply Row */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/60 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-neutral-700">Bulk Apply Parameters</h4>
                  <p className="text-[10px] text-neutral-400 font-bold mt-0.5">Quickly set identical rates or lesson counts for all checked records.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="bulkLessons"
                    placeholder="Lessons"
                    className="w-20 rounded-lg border border-neutral-200 p-1.5 text-xs font-bold text-center bg-white outline-none focus:border-brand-500"
                  />
                  <input
                    type="number"
                    id="bulkCost"
                    placeholder="Rate"
                    className="w-20 rounded-lg border border-neutral-200 p-1.5 text-xs font-bold text-center bg-white outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={() => {
                      const lEl = document.getElementById("bulkLessons") as HTMLInputElement;
                      const cEl = document.getElementById("bulkCost") as HTMLInputElement;
                      const lessons = lEl ? Number(lEl.value) : 0;
                      const cost = cEl ? Number(cEl.value) : 0;
                      const newLessons = { ...batchLessonsConfig };
                      const newCosts = { ...batchCostConfig };
                      selectedStudentIds.forEach(id => {
                        if (lessons > 0) newLessons[id] = lessons;
                        if (cost > 0) newCosts[id] = cost;
                      });
                      if (lessons > 0) setBatchLessonsConfig(newLessons);
                      if (cost > 0) setBatchCostConfig(newCosts);
                    }}
                    className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-bold px-3 py-2 shadow-sm transition-all cursor-pointer"
                  >
                    Apply to All
                  </button>
                </div>
              </div>

              {/* Selection Summary Table */}
              <div className="overflow-x-auto border border-neutral-200/60 rounded-xl">
                <table className="min-w-full divide-y divide-neutral-100 text-left">
                  <thead className="bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Student / Payer</th>
                      <th className="px-4 py-3 text-center">{globalUnit === "hours" ? "Hours" : "Lessons"}</th>
                      <th className="px-4 py-3 text-center">Rate</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs font-bold text-neutral-700">
                    {selectedStudentIds.map((id) => {
                      const student = students.find((s) => s.id === id);
                      if (!student) return null;
                      const lCount = batchLessonsConfig[id] || globalQuantity;
                      const cRate = batchCostConfig[id] || costPerLesson;

                      return (
                        <tr key={id} className="hover:bg-neutral-50/50">
                          <td className="px-4 py-3">
                            <p className="text-xs font-black text-neutral-900">{student.name}</p>
                            <p className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5">
                              {student.payerName} - {student.payerEmail || "No Email"}
                            </p>
                            {!student.payerEmail && (
                              <span className="text-[8px] bg-rose-50 text-rose-600 font-bold border border-rose-100 px-1 py-0.5 rounded mt-1 inline-block">
                                Payer email missing (cannot send)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={lCount}
                              onChange={(e) =>
                                setBatchLessonsConfig({
                                  ...batchLessonsConfig,
                                  [id]: Math.max(1, Number(e.target.value)),
                                })
                              }
                              className="w-14 rounded-md border border-neutral-200 p-1 text-center outline-none focus:border-brand-500 font-bold text-neutral-800"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={cRate}
                              onChange={(e) =>
                                setBatchCostConfig({
                                  ...batchCostConfig,
                                  [id]: Math.max(1, Number(e.target.value)),
                                })
                              }
                              className="w-16 rounded-md border border-neutral-200 p-1 text-center outline-none focus:border-brand-500 font-bold text-neutral-800"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-black text-neutral-900">
                            {formatCurrency(lCount * cRate)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <a
                                href={getPdfUrlForStudent(id, lCount, cRate)}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[10px] font-bold text-neutral-600 shadow-sm transition-colors hover:bg-neutral-50"
                                title="Open invoice PDF"
                              >
                                <FileDown className="h-3.5 w-3.5" />
                                PDF
                              </a>
                              <button
                                type="button"
                                onClick={() => openDefaultEmailForStudent(student, lCount, cRate)}
                                disabled={!student.payerEmail}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
                                title="Open PDF and prepared email"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                Email
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bulk Variables Tip Alert */}
              <div className="bg-brand-50/40 p-4 rounded-xl border border-brand-100 flex items-start gap-2.5">
                <Sparkles className="h-4.5 w-4.5 text-brand-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-[10px] text-brand-800 font-bold space-y-1">
                  <p className="uppercase tracking-wider">Dynamic Template Tag Replacements Enabled</p>
                  <p className="leading-relaxed font-semibold text-neutral-600">
                    Use tags to automatically customize batch emails:
                    <br />
                    <code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded font-black mr-2">{"{studentName}"}</code>
                    <code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded font-black mr-2">{"{payerName}"}</code>
                    <code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded font-black mr-2">{"{lessonsCount}"}</code>
                    <code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded font-black mr-2">{"{totalDue}"}</code>
                    <code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded font-black mr-2">{"{dueDate}"}</code>
                    <code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded font-black">{"{stripeLink}"}</code>
                  </p>
                </div>
              </div>

              {/* Email Template Controls */}
              <div className="space-y-4 border border-neutral-100 p-5 rounded-2xl">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Batch Email Templates</h3>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">Subject Template</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 p-2 text-xs outline-none focus:border-brand-500 font-bold text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">Message Body Template</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 p-2 text-xs outline-none focus:border-brand-500 text-neutral-700 leading-relaxed font-semibold font-sans"
                  />
                </div>
              </div>

              {/* Batch Send Controls */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Batch Operations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Gmail Send */}
                  <button
                    onClick={handleBatchSendGmail}
                    disabled={!teacher.gmailConnected || batchSendStatus.inProgress}
                    className={`flex items-center justify-center gap-1.5 rounded-xl p-3 text-xs font-bold shadow-sm transition-colors text-white ${
                      teacher.gmailConnected && selectedStudentIds.length > 0
                        ? "bg-neutral-900 hover:bg-neutral-800 cursor-pointer"
                        : "bg-neutral-200 cursor-not-allowed opacity-50 text-neutral-500"
                    }`}
                  >
                    <Send className="h-4 w-4" />
                    {batchSendStatus.inProgress ? "Sending batch..." : "Optional Gmail Batch"}
                  </button>

                  {/* mailto Launch */}
                  <button
                    onClick={handleStartMailtoQueue}
                    disabled={selectedStudentIds.length === 0}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white p-3 text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Mail className="h-4 w-4" />
                    Send via Default Email App
                  </button>

                  {/* Download all */}
                  <button
                    onClick={() => {
                      selectedStudentIds.forEach((id) => {
                        const count = batchLessonsConfig[id] || 4;
                        const rate = batchCostConfig[id] || 30;
                        window.open(getPdfUrlForStudent(id, count, rate), "_blank");
                      });
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 p-3 text-xs font-bold text-neutral-700 shadow-sm transition-colors cursor-pointer"
                  >
                    <FileDown className="h-4 w-4" />
                    Open All PDFs
                  </button>
                </div>

                {/* Mailto Queue Panel */}
                {mailtoQueue && mailtoQueue.currentIndex < mailtoQueue.items.length && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-200">
                    <div>
                      <p className="text-xs font-black text-amber-900">
                        Mail Link Queue: Student {mailtoQueue.currentIndex + 1} of {mailtoQueue.items.length}
                      </p>
                      <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                        Now preparing: {mailtoQueue.items[mailtoQueue.currentIndex].studentName} ({mailtoQueue.items[mailtoQueue.currentIndex].payerEmail})
                      </p>
                    </div>
                    <button
                      onClick={handleNextMailtoQueueItem}
                      className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3.5 py-2 transition-all shadow cursor-pointer animate-bounce"
                    >
                      Open Email Client &amp; PDF
                    </button>
                  </div>
                )}

                {/* Status Messages */}
                {batchSendStatus.results && (
                  <div className="space-y-2 border border-neutral-100 p-4 rounded-xl bg-neutral-50/50">
                    <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Batch Delivery Results</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {batchSendStatus.results.map((res, index) => (
                        <div key={index} className="flex items-center justify-between text-[10px] py-1 border-b border-neutral-100">
                          <span className="font-bold">{res.studentName}</span>
                          {res.success ? (
                            <span className="text-green-600 font-black flex items-center gap-0.5">
                              <Check className="h-3 w-3" /> Sent
                            </span>
                          ) : (
                            <span className="text-rose-600 font-black flex items-center gap-0.5" title={res.error}>
                              <AlertCircle className="h-3 w-3" /> Failed: {res.error}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Single Invoicing Workspace */
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              {!selectedStudent ? null : (<>
              
              {/* Selected Student Meta Info Header */}
              <div className="border-b border-neutral-100 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-neutral-900">{selectedStudent.name}</h2>
                    <p className="text-xs text-neutral-500 font-bold mt-1 uppercase tracking-wide flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                      {selectedStudent.locationName || "Home Lessons"} - Frequency: {selectedStudent.billingFrequency}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Parent Payer</p>
                    <p className="text-xs font-bold text-neutral-800">{selectedStudent.payerName}</p>
                    <p className="text-[10px] text-neutral-500 font-semibold">{selectedStudent.payerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Invoicing Parameter Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50/50 border border-neutral-100 p-5 rounded-2xl">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Invoice Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">No. of Lessons</label>
                      <input
                        type="number"
                        min="1"
                        value={lessonsCount}
                        onChange={(e) => setLessonsCount(Math.max(1, Number(e.target.value)))}
                        className="w-full rounded-lg border border-neutral-200 p-2 text-xs outline-none focus:border-brand-500 font-bold text-neutral-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">Cost Per Lesson</label>
                      <input
                        type="number"
                        min="1"
                        value={costPerLesson}
                        onChange={(e) => setCostPerLesson(Math.max(1, Number(e.target.value)))}
                        className="w-full rounded-lg border border-neutral-200 p-2 text-xs outline-none focus:border-brand-500 font-bold text-neutral-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">Payment Due Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 p-2 text-xs outline-none focus:border-brand-500 font-bold text-neutral-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">Invoice Reference</label>
                      <input
                        type="text"
                        value={invoiceRef}
                        onChange={(e) => setInvoiceRef(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 p-2 text-xs outline-none focus:border-brand-500 font-bold text-neutral-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Live Invoice Preview</h3>
                  
                  <div className="bg-white p-4 rounded-xl border border-neutral-100 space-y-3 text-xs text-neutral-600 shadow-inner max-h-36 overflow-y-auto">
                    <div className="border-b border-neutral-100 pb-1 flex justify-between font-black text-neutral-800 uppercase tracking-wider text-[9px]">
                      <span>Line Item Description</span>
                      <span>Amount</span>
                    </div>
                    <div className="space-y-1 font-semibold">
                      <div className="flex justify-between py-1.5 border-b border-neutral-100">
                        <span>{attendedCount} lessons of {selectedStudent.discipline}</span>
                        <span>{formatCurrency(computedTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-neutral-200/60 shadow-sm mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Total Invoice Amount</p>
                      <p className="text-2xl font-black text-brand-600">{formatCurrency(computedTotal)}</p>
                    </div>
                    {selectedStudent.payerEmail ? (
                      <span className="text-[9px] bg-green-50 text-green-700 font-bold px-2 py-1 rounded-md border border-green-100 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Ready to email
                      </span>
                    ) : (
                      <span className="text-[9px] bg-rose-50 text-rose-700 font-bold px-2 py-1 rounded-md border border-rose-100 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> No email address
                      </span>
                    )}
                  </div>
                </div>
              </div>


              {/* Lesson Calendar & Attendance */}
              <div className="space-y-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">Lesson Calendar &amp; Attendance</h3>
                  <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 text-[10px] font-black uppercase tracking-wide">
                    <button
                      type="button"
                      onClick={() => setBillingMode("upfront")}
                      className={`rounded-lg px-3 py-2 transition-colors ${billingMode === "upfront" ? "bg-brand-600 text-white" : "text-neutral-500 hover:bg-neutral-50"}`}
                    >
                      Upfront
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingMode("arrears")}
                      className={`rounded-lg px-3 py-2 transition-colors ${billingMode === "arrears" ? "bg-brand-600 text-white" : "text-neutral-500 hover:bg-neutral-50"}`}
                    >
                      In Arrears
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-600">Period From</label>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="min-h-12 w-full min-w-0 rounded-lg border border-neutral-200 px-4 py-2 text-base font-bold text-neutral-800 outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-600">Period To</label>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="min-h-12 w-full min-w-0 rounded-lg border border-neutral-200 px-4 py-2 text-base font-bold text-neutral-800 outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-white p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                      {billingMode === "arrears" ? "Attended Lessons Total" : "Invoice Total"}
                    </p>
                    <p className="text-2xl font-black text-brand-600">&pound;{computedTotal.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-neutral-400">{attendedCount} x &pound;{costPerLesson.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "This Month", months: 0 },
                    { label: "Next Month", months: 1 },
                  ].map((shortcut) => (
                    <button
                      key={shortcut.label}
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const start = new Date(now.getFullYear(), now.getMonth() + shortcut.months, 1);
                        const end = new Date(now.getFullYear(), now.getMonth() + shortcut.months + 1, 0);
                        setPeriodStart(toDateInputValue(start));
                        setPeriodEnd(toDateInputValue(end));
                      }}
                      className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600 transition-colors hover:bg-neutral-200"
                    >
                      {shortcut.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const start = new Date();
                      const end = new Date();
                      end.setDate(end.getDate() + 69);
                      setPeriodStart(toDateInputValue(start));
                      setPeriodEnd(toDateInputValue(end));
                    }}
                    className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600 transition-colors hover:bg-neutral-200"
                  >
                    This Term (10wk)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = generateLessonDates(periodStart, periodEnd, selectedStudent.billingFrequency);
                      setLessonDates(generated);
                      setLessonsCount(Math.max(1, generated.length));
                    }}
                    className="ml-auto rounded-lg bg-brand-600 px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-brand-700"
                  >
                    Regenerate Dates
                  </button>
                </div>

                {lessonDates.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                        {lessonDates.length} Lesson Date{lessonDates.length !== 1 ? "s" : ""}
                        {billingMode === "arrears" ? ` - ${attendedCount} attended` : ""}
                      </span>
                      {billingMode === "arrears" && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setLessonDates((prev) => prev.map((d) => ({ ...d, attended: true })))} className="text-[10px] font-bold text-brand-600 hover:underline">
                            Mark All Present
                          </button>
                          <button type="button" onClick={() => setLessonDates((prev) => prev.map((d) => ({ ...d, attended: false })))} className="text-[10px] font-bold text-neutral-400 hover:underline">
                            Mark All Absent
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                      {lessonDates.map((ld, idx) => (
                        <div key={ld.date} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors ${
                          billingMode === "arrears" && ld.attended
                            ? "border-green-200 bg-green-50"
                            : "border-neutral-200 bg-white"
                        }`}>
                          <span className="font-bold text-neutral-700">
                            {new Date(`${ld.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                          <div className="flex items-center gap-2">
                            {billingMode === "arrears" && (
                              <button
                                type="button"
                                onClick={() => handleToggleLessonDate(idx)}
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-black transition-colors ${ld.attended ? "border-green-200 bg-green-100 text-green-700" : "border-neutral-200 bg-neutral-100 text-neutral-400"}`}
                              >
                                {ld.attended ? "Present" : "Absent"}
                              </button>
                            )}
                            <button type="button" onClick={() => handleRemoveLessonDate(idx)} className="text-[10px] font-black text-neutral-300 transition-colors hover:text-rose-500" title="Remove this date">
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <input id="manualLessonDate" type="date" className="min-h-11 min-w-0 flex-1 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-bold outline-none focus:border-brand-500" />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("manualLessonDate") as HTMLInputElement | null;
                          if (el) {
                            handleAddLessonDate(el.value);
                            el.value = "";
                          }
                        }}
                        className="rounded-lg bg-neutral-100 px-3 py-1.5 text-[10px] font-bold text-neutral-600 transition-colors hover:bg-neutral-200"
                      >
                        Add Date
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Email Client Template Config Panel */}
              <div className="space-y-4 border border-neutral-100 p-5 rounded-2xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Email Text Setup</h3>
                    <p className="mt-1 text-[10px] font-semibold text-neutral-500">Edit this invoice message, or use your saved standard template.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={applyStandardEmailMessage}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[10px] font-bold text-neutral-700 transition-colors hover:bg-neutral-50"
                    >
                      Use Standard Message
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCurrentEmailAsStandard}
                      disabled={isPending}
                      className="rounded-lg bg-neutral-900 px-3 py-2 text-[10px] font-bold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                    >
                      Save as Standard
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">Email Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 p-2 text-xs outline-none focus:border-brand-500 font-bold text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">Email Message Body</label>
                  <textarea
                    rows={4}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 p-2 text-xs outline-none focus:border-brand-500 text-neutral-700 leading-relaxed font-semibold font-sans"
                  />
                </div>
              </div>

              {/* Dynamic Actions Center */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Send Actions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  
                  {/* Download PDF button */}
                  <a
                    href={getPdfUrl()}
                    target="_blank"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 p-3 text-xs font-bold text-neutral-700 shadow-sm transition-colors cursor-pointer"
                  >
                    <FileDown className="h-4 w-4" />
                    Open PDF
                  </a>

                  {/* Share button */}
                  <button
                    onClick={handleShareInvoice}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 p-3 text-xs font-bold text-neutral-700 shadow-sm transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    Share PDF (Default App)
                  </button>

                  {/* Gmail Integration sending button */}
                  <button
                    onClick={handleSendGmail}
                    disabled={!teacher.gmailConnected || isPending}
                    className={`flex items-center justify-center gap-1.5 rounded-xl p-3 text-xs font-bold shadow-sm transition-colors text-white ${
                      teacher.gmailConnected
                        ? "bg-neutral-900 hover:bg-neutral-800 cursor-pointer"
                        : "bg-neutral-300 cursor-not-allowed opacity-50"
                    }`}
                    title={teacher.gmailConnected ? "Optional: send PDF attachment directly via connected Gmail" : "Optional Gmail sending requires a connected Gmail account"}
                  >
                    <Send className="h-4 w-4" />
                    Optional Gmail Send
                  </button>


                  {/* Save Invoice to Database */}
                  <button
                    type="button"
                    onClick={handleSaveInvoice}
                    disabled={isPending || lessonDates.length === 0}
                    className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-teal-600 p-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Save Invoice
                  </button>
                  {/* Native mail launch button */}
                  <button
                    onClick={handleOpenNativeMail}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white p-3 text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Mail className="h-4 w-4" />
                    Send via Default Email App
                  </button>

                </div>

                {/* Integration status warnings/success alerts */}
                {!teacher.gmailConnected && (
                  <p className="text-[10px] text-neutral-500 font-bold bg-neutral-50 p-3 rounded-lg border border-neutral-100 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Gmail sending is optional. Use &ldquo;Send via Default Email App&rdquo; to open your device email client with the invoice text and PDF tab.</span>
                  </p>
                )}

                {sendSuccess && (
                  <p className="text-xs text-green-600 font-black flex items-center gap-1.5 bg-green-50 p-3 rounded-lg border border-green-200">
                    <Check className="h-4 w-4" /> Invoice email sent successfully via your connected Gmail account!
                  </p>
                )}


                {saveInvoiceSuccess && (
                  <p className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs font-black text-teal-600">
                    <Check className="h-4 w-4" /> Invoice saved. It will appear in the history panel below.
                  </p>
                )}

                {saveInvoiceError && (
                  <p className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-black text-rose-600">
                    <AlertCircle className="h-4 w-4" /> {saveInvoiceError}
                  </p>
                )}
                {sendError && (
                  <p className="text-xs text-rose-600 font-black flex items-center gap-1.5 bg-rose-50 p-3 rounded-lg border border-rose-200">
                    <AlertCircle className="h-4 w-4 text-rose-600" /> {sendError}
                  </p>
                )}
              </div>


              {/* Invoice History Panel */}
              <div className="space-y-4 rounded-2xl border border-neutral-100 p-5">
                <button type="button" onClick={() => setShowHistory((v) => !v)} className="flex w-full items-center justify-between text-left">
                  <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-neutral-400">
                    <Calendar className="h-3.5 w-3.5" />
                    Invoice History
                    {invoiceHistory.length > 0 && <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[9px] font-black text-neutral-700">{invoiceHistory.length}</span>}
                    {invoiceHistory.filter((i) => i.status === "unpaid" || i.status === "partial").length > 0 && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-black text-rose-600">
                        {invoiceHistory.filter((i) => i.status === "unpaid" || i.status === "partial").length} unpaid
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] font-bold text-neutral-400">{showHistory ? "Hide" : "Show"}</span>
                </button>

                {showHistory && (
                  <div className="space-y-3">
                    {loadingHistory && <p className="py-4 text-center text-[10px] font-bold text-neutral-400">Loading history...</p>}
                    {!loadingHistory && invoiceHistory.length === 0 && (
                      <p className="rounded-xl border border-neutral-100 bg-neutral-50 py-4 text-center text-[10px] font-bold text-neutral-400">
                        No saved invoices yet. Use Save Invoice to create one.
                      </p>
                    )}
                    {invoiceHistory.map((inv) => {
                      const isOverdue = inv.status !== "paid" && new Date(inv.dueDate) < new Date();
                      return (
                        <div key={inv.id} className={`space-y-3 rounded-xl border p-4 ${inv.status === "paid" ? "border-green-200 bg-green-50/30" : isOverdue ? "border-rose-200 bg-rose-50/30" : "border-neutral-200 bg-white"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-black text-neutral-900">{inv.invoiceRef}</p>
                              <p className="mt-0.5 text-[10px] font-bold text-neutral-400">
                                {new Date(inv.periodStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                {" - "}{new Date(inv.periodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                {" - "}{inv.lessonsCount} lesson{inv.lessonsCount !== 1 ? "s" : ""}{" - "}{inv.billingMode === "arrears" ? "Arrears" : "Upfront"}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${inv.status === "paid" ? "border-green-200 bg-green-100 text-green-700" : inv.status === "partial" ? "border-amber-200 bg-amber-100 text-amber-700" : isOverdue ? "border-rose-200 bg-rose-100 text-rose-700" : "border-neutral-200 bg-neutral-100 text-neutral-500"}`}>
                                {inv.status === "paid" ? "Paid" : inv.status === "partial" ? "Partial" : isOverdue ? "Overdue" : "Unpaid"}
                              </span>
                              <span className="text-sm font-black text-neutral-900">&pound;{inv.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-neutral-400">
                            <span>Due: {new Date(inv.dueDate).toLocaleDateString("en-GB")}</span>
                            {inv.paidAt && <span className="text-green-600">Paid &pound;{inv.paidAmount?.toFixed(2)} on {new Date(inv.paidAt).toLocaleDateString("en-GB")}</span>}
                            {inv.emailedAt && <span>Emailed: {new Date(inv.emailedAt).toLocaleDateString("en-GB")}</span>}
                          </div>

                          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                            <a href={getSavedInvoiceUrl(inv) || "#"} target="_blank" rel="noreferrer" className={`rounded-lg border px-3 py-2 text-center text-[10px] font-black transition-colors ${inv.accessCode ? "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50" : "pointer-events-none border-neutral-100 bg-neutral-50 text-neutral-300"}`}>
                              Open Hosted
                            </a>
                            <button type="button" onClick={() => handleCopySavedInvoiceLink(inv)} disabled={!inv.accessCode} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[10px] font-black text-neutral-700 transition-colors hover:bg-neutral-50 disabled:border-neutral-100 disabled:bg-neutral-50 disabled:text-neutral-300">
                              {copiedInvoiceId === inv.id ? "Copied" : "Copy Link"}
                            </button>
                            <a href={getSavedInvoicePdfUrl(inv) || "#"} target="_blank" rel="noreferrer" className={`rounded-lg border px-3 py-2 text-center text-[10px] font-black transition-colors ${inv.accessCode ? "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50" : "pointer-events-none border-neutral-100 bg-neutral-50 text-neutral-300"}`}>
                              Download PDF
                            </a>
                            <button type="button" onClick={() => handleResendSavedInvoice(inv)} disabled={!inv.accessCode || !selectedStudent?.payerEmail} className="rounded-lg bg-brand-600 px-3 py-2 text-[10px] font-black text-white transition-colors hover:bg-brand-700 disabled:bg-neutral-200 disabled:text-neutral-500">
                              Resend Email
                            </button>
                          </div>

                          {inv.billingMode === "arrears" && inv.status !== "paid" && inv.lessonDates.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {inv.lessonDates.map((lessonDate) => (
                                <button key={lessonDate.id} type="button" onClick={() => handleSavedAttendanceToggle(inv.id, lessonDate.id, !lessonDate.attended)} className={`rounded-md border px-2 py-1 text-[9px] font-black ${lessonDate.attended ? "border-green-200 bg-green-100 text-green-700" : "border-neutral-200 bg-neutral-100 text-neutral-400"}`}>
                                  {new Date(lessonDate.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: {lessonDate.attended ? "Present" : "Absent"}
                                </button>
                              ))}
                            </div>
                          )}

                          {(inv.status === "unpaid" || inv.status === "partial") && (
                            <button type="button" onClick={() => { setPayingInvoiceId(inv.id); setPayAmount(inv.totalAmount.toFixed(2)); }} className="w-full rounded-lg bg-teal-600 py-2 text-[10px] font-bold text-white transition-colors hover:bg-teal-700">
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>            </>)}
            </div>
          )}
        </div>

      </div>

      {/* Add Student Popup Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-100 flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Quick Add Student &amp; Payer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-600 font-bold text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">Student Name *</label>
                <input
                  type="text"
                  required
                  value={studentForm.studentName}
                  onChange={(e) => setStudentForm({ ...studentForm, studentName: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2.5 text-xs outline-none focus:border-brand-500 font-bold"
                  placeholder="Bobby Smith"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Instrument / Class *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.discipline}
                    onChange={(e) => setStudentForm({ ...studentForm, discipline: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2.5 text-xs outline-none focus:border-brand-500 font-bold"
                    placeholder="Piano"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Billing Interval</label>
                  <select
                    value={studentForm.billingFrequency}
                    onChange={(e) => setStudentForm({ ...studentForm, billingFrequency: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2.5 text-xs outline-none focus:border-brand-500 font-bold"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="termly">Termly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">Teaching Venue / Location Choice</label>
                <select
                  value={locationChoice}
                  onChange={(e) => setLocationChoice(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 p-2.5 text-xs outline-none focus:border-brand-500 font-semibold"
                >
                  <option value="home">Home Student (No specific venue)</option>
                  <option value="online">Online</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} (Venue)
                    </option>
                  ))}
                  <option value="new">+ Add new school or venue...</option>
                </select>
              </div>

              {locationChoice === "new" && (
                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-1">New Venue/School Name *</label>
                    <input
                      type="text"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-xs outline-none focus:border-brand-500 font-bold"
                      placeholder="St. Jude's Primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-1">Venue Address (Optional)</label>
                    <input
                      type="text"
                      value={newLocationAddress}
                      onChange={(e) => setNewLocationAddress(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-xs outline-none focus:border-brand-500"
                      placeholder="1 Oxford Road, London"
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-100 pt-3 mt-2">
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-neutral-400" /> Parent / Payer Details
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Parent Name *</label>
                    <input
                      type="text"
                      required
                      value={studentForm.payerName}
                      onChange={(e) => setStudentForm({ ...studentForm, payerName: e.target.value })}
                      className="w-full rounded-lg border border-neutral-200 p-2.5 text-xs outline-none focus:border-brand-500 font-bold"
                      placeholder="Sarah Smith"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 mb-1">Parent Email *</label>
                      <input
                        type="email"
                        required
                        value={studentForm.payerEmail}
                        onChange={(e) => setStudentForm({ ...studentForm, payerEmail: e.target.value })}
                        className="w-full rounded-lg border border-neutral-200 p-2.5 text-xs outline-none focus:border-brand-500"
                        placeholder="sarah.smith@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 mb-1">Parent Phone (Optional)</label>
                      <input
                        type="tel"
                        value={studentForm.payerPhone}
                        onChange={(e) => setStudentForm({ ...studentForm, payerPhone: e.target.value })}
                        className="w-full rounded-lg border border-neutral-200 p-2.5 text-xs outline-none focus:border-brand-500"
                        placeholder="07123 456789"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {addError && <p className="text-xs text-rose-600 font-bold mt-2">{addError}</p>}

            <div className="border-t border-neutral-100 pt-4 mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddStudent}
                disabled={isPending}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {isPending ? "Adding..." : "Add Student"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {payingInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-100 bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-neutral-800">Mark Invoice as Paid</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold text-neutral-600">Amount Received (&pound;)</label>
                <input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 p-2.5 text-sm font-bold outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setPayingInvoiceId(null); setPayAmount(""); }}
                  className="flex-1 rounded-xl border border-neutral-200 bg-white py-2.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMarkPaid}
                  disabled={markPaidPending || !payAmount}
                  className="flex-1 rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-50"
                >
                  {markPaidPending ? "Saving..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





















