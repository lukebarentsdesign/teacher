import { LoginCodeForm } from "./login-code-form";

export default function ParentLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-xl font-semibold text-neutral-900">Parent / guardian access</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Enter the 6-digit code your teacher gave you.
        </p>
        <LoginCodeForm />
      </div>
    </div>
  );
}
