import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-xl font-semibold text-neutral-900">
          Teacher login
        </h1>
        <LoginForm callbackUrl={callbackUrl} />
        <p className="mt-4 text-center text-sm text-neutral-500">
          New to Learnio?{" "}
          <Link href="/register" className="text-neutral-900 underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
