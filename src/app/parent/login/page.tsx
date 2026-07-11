import { LoginCodeForm } from "./login-code-form";

export default function ParentLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            L
          </span>
          <span className="text-lg font-semibold tracking-tight text-neutral-900">Learnio</span>
        </div>
        <div className="surface-card p-8">
          <h1 className="mb-1 text-xl font-semibold text-neutral-900">Guardian &amp; student access</h1>
          <p className="mb-6 text-sm text-neutral-500">
            Enter the 6-digit code your teacher gave you.
          </p>
          <LoginCodeForm />
        </div>
      </div>
    </div>
  );
}
