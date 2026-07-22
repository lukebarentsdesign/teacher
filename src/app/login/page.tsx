import Link from "next/link";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/landing/logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={32} />
        </div>
        <div className="surface-card p-8">
          <h1 className="mb-1 text-xl font-semibold text-neutral-900">Welcome back</h1>
          <p className="mb-4 text-sm text-neutral-500">Sign in to your teacher account.</p>

          <LoginForm callbackUrl={callbackUrl} />
          <p className="mt-6 text-center text-sm text-neutral-500">
            New to TeachBase?{" "}
            <Link href="/register" className="font-medium text-brand-700 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
