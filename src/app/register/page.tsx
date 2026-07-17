import Link from "next/link";
import { RegisterForm } from "./register-form";
import { Logo } from "@/components/landing/logo";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={32} />
        </div>
        <div className="surface-card p-8">
          <h1 className="mb-6 text-xl font-semibold text-neutral-900">Create your teacher account</h1>
          <RegisterForm />
          <p className="mt-4 text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="text-neutral-900 underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
