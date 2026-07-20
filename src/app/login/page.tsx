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

          <div className="mb-6 rounded-md bg-brand-50 p-3 text-sm text-brand-900 border border-brand-100">
            <p className="font-semibold mb-1">Demo Teacher Login:</p>
            <p>Email: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-brand-200">teacher@example.com</span></p>
            <p className="mt-1">Pass: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-brand-200">changeme123</span></p>
          </div>

          <LoginForm callbackUrl={callbackUrl} />
          <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
            <p className="mb-2 font-medium text-neutral-800">Demo logins</p>
            <div className="space-y-3 text-neutral-600">
              <div>
                <p className="font-medium text-neutral-700">Test teacher</p>
                <p className="select-all font-mono text-xs">teacher@example.com</p>
                <p className="select-all font-mono text-xs">changeme123</p>
              </div>
              <div>
                <p className="font-medium text-neutral-700">Cover teacher</p>
                <p className="select-all font-mono text-xs">cover.teacher@example.com</p>
                <p className="select-all font-mono text-xs">cover12345</p>
              </div>
            </div>
          </div>
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
