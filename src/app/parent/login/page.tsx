import { LoginCodeForm } from "./login-code-form";

import { Logo } from "@/components/landing/logo";

export default function ParentLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={32} />
        </div>
        <div className="surface-card p-8">
          <h1 className="mb-1 text-xl font-semibold text-neutral-900">Guardian &amp; student access</h1>
          <p className="mb-4 text-sm text-neutral-500">
            Enter the 6-digit code your teacher gave you.
          </p>

          <div className="mb-6 rounded-md bg-brand-50 p-3 text-sm text-brand-900 border border-brand-100">
            <p className="font-semibold mb-1">Demo Guardian Login:</p>
            <p>Access Code: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-brand-200">410001</span> (Rachel Bennett)</p>
          </div>

          <LoginCodeForm />
        </div>
      </div>
    </div>
  );
}
