import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { MODULE_REGISTRY, PRICE_POINT_GBP_MONTHLY } from "@/lib/modules";
import {
  Sparkles,
  Users,
  Calendar,
  Clock,
  BookOpen,
  ShieldCheck,
  Globe,
  Tag,
  GraduationCap,
} from "lucide-react";

const ICON_MAP = {
  ORGANISATION: Users,
  TERM_CALENDARS: Calendar,
  SCHEDULING: Clock,
  CURRICULUM: BookOpen,
  COMPLIANCE: ShieldCheck,
  EMBEDS: Globe,
  COMMERCE: Tag,
  GROUP_TEACHING: GraduationCap,
};

export default async function UpgradePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: session.user.id },
    select: { isPaidTier: true },
  });

  if (teacher?.isPaidTier) {
    return (
      <div className="max-w-3xl py-10 px-6">
        <div className="rounded-3xl bg-neutral-900 text-white p-8 md:p-12 text-center shadow-xl">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">You are on the Pro Tier!</h1>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">
            Thank you for subscribing. You have full access to all 8 advanced modules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl py-8 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold ring-1 ring-brand-700/10">
          <Sparkles className="w-3.5 h-3.5" /> Unlock Advanced Features
        </span>
        <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight sm:text-5xl">
          Upgrade to TeachBase Pro
        </h1>
        <p className="text-lg text-neutral-500">
          One simple subscription unlocks all 8 modules for your teaching business. Run your studio with absolute confidence.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 items-center">
        {/* Foundation - Free */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Foundation</h3>
            <p className="text-sm text-neutral-500 mt-1">Perfect for solo tutoring day one.</p>
          </div>
          <div className="text-4xl font-extrabold tracking-tight text-neutral-900">
            £0<span className="text-base font-medium text-neutral-400">/mo</span>
          </div>
          <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Active Tier</div>
          <ul className="space-y-3 pt-2 text-sm text-neutral-600 border-t border-neutral-100">
            <li className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Student &amp; Payer Records
            </li>
            <li className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Teaching Contracts
            </li>
            <li className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Quick Invoice &amp; Balances
            </li>
            <li className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Parent Portal Microsite
            </li>
          </ul>
        </div>

        {/* Pro - Gated Bundle */}
        <div className="bg-white border-2 border-brand-500 rounded-3xl p-8 shadow-md space-y-6 md:scale-105 relative">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
            Popular
          </span>
          <div>
            <h3 className="text-xl font-bold text-neutral-900">TeachBase Pro</h3>
            <p className="text-sm text-neutral-500 mt-1">Unlock all 8 advanced modules.</p>
          </div>
          <div className="text-4xl font-extrabold tracking-tight text-neutral-900">
            £{PRICE_POINT_GBP_MONTHLY}<span className="text-base font-medium text-neutral-400">/mo</span>
          </div>
          <button
            disabled
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-neutral-100 text-neutral-400 cursor-not-allowed"
          >
            Upgrade (Coming Soon)
          </button>
          <ul className="space-y-3 pt-2 text-sm text-neutral-600 border-t border-neutral-100">
            <li className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-brand-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              All 8 Modules included
            </li>
            <li className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-brand-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Safeguarding &amp; Safety always free
            </li>
            <li className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-brand-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              No setup fees
            </li>
          </ul>
        </div>

        {/* Enterprise / Multi-instructor */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Studio &amp; Teams</h3>
            <p className="text-sm text-neutral-500 mt-1">Custom solutions for large academies.</p>
          </div>
          <div className="text-4xl font-extrabold tracking-tight text-neutral-900">
            Custom
          </div>
          <button
            disabled
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
          >
            Contact Support
          </button>
          <ul className="space-y-3 pt-2 text-sm text-neutral-600 border-t border-neutral-100">
            <li className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-brand-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Multi-instructor setups
            </li>
            <li className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-brand-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Dedicated migration support
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight text-center">
          What is included in the Pro Bundle?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(MODULE_REGISTRY).map(([key, value]) => {
            const IconComponent = ICON_MAP[key as keyof typeof ICON_MAP] || Sparkles;
            return (
              <div key={key} className="p-6 rounded-2xl border border-neutral-200 bg-white space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <IconComponent className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-neutral-900">{value.label}</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">{value.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
