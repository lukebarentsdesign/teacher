import { CheckinScanner } from "./checkin-scanner";

export default function CheckinPage() {
  return (
    <div className="max-w-lg">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Check in</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Scan a student&apos;s IG Card to sign them in or out. Signing in to a lesson marks
        attendance and bills it automatically — no separate attendance step needed.
      </p>
      <CheckinScanner />
    </div>
  );
}
