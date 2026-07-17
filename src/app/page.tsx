import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  TeachingNoteCard,
  SmoothPaymentCard,
  NextLessonCard,
  MonthlyOverviewCard,
} from "@/components/landing/floating-cards";
import { FeatureVote } from "@/components/landing/feature-vote";
import { Logo } from "@/components/landing/logo";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export default function LandingPage() {
  return (
    <div className={`${jakarta.variable} font-jakarta bg-neutral-50 min-h-screen text-neutral-900 overflow-x-hidden selection:bg-brand-200 selection:text-brand-900`}>
      {/* Navigation bar */}
      <nav className="fixed top-0 inset-x-0 bg-neutral-50/80 backdrop-blur-md z-50 border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size={34} wordmarkClassName="text-xl text-neutral-900" />

          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-neutral-600">
            <Link href="#how-it-works" className="hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">How it works</Link>
            <Link href="#features" className="hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">Features</Link>
            <Link href="#for-teachers" className="hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">Who it&apos;s for</Link>
            <Link href="#pricing" className="hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">Pricing</Link>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/parent/login" className="hidden sm:block text-neutral-600 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">
              Parent login
            </Link>
            <Link href="/login" className="hidden sm:block text-neutral-600 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">
              Sign in
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-neutral-900 leading-[1.1] mb-8">
            Teach by the term.<br />
            <span className="text-neutral-500">Get paid smoothly each month.</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Keep clients, payers and payments organised in one place — set up term-based
            or rolling billing, download invoice PDFs and record payments. The smooth-payment
            calculator is in preview for the trial.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 mt-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-full text-lg font-semibold hover:bg-brand-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50">
              Start your free two-week trial
            </Link>
            <p className="text-sm text-neutral-500 text-center">
              No card required. Built for independent teachers, instructors and coaches.
            </p>
          </div>
        </div>

        {/* Floating Cards (Hidden on mobile for layout sanity, visible md+) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
          <TeachingNoteCard className="top-24 left-4 xl:left-16" />
          <SmoothPaymentCard className="bottom-4 left-4 xl:left-16 rotate-3" />
          <NextLessonCard className="top-32 right-4 xl:right-16 -rotate-2" />
          <MonthlyOverviewCard className="bottom-8 right-4 xl:right-16 rotate-1" />
        </div>
      </section>

      {/* 1. The problem with term-based teaching income */}
      <section className="py-24 bg-white" id="problem">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">The rollercoaster of term-based income</h2>
          <p className="text-lg text-neutral-600 leading-relaxed mb-12">
            You deliver sessions consistently, but you don&apos;t get paid consistently. The start of each term brings a flood of payments, followed by months of chasing invoices — and holidays mean no income at all. It&apos;s stressful, unpredictable, and makes financial planning impossible.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Unpredictable Cashflow</h3>
              <p className="text-sm text-neutral-600">Massive spikes at the start of term, followed by dry spells during holidays.</p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Chasing Payments</h3>
              <p className="text-sm text-neutral-600">Hours wasted every term manually emailing clients to remind them about overdue invoices.</p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Admin Overload</h3>
              <p className="text-sm text-neutral-600">Complex spreadsheets trying to track who has paid for which term and who hasn&apos;t.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 1b. Flexible billing models */}
      <section className="py-24 bg-white border-t border-neutral-200/50" id="billing-models">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-700 text-xs font-bold tracking-wider uppercase mb-4">Flexible billing</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Bill however you and your clients prefer</h2>
            <p className="text-lg text-neutral-600">Learnio isn&apos;t only for monthly plans. Charge each client the way that fits them — and switch model whenever you need to.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
              <div className="w-11 h-11 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Pay as you go</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Individually booked lessons, charged and paid one at a time.</p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
              <div className="w-11 h-11 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Weekly</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Regular weekly charges for standing lesson slots.</p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
              <div className="w-11 h-11 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Termly</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">One invoice per term, based on the lessons in that term.</p>
            </div>

            <div className="p-6 rounded-2xl border-2 border-brand-500 bg-brand-50 relative">
              <span className="absolute -top-3 left-5 bg-brand-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">The clever bit</span>
              <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l3-3 3 3 4-5" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Smooth monthly</h3>
              <p className="text-sm text-neutral-700 leading-relaxed">A year of lessons spread into equal monthly payments.</p>
            </div>
          </div>

          <div className="bg-neutral-900 text-white rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-start gap-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">Smooth monthly is the fairest plan — and the biggest headache to set up</h3>
              <p className="text-neutral-300 leading-relaxed">Working out a year of lessons, dividing it evenly, handling term breaks and mid-year starts, then convincing every parent it&apos;s fair — most teachers give up and go back to lumpy termly invoices. Learnio does the maths for you, spreads the year into equal payments, and hands you clear, transparent figures to share, so it&apos;s an easy &ldquo;yes&rdquo; for families. <span className="text-neutral-400">The guided smooth-payment calculator is in preview for the trial.</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. A worked monthly-payment calculation */}
      <section className="py-24 bg-neutral-50 border-y border-neutral-200/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">The magic of monthly smoothing</h2>
              <p className="text-lg text-neutral-600 leading-relaxed mb-8">
                By taking the total cost of a year&apos;s sessions and dividing it into equal monthly payments, your clients get a predictable bill, and you get a steady income — even through the holidays.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-neutral-900 font-medium">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <p>Count your annual sessions (e.g. 39 weeks)</p>
                </div>
                <div className="flex items-center gap-4 text-neutral-900 font-medium">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <p>Multiply by your session rate (e.g. £25) = £975/year</p>
                </div>
                <div className="flex items-center gap-4 text-neutral-900 font-medium">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <p>Divide by 12 months = <span className="text-brand-600 font-bold">£81.25/month</span></p>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full max-w-sm">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100 relative">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNlNThhNjMiLz48L3N2Zz4=')] opacity-50 z-0"></div>
                <div className="relative z-10 space-y-6">
                  <h3 className="font-bold text-xl text-center border-b border-neutral-100 pb-4">Standard Plan</h3>
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>39 sessions × £25</span>
                    <span>£975</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>Materials &amp; kit budget</span>
                    <span>£25</span>
                  </div>
                  <div className="h-px bg-neutral-100 w-full" />
                  <div className="flex justify-between items-center font-bold text-neutral-900">
                    <span>Annual Total</span>
                    <span>£1,000</span>
                  </div>
                  <div className="bg-brand-50 rounded-xl p-4 text-center mt-4">
                    <p className="text-sm text-brand-600 font-semibold mb-1">Smooth monthly payment</p>
                    <p className="text-4xl font-extrabold text-brand-700">£83.33</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four-step explanation of how Learnio works */}
      <section className="py-24 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Learnio works</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">Set up your terms once, and let the software handle the maths, the invoices, and the tracking.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-900 font-bold text-xl flex items-center justify-center mb-6">1</div>
              <h3 className="font-semibold text-lg mb-2">Set your terms</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Define your working weeks for the year and set your session rates.</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-900 font-bold text-xl flex items-center justify-center mb-6">2</div>
              <h3 className="font-semibold text-lg mb-2">Add your clients</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Log each client&apos;s session duration, frequency, and any add-ons like kit or room hire.</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-900 font-bold text-xl flex items-center justify-center mb-6">3</div>
              <h3 className="font-semibold text-lg mb-2">Preview the plan</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Set up each client&apos;s subscription and preview the smooth-payment calculator we&apos;re bringing to trial.</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-bold text-xl flex items-center justify-center mb-6">4</div>
              <h3 className="font-semibold text-lg mb-2">Invoice & track</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Download invoice PDFs, record payments and track who has paid from your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3b. Everything Learnio can do today (audit-verified features) */}
      <section className="py-24 bg-neutral-50 border-t border-neutral-200/50" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-700 text-xs font-bold tracking-wider uppercase mb-4">Available today</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to run your practice</h2>
            <p className="text-lg text-neutral-600">The essentials for a self-employed teaching or coaching practice — clients, payers, locations and money — ready to use now.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="p-7 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-card transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2-5.24" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 mb-2">Clients &amp; payers in one place</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Keep clients, their guardians and payment contacts together, with several clients linked to a single payer for family or group billing.</p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-card transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 mb-2">Locations &amp; term calendars</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Set up teaching locations, rooms and term calendars — schools, home visits, your studio or online.</p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-card transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 mb-2">Invoice &amp; statement PDFs</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Download a clear PDF statement or invoice for any client, built from their ledger entries.</p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-card transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 12h.01M18 12h.01" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 mb-2">Record payments</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Record manual payments against a client&apos;s subscription and watch the running balance update automatically.</p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-card transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 mb-2">Make-up credits &amp; cancellations</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Track make-up credits and cancellation outcomes so missed sessions are handled fairly and transparently.</p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-card transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M18.5 8L13 13.5l-3-3L6.5 14" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 mb-2">Income forecast &amp; CSV export</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">See expected, received and outstanding income, and export your ledger as a CSV for your accountant.</p>
            </div>

          </div>
        </div>
      </section>

      {/* 3c. Solutions — outcome-framed lead-in to the dashboard */}
      <section className="py-24 bg-white border-t border-neutral-200/50" id="solutions">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-700 text-xs font-bold tracking-wider uppercase mb-4">Solutions</span>
            <h2 className="text-3xl md:text-4xl font-bold">Solve your biggest admin headaches</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10 text-left">
            <div>
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l4-4 3 3 5-6" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Steady income, not a rollercoaster</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Turn a year of sessions into equal monthly amounts, so you&apos;re paid the same in August as in September.</p>
            </div>
            <div>
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Stop chasing payments</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Every client&apos;s running balance is always up to date, so you can see who&apos;s paid at a glance.</p>
            </div>
            <div>
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16M4 12h10M4 19h7" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">One place, no spreadsheets</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Clients, sessions, locations, invoices and income — organised together instead of scattered across tabs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Real product screenshot section */}
      <section className="py-24 bg-neutral-900 text-white overflow-hidden" id="dashboard">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">A dashboard that makes sense</h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-16">
            No cluttered spreadsheets. Just clear insights into your schedule, your clients, and your income.
          </p>
          
          <div className="relative mx-auto max-w-5xl">
            {/* Framed browser-like UI containing a real dashboard mockup */}
            <div className="rounded-xl overflow-hidden border border-neutral-700 bg-white shadow-2xl text-left relative z-10">
              {/* top bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-b from-brand-50 to-white border-b border-neutral-200">
                <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm">
                  <span className="w-5 h-5 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 inline-block" />
                  Learnio
                </div>
                <div className="hidden sm:flex items-center gap-4 text-neutral-500 text-xs">
                  <span>Monday, 14 September</span>
                  <span>Amanda P.</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[190px_1fr]">
                {/* sidebar */}
                <div className="hidden md:block border-r border-neutral-200 bg-neutral-50 p-3 text-sm">
                  {["Today", "Clients", "Timetable", "Invoices", "Payments"].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${i === 0 ? "bg-brand-50 text-brand-700 font-semibold" : "text-neutral-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-brand-600" : "bg-neutral-300"}`} />
                      {item}
                    </div>
                  ))}
                  <div className="text-[10px] tracking-widest uppercase text-neutral-400 mt-4 mb-1 px-3">Setup</div>
                  {["Locations", "Term calendar", "Lesson types"].map((item) => (
                    <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
                      {item}
                    </div>
                  ))}
                </div>
                {/* main */}
                <div className="p-5 bg-neutral-50">
                  <div className="text-xl font-bold text-neutral-900 mb-4">Good morning, <span className="text-neutral-400">Amanda</span></div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1.25fr_1fr] gap-3">
                    <div className="bg-white border border-neutral-200 rounded-xl p-4">
                      <div className="flex justify-between text-xs font-semibold text-neutral-500 mb-2">
                        <span>Today&apos;s sessions</span><span>4</span>
                      </div>
                      {[["Amelia Carter — 30 min", "09:00"], ["Oliver James — 45 min", "10:30"], ["Priya Shah — 30 min", "16:00"], ["Group class — 6 in", "17:30"]].map(([label, time], i) => (
                        <div key={label} className={`flex items-center gap-2 text-xs py-2 ${i > 0 ? "border-t border-neutral-100" : ""}`}>
                          <span className="w-2 h-2 rounded-full bg-brand-500" />
                          <span className="text-neutral-700">{label}</span>
                          <span className="ml-auto text-neutral-400">{time}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col items-center justify-center">
                      <div className="text-xs font-semibold text-neutral-500 self-start mb-2">This month</div>
                      <div className="w-[78px] h-[78px] rounded-full flex items-center justify-center" style={{ background: "conic-gradient(#4f46e5 0 72%, #e6e9ee 72% 100%)" }}>
                        <div className="w-[54px] h-[54px] rounded-full bg-white flex items-center justify-center text-[13px] font-bold text-neutral-900">72%</div>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-2">£2,080 of £2,880 received</div>
                    </div>
                  </div>
                  <div className="bg-white border border-neutral-200 rounded-xl p-4 mt-3">
                    {[["Carter family", 100, "Paid", "text-green-600"], ["O. James", 100, "Paid", "text-green-600"], ["Shah family", 40, "Due", "text-amber-600"]].map(([name, pct, status, color], i) => (
                      <div key={name as string} className={`flex items-center gap-3 text-xs py-2 ${i > 0 ? "border-t border-neutral-100" : ""}`}>
                        <span className="flex-1 font-medium text-neutral-700">{name}</span>
                        <span className="w-20 h-1.5 rounded-full bg-neutral-100 overflow-hidden"><span className="block h-full bg-brand-500" style={{ width: `${pct}%` }} /></span>
                        <span className={`font-semibold ${color as string}`}>{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-neutral-500 text-xs mt-4">Illustrative dashboard — figures are examples.</p>

            {/* Decorative glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-500/20 blur-[120px] pointer-events-none rounded-full"></div>
          </div>
        </div>
      </section>

      {/* 5. Built for independent music teachers */}
      <section className="py-24 bg-white" id="for-teachers">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Built for self-employed teachers, instructors and coaches</h2>
              <p className="text-lg text-neutral-600 leading-relaxed mb-6">
                Generic invoicing software doesn&apos;t understand terms, recurring weekly sessions, or the way you work across several locations. We do.
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed mb-8">
                Learnio is built from the ground up for peripatetic teachers, private studio and gym owners, tutors, personal trainers and online instructors who need a system tailored to their workflow.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-neutral-800 font-medium">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Work across multiple locations — schools, studios, homes or online
                </li>
                <li className="flex items-center gap-3 text-neutral-800 font-medium">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Handle families, siblings and joint billing in one place
                </li>
                <li className="flex items-center gap-3 text-neutral-800 font-medium">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Client access to view schedules and balances
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full bg-neutral-50 rounded-3xl p-8 border border-neutral-200">
              <blockquote className="text-xl font-medium leading-relaxed text-neutral-900 mb-6 italic">
                &ldquo;Before Learnio, I spent the first two weeks of every term wrestling with spreadsheets and chasing clients for fees. Now everything is smoothed into monthly payments. My clients love it, and I actually have a predictable income.&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-300 rounded-full overflow-hidden">
                  {/* Placeholder for avatar */}
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">Sarah Jenkins</div>
                  <div className="text-sm text-neutral-600">Private tutor &amp; swim coach, 42 clients</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Coming-soon features with voting controls */}
      <section className="py-24 bg-neutral-50 border-t border-neutral-200/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-700 text-xs font-bold tracking-wider uppercase mb-4">Roadmap</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Shape the future of Learnio</h2>
            <p className="text-lg text-neutral-600">Vote on the features you want us to build next. We&apos;re actively developing based on community feedback.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureVote
              title="Client portal"
              description="One secure place for clients and parents to view invoices, balances and sessions."
              initialVotes={412}
            />
            <FeatureVote
              title="Online card payments"
              description="Let clients pay by card with money going straight to you. Manual payment tracking is available now."
              initialVotes={389}
            />
            <FeatureVote
              title="Google & Outlook calendar sync"
              description="Two-way sync with the calendar you already use. Individual session calendar files work today."
              initialVotes={301}
            />
            <FeatureVote
              title="Automated payment reminders"
              description="Gentle automatic nudges to clients when a payment is due or overdue."
              initialVotes={276}
            />
            <FeatureVote
              title="Session notes & shared resources"
              description="Keep session notes and share materials with your clients."
              initialVotes={214}
            />
            <FeatureVote
              title="School timetable tools"
              description="Manage terms, rooms, travel and pupil timetables across multiple schools."
              initialVotes={168}
            />
            <FeatureVote
              title="Group & shared lessons"
              description="Support small-group lessons and shared lesson billing."
              initialVotes={143}
            />
            <FeatureVote
              title="Equipment tracking"
              description="Track loaned equipment, instruments and books with due-back dates."
              initialVotes={97}
            />
          </div>
        </div>
      </section>

      {/* 8. Frequently asked questions */}
      <section className="py-24 bg-white border-t border-neutral-200/50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">Can clients still pay termly if they prefer?</h3>
              <p className="text-neutral-600 leading-relaxed">Yes. While Learnio is built to smooth payments monthly, you can override this for specific clients who prefer to pay for the entire term or year upfront.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Does Learnio collect the payments?</h3>
              <p className="text-neutral-600 leading-relaxed">Not yet. Today you record payments manually as they come in via your normal bank transfer method, and Learnio keeps the running balance. Automated online card collection is on the roadmap — vote for it above.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">What if a client starts mid-year?</h3>
              <p className="text-neutral-600 leading-relaxed">You can set the subscription start date and enter the amount that reflects their remaining lessons. Fully guided mid-year and mid-term proration is part of the smooth-payment calculator we&apos;re bringing to trial.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Is there a contract?</h3>
              <p className="text-neutral-600 leading-relaxed">No. You can cancel at any time. You can also export your ledger data as a CSV to hand to your accountant whenever you need it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6b. Pricing tiers */}
      <section className="py-24 bg-neutral-50 border-t border-neutral-200/50" id="pricing">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-700 text-xs font-bold tracking-wider uppercase mb-4">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, honest pricing</h2>
            <p className="text-lg text-neutral-600">Start free for two weeks — no card required. Prices below are illustrative for the trial.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">

            {/* Solo */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8">
              <h3 className="text-lg font-bold mb-1">Solo</h3>
              <p className="text-sm text-neutral-500 mb-5">For a teacher just getting started.</p>
              <div className="text-4xl font-extrabold tracking-tight mb-5">£9<span className="text-base font-semibold text-neutral-400">/mo</span></div>
              <Link href="/register" className="block text-center w-full py-3 rounded-xl font-semibold text-sm mb-6 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors">Start free trial</Link>
              <ul className="space-y-3">
                {["Up to 25 clients", "Clients, payers & locations", "Invoice PDFs & payment tracking", "CSV export"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-neutral-600">
                    <svg className="w-4 h-4 text-brand-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Studio (highlighted) */}
            <div className="relative bg-brand-600 text-white rounded-3xl p-8 shadow-xl md:-translate-y-3">
              <span className="absolute -top-3 right-6 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">Best value</span>
              <h3 className="text-lg font-bold mb-1">Studio</h3>
              <p className="text-sm text-white/80 mb-5">For a busy independent practice.</p>
              <div className="text-4xl font-extrabold tracking-tight mb-5">£19<span className="text-base font-semibold text-white/75">/mo</span></div>
              <Link href="/register" className="block text-center w-full py-3 rounded-xl font-semibold text-sm mb-6 bg-white text-brand-600 hover:bg-neutral-50 transition-colors">Start free trial</Link>
              <ul className="space-y-3">
                {["Unlimited clients", "Everything in Solo", "Term calendars & timetabling", "Make-up credits & income forecast"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/95">
                    <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Team */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8">
              <h3 className="text-lg font-bold mb-1">Team</h3>
              <p className="text-sm text-neutral-500 mb-5">For multi-instructor setups.</p>
              <div className="text-4xl font-extrabold tracking-tight mb-5">£39<span className="text-base font-semibold text-neutral-400">/mo</span></div>
              <Link href="/register" className="block text-center w-full py-3 rounded-xl font-semibold text-sm mb-6 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors">Talk to us</Link>
              <ul className="space-y-3">
                {["Everything in Studio", "Multiple instructors", "Cover assignments", "Priority support"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-neutral-600">
                    <svg className="w-4 h-4 text-brand-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

          </div>
          <p className="text-center text-sm text-neutral-500 mt-8 max-w-2xl mx-auto">Coming-soon features (online payments, client portal, calendar sync) are included as they ship — no price change during your trial.</p>
        </div>
      </section>

      {/* 7. Final two-week trial call to action */}
      <section className="py-24 bg-brand-600 text-white text-center" id="get-started">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to smooth out your income?</h2>
          <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
            Join independent teachers, instructors and coaches taking the stress out of termly billing. Try Learnio completely free for 14 days.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="px-8 py-4 bg-white text-brand-600 rounded-full text-lg font-bold hover:bg-neutral-50 transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600">
              Start your free two-week trial
            </Link>
          </div>
          <p className="mt-6 text-brand-200 text-sm">No credit card required to start. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-12 text-sm text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center mb-6">
            <Logo size={28} wordmarkClassName="text-lg text-white" />
          </div>
          <div className="flex justify-center gap-6 mb-8">
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact Support</Link>
          </div>
          <p>© {new Date().getFullYear()} Learnio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
