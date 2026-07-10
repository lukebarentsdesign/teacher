export default async function PaymentConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const success = status === "success";

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-md">
        <h1 className="text-xl font-semibold text-neutral-900">
          {success ? "Thanks — payment received" : "Payment cancelled"}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {success
            ? "Your teacher has been notified and your balance has been updated."
            : "No payment was taken. You can ask for a new payment link if you still need to pay."}
        </p>
      </div>
    </div>
  );
}
