import React from "react";

export function TeachingNoteCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute bg-[#fef08a] text-neutral-800 p-5 rounded-md shadow-card rotate-[-3deg] w-48 font-medium ${className}`}
      style={{
        backgroundImage: "linear-gradient(#fef9c3 1px, transparent 1px)",
        backgroundSize: "100% 1.5rem",
        lineHeight: "1.5rem",
        paddingTop: "1.75rem",
      }}
    >
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-sm" />
      <ul className="list-none p-0 m-0 text-sm">
        <li>32 sessions</li>
        <li>£30 each</li>
        <li>September–July</li>
      </ul>
    </div>
  );
}

export function SmoothPaymentCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute bg-white p-5 rounded-2xl shadow-xl w-64 border border-neutral-100 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
          AC
        </div>
        <div>
          <div className="font-semibold text-neutral-900 text-sm">Amelia Carter</div>
          <div className="text-xs text-neutral-500">30-minute weekly session</div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>30 sessions × £32</span>
          <span>£960</span>
        </div>
        <div className="h-px bg-neutral-100 w-full my-2" />
        <div className="flex justify-between font-semibold text-neutral-900">
          <span>Annual tuition</span>
          <span>£960</span>
        </div>
        <div className="flex justify-between font-bold text-brand-600 bg-brand-50 p-2 rounded-lg mt-2">
          <span>Monthly payment</span>
          <span>£80</span>
        </div>
      </div>
    </div>
  );
}

export function NextLessonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute bg-white p-4 rounded-xl shadow-lg border border-neutral-100 w-56 flex items-center gap-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex flex-col items-center justify-center shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider">Tue</span>
        <span className="text-lg font-bold leading-none">14</span>
      </div>
      <div>
        <div className="font-semibold text-neutral-900 text-sm">Oliver James</div>
        <div className="text-xs text-neutral-500 mt-0.5">4:30 pm</div>
        <div className="text-xs text-neutral-500 truncate">St Mary’s School</div>
      </div>
    </div>
  );
}

export function MonthlyOverviewCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute bg-white p-5 rounded-2xl shadow-xl border border-neutral-100 w-64 ${className}`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
        This Month
      </h3>
      <div className="space-y-4 text-sm">
        <div>
          <div className="flex justify-between text-neutral-600 mb-1">
            <span>Expected</span>
            <span className="font-medium">£2,460</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5">
            <div className="bg-neutral-300 h-1.5 rounded-full w-full"></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-neutral-900 mb-1">
            <span>Received</span>
            <span className="font-semibold text-brand-600">£2,080</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5">
            <div className="bg-brand-500 h-1.5 rounded-full w-[85%]"></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-neutral-600 mb-1">
            <span>Outstanding</span>
            <span className="font-medium text-amber-600">£380</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5">
            <div className="bg-amber-400 h-1.5 rounded-full w-[15%]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
