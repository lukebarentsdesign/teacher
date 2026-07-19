import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  TeachingNoteCard,
  ClientRecordCard,
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
            <Link href="#modules" className="hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">Modules</Link>
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
            Run your teaching practice.<br />
            <span className="text-neutral-500">Lessons, learners, admin and income in one place.</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Plan your timetable, manage students and families, track attendance, share resources,
            create invoices, record payments and keep the day-to-day details of your teaching work together.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 mt-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-full text-lg font-semibold hover:bg-brand-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50">
              Start your free two-week trial
            </Link>
            <p className="text-sm text-neutral-500 text-center">
              No card required. Built for independent teachers, tutors, instructors, coaches and small studios.
            </p>
          </div>
        </div>

        {/* Floating Cards (Hidden on mobile for layout sanity, visible md+) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
          <TeachingNoteCard className="top-24 left-4 xl:left-16" />
          <ClientRecordCard className="bottom-4 left-4 xl:left-16 rotate-3" />
          <NextLessonCard className="top-32 right-4 xl:right-16 -rotate-2" />
          <MonthlyOverviewCard className="bottom-8 right-4 xl:right-16 rotate-1" />
        </div>
      </section>

      {/* 1. The problem with scattered teaching admin */}
      <section className="py-24 bg-white" id="problem">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Teaching admin should not run the practice</h2>
          <p className="text-lg text-neutral-600 leading-relaxed mb-12">
            Most teachers end up running their practice from a patchwork of calendars, spreadsheets, message threads and half-finished notes. Lessons happen in real life, but the admin lives everywhere else.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Scattered Information</h3>
              <p className="text-sm text-neutral-600">Student details, payer contacts, lesson notes and venue information all end up in different places.</p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Timetable Pressure</h3>
              <p className="text-sm text-neutral-600">Recurring sessions, school terms, room changes, travel time and cancellations are hard to keep tidy.</p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Finance Admin</h3>
              <p className="text-sm text-neutral-600">Invoices, attendance, make-up credits and payments need to match what actually happened.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 1b. Foundation + Modules — the real architecture */}
      <section className="py-24 bg-white border-t border-neutral-200/50" id="modules">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-700 text-xs font-bold tracking-wider uppercase mb-4">How Learnio is built</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">One foundation, switch on what you need</h2>
            <p className="text-lg text-neutral-600">Every account starts with the same core — students, payers, locations and invoicing. Everything else is a module you can turn on only when your practice actually needs it.</p>
          </div>

          {/* Foundation — always included */}
          <div className="bg-neutral-900 text-white rounded-3xl p-8 md:p-10 mb-8">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /></svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold">Foundation</h3>
                  <span className="bg-brand-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">Always included</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  Students, guardians &amp; payers, teaching locations, lesson types and your teaching agreement — plus Quick Invoice, payment tracking and the parent portal. This never sits behind a toggle: it&apos;s what makes every module below actually connect to the same students and the same records, instead of feeling like separate apps bolted together.
                </p>
              </div>
            </div>
          </div>

          {/* The 8 modules */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Scheduling &amp; Timetable</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Build a timetable in bulk or lesson by lesson, block off unavailable time, run a waitlist and check journey times between venues.</p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s4.332.477 5.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Curriculum &amp; Content</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Reusable curriculum plans, section-by-section progress a family can actually see, shared resources and assignments — or sell your own video courses.</p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Compliance &amp; Safety</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Cancellation and no-show policies per location. Certifications, incident logs and safeguarding records are always free and included — never a toggle, on any plan.</p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 11-16 0 8 8 0 0116 0zM12 8v4l3 2" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Term Calendars</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Term and holiday dates per location, so bulk timetabling automatically skips the weeks you&apos;re not teaching.</p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2-5.24" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Group Teaching</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Run group classes alongside your one-to-one work, plan sessions in advance, and track loaned equipment and maintenance.</p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Commerce Add-ons</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Sell chargeable extras like equipment hire, issue gift cards and run promo codes alongside your regular billing.</p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Embeds &amp; Booking Widget</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">A booking form you can drop straight into your own website or bio link, so new enquiries land directly in your dashboard.</p>
            </div>

            <div className="p-6 rounded-2xl border-2 border-brand-500 bg-brand-50 relative">
              <span className="absolute -top-3 left-5 bg-brand-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">For growing teams</span>
              <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2-5.24" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">Organisation</h3>
              <p className="text-sm text-neutral-700 leading-relaxed">Bring other instructors onto your account and log cover between you — for the day it stops being just you.</p>
            </div>
          </div>

          <p className="text-center text-sm text-neutral-500 mt-10 max-w-2xl mx-auto">
            Safety-related records — certifications, incident logs and safeguarding notes — are never gated behind a paid module, on any plan, under any circumstances.
          </p>
        </div>
      </section>

      {/* 2. A calmer week snapshot */}
      <section className="py-24 bg-neutral-50 border-y border-neutral-200/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">A calmer week of teaching</h2>
              <p className="text-lg text-neutral-600 leading-relaxed mb-8">
                Learnio is designed around the small operational moments that pile up: checking today&apos;s schedule, finding a parent contact, recording attendance, creating an invoice and keeping a clean record for later.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-neutral-900 font-medium">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <p>Open today&apos;s lessons with times, venues and contact details</p>
                </div>
                <div className="flex items-center gap-4 text-neutral-900 font-medium">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <p>Record notes, attendance, cancellations and make-up credits as you go</p>
                </div>
                <div className="flex items-center gap-4 text-neutral-900 font-medium">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <p>Send a clear invoice PDF and keep the payment status visible</p>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full max-w-sm">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100 relative">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNlNThhNjMiLz48L3N2Zz4=')] opacity-50 z-0"></div>
                <div className="relative z-10 space-y-6">
                  <h3 className="font-bold text-xl text-center border-b border-neutral-100 pb-4">Practice Snapshot</h3>
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>Lessons today</span>
                    <span>4</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>Locations</span>
                    <span>2</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>Follow-ups</span>
                    <span>3</span>
                  </div>
                  <div className="h-px bg-neutral-100 w-full" />
                  <div className="flex justify-between items-center font-bold text-neutral-900">
                    <span>Invoices</span>
                    <span>1 ready</span>
                  </div>
                  <div className="bg-brand-50 rounded-xl p-4 text-center mt-4">
                    <p className="text-sm text-brand-600 font-semibold mb-1">Next action</p>
                    <p className="text-4xl font-extrabold text-brand-700">Ready</p>
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
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">Add the real shape of your practice once, then use Learnio as the working hub for lessons, records, admin and payments.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-900 font-bold text-xl flex items-center justify-center mb-6">1</div>
              <h3 className="font-semibold text-lg mb-2">Set up your practice</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Add lesson types, locations, rooms, term dates and the way you normally teach.</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-900 font-bold text-xl flex items-center justify-center mb-6">2</div>
              <h3 className="font-semibold text-lg mb-2">Add students and payers</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Keep student records, guardian contacts, payer links and teaching details together.</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-900 font-bold text-xl flex items-center justify-center mb-6">3</div>
              <h3 className="font-semibold text-lg mb-2">Run the week</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Use the dashboard for lessons, notes, attendance, resources, requests and schedule changes.</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-bold text-xl flex items-center justify-center mb-6">4</div>
              <h3 className="font-semibold text-lg mb-2">Invoice and track</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Create PDF invoices, open your default email app, record payments and see what is outstanding.</p>
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
            <p className="text-lg text-neutral-600">The essentials for a self-employed teaching or coaching practice: clients, payers, lessons, locations, records and money, ready to use now.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="p-7 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-card transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2-5.24" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 mb-2">Clients &amp; payers in one place</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Keep learners, guardians and payers together, with notes and contact details where you need them.</p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-card transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 mb-2">Locations &amp; term calendars</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Set up teaching locations, rooms and term calendars - schools, home visits, your studio or online.</p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-card transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 mb-2">Invoice &amp; statement PDFs</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Create quick invoice PDFs for upcoming or attended lessons, then send them through your default email app.</p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-card transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 12h.01M18 12h.01" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 mb-2">Record payments</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Record what has been paid, spot partial or overdue invoices and keep balances understandable.</p>
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
              <h3 className="font-semibold text-lg text-neutral-900 mb-2">Forecasts &amp; CSV export</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">See expected, received and outstanding income, then export records for your accountant.</p>
            </div>

          </div>
        </div>
      </section>

      {/* 3c. Solutions - outcome-framed lead-in to the dashboard */}
      <section className="py-24 bg-white border-t border-neutral-200/50" id="solutions">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-700 text-xs font-bold tracking-wider uppercase mb-4">Solutions</span>
            <h2 className="text-3xl md:text-4xl font-bold">One workspace for the whole practice</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10 text-left">
            <div>
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l4-4 3 3 5-6" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Know what is happening today</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Start from the live day view: lessons, locations, contacts, notes and actions in one place.</p>
            </div>
            <div>
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Keep lesson records connected</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Attendance, cancellations, make-up credits, resources and invoices stay attached to the right student.</p>
            </div>
            <div>
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16M4 12h10M4 19h7" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Still clear on the money</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Clients, sessions, locations, notes, invoices and income, organised together instead of scattered across tabs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Real product screenshot section */}
      <section className="py-24 bg-neutral-900 text-white overflow-hidden" id="dashboard">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">A dashboard that makes sense</h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-16">
            No cluttered spreadsheets. Just clear views of your schedule, students, teaching records, invoices and follow-ups.
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
                      {[["Amelia Carter - 30 min", "09:00"], ["Oliver James - 45 min", "10:30"], ["Priya Shah - 30 min", "16:00"], ["Group class - 6 in", "17:30"]].map(([label, time], i) => (
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
                      <div className="text-[11px] text-neutral-400 mt-2">&pound;2,080 of &pound;2,880 received</div>
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
            <p className="text-neutral-500 text-xs mt-4">Illustrative dashboard - figures are examples.</p>

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
                Generic admin tools do not understand lessons, terms, venues, guardians, make-up credits, shared resources or the way teaching work moves between places. Learnio does.
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed mb-8">
                Learnio is built from the ground up for peripatetic teachers, private studio and gym owners, tutors, personal trainers and online instructors who need a system tailored to their workflow.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-neutral-800 font-medium">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Work across multiple locations - schools, studios, homes or online
                </li>
                <li className="flex items-center gap-3 text-neutral-800 font-medium">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Handle families, siblings, groups and payer contacts in one place
                </li>
                <li className="flex items-center gap-3 text-neutral-800 font-medium">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Keep schedules, lesson records, resources, invoices and balances easy to find
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full bg-neutral-50 rounded-3xl p-8 border border-neutral-200">
              <blockquote className="text-xl font-medium leading-relaxed text-neutral-900 mb-6 italic">
                &ldquo;Before Learnio, my week lived across a paper diary, a notes app, bank transfers and messages from parents. Now I can see who I&apos;m teaching, what happened last time, what needs sending and what has been paid.&rdquo;
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
              title="Online card payments"
              description="A Stripe link is already included on every invoice — full in-app checkout (cards saved on file, auto-charging) is next."
              initialVotes={412}
            />
            <FeatureVote
              title="Automated payment reminders"
              description="Gentle automatic nudges to clients when a payment is due or overdue, on top of the manual reminders available today."
              initialVotes={389}
            />
            <FeatureVote
              title="Google & Outlook calendar sync"
              description="Two-way sync with the calendar you already use. Individual session calendar files work today."
              initialVotes={301}
            />
            <FeatureVote
              title="WhatsApp messaging"
              description="Send invoices and updates over WhatsApp as well as email."
              initialVotes={187}
            />
            <FeatureVote
              title="Video call auto-scheduling"
              description="Auto-create a Zoom/Meet link when you book an online lesson. Adding your own meeting link works today."
              initialVotes={134}
            />
            <FeatureVote
              title="Multi-currency support"
              description="Bill in a currency other than GBP for teachers working with international families."
              initialVotes={68}
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
              <h3 className="text-xl font-semibold mb-2">Is Learnio only for payment plans?</h3>
              <p className="text-neutral-600 leading-relaxed">No. Learnio supports practical payment tracking, but the product is broader: timetables, students, payers, locations, attendance, lesson notes, resources, invoices and admin workflows.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Can I still use my normal email and bank transfer process?</h3>
              <p className="text-neutral-600 leading-relaxed">Yes. Quick Invoice opens PDF invoices and can launch your default email app with the message prepared. You can record bank-transfer payments manually and keep the status visible.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Does it work for schools, homes, studios and online lessons?</h3>
              <p className="text-neutral-600 leading-relaxed">Yes. Learnio is built for mixed teaching patterns: school timetables, private students, home visits, hired venues, studios, online lessons and small groups.</p>
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
            <p className="text-lg text-neutral-600">Start free for two weeks - no card required. Prices below are illustrative for the trial.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">

            {/* Solo */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8">
              <h3 className="text-lg font-bold mb-1">Solo</h3>
              <p className="text-sm text-neutral-500 mb-5">For a teacher just getting started.</p>
              <div className="text-4xl font-extrabold tracking-tight mb-5">&pound;9<span className="text-base font-semibold text-neutral-400">/mo</span></div>
              <Link href="/register" className="block text-center w-full py-3 rounded-xl font-semibold text-sm mb-6 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors">Start free trial</Link>
              <ul className="space-y-3">
                {["Foundation: students, payers & locations", "Quick Invoice, PDFs & payment tracking", "Scheduling & Timetable module", "Certifications & safeguarding, always free"].map((f) => (
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
              <div className="text-4xl font-extrabold tracking-tight mb-5">&pound;19<span className="text-base font-semibold text-white/75">/mo</span></div>
              <Link href="/register" className="block text-center w-full py-3 rounded-xl font-semibold text-sm mb-6 bg-white text-brand-600 hover:bg-neutral-50 transition-colors">Start free trial</Link>
              <ul className="space-y-3">
                {["Everything in Solo", "Term Calendars & Curriculum modules", "Compliance policies & Commerce add-ons", "Embeds, booking widget & Group Teaching"].map((f) => (
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
              <div className="text-4xl font-extrabold tracking-tight mb-5">&pound;39<span className="text-base font-semibold text-neutral-400">/mo</span></div>
              <Link href="/register" className="block text-center w-full py-3 rounded-xl font-semibold text-sm mb-6 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors">Talk to us</Link>
              <ul className="space-y-3">
                {["Everything in Studio", "Organisation module: invite instructors", "Cover assignments between accounts", "Priority support"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-neutral-600">
                    <svg className="w-4 h-4 text-brand-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

          </div>
          <p className="text-center text-sm text-neutral-500 mt-8 max-w-2xl mx-auto">Every plan includes the Foundation and Quick Invoice with no extra charge — you&apos;re only ever paying for the modules your practice actually uses. Certifications, incident logs and safeguarding records are always free, on every plan, with no exceptions.</p>
        </div>
      </section>

      {/* 7. Final two-week trial call to action */}
      <section className="py-24 bg-brand-600 text-white text-center" id="get-started">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to run your practice from one place?</h2>
          <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
            Join independent teachers, tutors, instructors and coaches replacing scattered admin with one practical workspace. Try Learnio completely free for 14 days.
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
