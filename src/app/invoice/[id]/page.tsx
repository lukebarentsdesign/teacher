import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

function formatMoney(value: number) {
  return `${String.fromCharCode(163)}${value.toFixed(2)}`;
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function HostedQuickInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { id } = await params;
  const { code } = await searchParams;

  const invoice = await prisma.quickInvoice.findUnique({
    where: { id },
    include: {
      teacher: true,
      student: {
        include: {
          payerLinks: {
            where: { isPrimary: true },
            include: { payer: true },
            take: 1,
          },
        },
      },
    },
  });

  const payer = invoice?.student.payerLinks[0]?.payer;
  if (!invoice || !payer || payer.accessCode !== code) notFound();

  const balanceDue = Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0));
  const isPaid = invoice.status === "paid" || balanceDue <= 0;
  const pdfHref = `/api/quick-invoice/${invoice.id}/pdf?code=${encodeURIComponent(code || "")}`;

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 text-neutral-900">
      <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-neutral-200 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400">Learnio Invoice</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">{invoice.invoiceRef}</h1>
            <p className="mt-1 text-sm font-semibold text-neutral-500">For {invoice.student.name}</p>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${isPaid ? "border-teal-200 bg-teal-50 text-teal-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
            {isPaid ? "Paid" : "Payment Due"}
          </span>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
          <section className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">From</p>
            <p className="text-sm font-black text-neutral-900">{invoice.teacher.businessName || invoice.teacher.name}</p>
            <p className="whitespace-pre-line text-sm font-semibold text-neutral-500">{invoice.teacher.businessAddress || invoice.teacher.email}</p>
          </section>
          <section className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">To</p>
            <p className="text-sm font-black text-neutral-900">{payer.name}</p>
            <p className="text-sm font-semibold text-neutral-500">{payer.email || "No email on file"}</p>
          </section>
        </div>

        <div className="mx-6 overflow-hidden rounded-xl border border-neutral-200">
          <div className="grid grid-cols-[1fr_90px_100px] bg-neutral-50 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-neutral-400">
            <span>Description</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Total</span>
          </div>
          <div className="grid grid-cols-[1fr_90px_100px] px-4 py-4 text-sm font-bold">
            <span>{invoice.lessonsCount} lesson{invoice.lessonsCount !== 1 ? "s" : ""} for {formatDate(invoice.periodStart)} to {formatDate(invoice.periodEnd)}</span>
            <span className="text-center">{invoice.lessonsCount}</span>
            <span className="text-right">{formatMoney(invoice.totalAmount)}</span>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:grid-cols-3">
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-[10px] font-black uppercase text-neutral-400">Issued</p>
            <p className="mt-1 text-sm font-black">{formatDate(invoice.createdAt)}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-[10px] font-black uppercase text-neutral-400">Due</p>
            <p className="mt-1 text-sm font-black">{formatDate(invoice.dueDate)}</p>
          </div>
          <div className="rounded-xl bg-neutral-900 p-4 text-white">
            <p className="text-[10px] font-black uppercase text-white/50">Balance</p>
            <p className="mt-1 text-xl font-black">{formatMoney(balanceDue)}</p>
          </div>
        </div>

        {(invoice.teacher.paymentInstructions || invoice.teacher.invoiceStripeLink) && (
          <div className="mx-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">Payment</p>
            {invoice.teacher.paymentInstructions && <p className="mt-2 whitespace-pre-line text-sm font-semibold text-neutral-700">{invoice.teacher.paymentInstructions}</p>}
            {invoice.teacher.invoiceStripeLink && (
              <a href={invoice.teacher.invoiceStripeLink} className="mt-3 inline-flex rounded-lg bg-teal-600 px-4 py-2 text-xs font-black text-white hover:bg-teal-700">
                Pay Online
              </a>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href={pdfHref} className="rounded-lg bg-neutral-900 px-4 py-2 text-center text-xs font-black text-white hover:bg-neutral-800">
            Download PDF
          </Link>
          <p className="text-xs font-semibold text-neutral-400">Questions? Contact {invoice.teacher.email}</p>
        </div>
      </div>
    </main>
  );
}
