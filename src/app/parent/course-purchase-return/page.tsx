import Link from "next/link";

export default async function CoursePurchaseReturnPage({
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
          {success ? "Thanks — purchase complete" : "Purchase cancelled"}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {success
            ? "Your course is ready — head back to your student's Courses tab to open it."
            : "No payment was taken."}
        </p>
        <Link href="/parent" className="mt-4 inline-block text-sm text-brand-700 underline">
          Back to your students
        </Link>
      </div>
    </div>
  );
}
