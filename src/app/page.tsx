import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  TeachingNoteCard,
  SmoothPaymentCard,
  NextLessonCard,
  MonthlyOverviewCard,
} from "@/components/landing/floating-cards";
import { FeatureVote } from "@/components/landing/feature-vote";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export default function LandingPage() {
  return (
    <div className={`${jakarta.variable} font-jakarta bg-neutral-50 min-h-screen text-neutral-900 overflow-x-hidden selection:bg-brand-200 selection:text-brand-900`}>
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 bg-neutral-50/80 backdrop-blur-md z-50 border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">L</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Learnio</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-neutral-600">
            <Link href="#how-it-works" className="hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">How it works</Link>
            <Link href="#features" className="hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">Features</Link>
            <Link href="#for-teachers" className="hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">For teachers</Link>
            <Link href="#pricing" className="hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">Pricing</Link>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/api/auth/signin" className="hidden sm:block text-neutral-600 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">
              Sign in
            </Link>
            <Link href="/signup" className="px-5 py-2.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50">
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
            Learnio turns lesson schedules, term dates and tuition fees into clear monthly
            payment plans, professional invoices and simple income tracking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-full text-lg font-semibold hover:bg-brand-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50">
              Start your free two-week trial
            </Link>
            <p className="text-sm text-neutral-500 sm:ml-4 text-center sm:text-left">
              No card required.<br />Designed for independent music teachers.
            </p>
          </div>
        </div>

        {/* Floating Cards (Hidden on mobile for layout sanity, visible md+) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
          <TeachingNoteCard className="top-32 left-8 xl:left-24" />
          <SmoothPaymentCard className="bottom-12 left-16 xl:left-32 rotate-3" />
          <NextLessonCard className="top-40 right-16 xl:right-32 -rotate-2" />
          <MonthlyOverviewCard className="bottom-20 right-12 xl:right-24 rotate-1" />
        </div>
      </section>

      {/* 1. The problem with term-based teaching income */}
      <section className="py-24 bg-white" id="problem">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">The rollercoaster of term-based income</h2>
          <p className="text-lg text-neutral-600 leading-relaxed mb-12">
            You teach consistently, but you don't get paid consistently. September brings a flood of payments, followed by months of chasing invoices. Summer holidays mean zero income. It's stressful, unpredictable, and makes financial planning impossible.
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
              <p className="text-sm text-neutral-600">Hours wasted every term manually emailing parents to remind them about overdue invoices.</p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Admin Overload</h3>
              <p className="text-sm text-neutral-600">Complex spreadsheets trying to track who has paid for which term and who hasn't.</p>
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
                By taking the total cost of a year's tuition and dividing it into equal monthly payments, parents get a predictable bill, and you get a steady salary — even in August.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-neutral-900 font-medium">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <p>Calculate annual lessons (e.g. 39 weeks)</p>
                </div>
                <div className="flex items-center gap-4 text-neutral-900 font-medium">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <p>Multiply by lesson rate (e.g. £25) = £975/year</p>
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
                    <span>39 lessons × £25</span>
                    <span>£975</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>Sheet music budget</span>
                    <span>£25</span>
                  </div>
                  <div className="h-px bg-neutral-100 w-full" />
                  <div className="flex justify-between items-center font-bold text-neutral-900">
                    <span>Annual Total</span>
                    <span>£1,000</span>
                  </div>
                  <div className="bg-brand-50 rounded-xl p-4 text-center mt-4">
                    <p className="text-sm text-brand-600 font-semibold mb-1">Monthly Direct Debit</p>
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
              <p className="text-neutral-600 text-sm leading-relaxed">Define your teaching weeks for the academic year and set your lesson rates.</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-900 font-bold text-xl flex items-center justify-center mb-6">2</div>
              <h3 className="font-semibold text-lg mb-2">Add your students</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Log their lesson duration, frequency, and whether they need instrument hire.</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-900 font-bold text-xl flex items-center justify-center mb-6">3</div>
              <h3 className="font-semibold text-lg mb-2">Auto-calculate</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Learnio instantly generates fair, equal monthly payment schedules for every family.</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-bold text-xl flex items-center justify-center mb-6">4</div>
              <h3 className="font-semibold text-lg mb-2">Send & track</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Send professional invoices and track who has paid directly from your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Real product screenshot section */}
      <section className="py-24 bg-neutral-900 text-white overflow-hidden" id="features">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">A dashboard that makes sense</h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-16">
            No cluttered spreadsheets. Just clear insights into your schedule, your students, and your income.
          </p>
          
          <div className="relative mx-auto max-w-5xl">
            {/* Framed browser-like UI for screenshot */}
            <div className="rounded-xl overflow-hidden border border-neutral-700 bg-neutral-800 shadow-2xl">
              <div className="h-8 bg-neutral-800 border-b border-neutral-700 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-neutral-600"></div>
                <div className="w-3 h-3 rounded-full bg-neutral-600"></div>
                <div className="w-3 h-3 rounded-full bg-neutral-600"></div>
              </div>
              <div className="aspect-[16/9] bg-neutral-100 flex items-center justify-center relative">
                {/* Placeholder for the real dashboard screenshot */}
                <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center flex-col text-neutral-400">
                  <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="font-medium">[ Real Application Screenshot to be inserted here ]</p>
                </div>
              </div>
            </div>
            
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Designed exclusively for music educators</h2>
              <p className="text-lg text-neutral-600 leading-relaxed mb-6">
                Generic invoicing software doesn't understand academic years, term dates, or half-hour weekly piano lessons. We do.
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed mb-8">
                Learnio is built from the ground up for peripatetic teachers, private studio owners, and online tutors who need a system tailored to their specific workflow.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-neutral-800 font-medium">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Support for multiple teaching locations
                </li>
                <li className="flex items-center gap-3 text-neutral-800 font-medium">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Handle siblings and joint billing automatically
                </li>
                <li className="flex items-center gap-3 text-neutral-800 font-medium">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Microsite access for parents to view schedules
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full bg-neutral-50 rounded-3xl p-8 border border-neutral-200">
              <blockquote className="text-xl font-medium leading-relaxed text-neutral-900 mb-6 italic">
                "Before Learnio, I spent the first two weeks of every term wrestling with spreadsheets and chasing parents for fees. Now everything is smoothed into monthly payments. My parents love it, and I actually have a predictable income."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-300 rounded-full overflow-hidden">
                  {/* Placeholder for avatar */}
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">Sarah Jenkins</div>
                  <div className="text-sm text-neutral-600">Piano & Theory Teacher, 42 students</div>
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
            <p className="text-lg text-neutral-600">Vote on the features you want us to build next. We're actively developing based on community feedback.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureVote 
              title="Automated Direct Debit Integration" 
              description="Connect to GoCardless or Stripe to automatically collect monthly payments without manual tracking."
              initialVotes={342}
            />
            <FeatureVote 
              title="Repertoire Tracking" 
              description="Keep logs of pieces, scales, and exercises assigned to each student week by week."
              initialVotes={218}
            />
            <FeatureVote 
              title="Exam Board Syllabuses" 
              description="Built-in ABRSM, Trinity, and LCM grade requirements and tracking."
              initialVotes={185}
            />
            <FeatureVote 
              title="Expense & Mileage Tracking" 
              description="Log your sheet music purchases, travel costs, and instrument repairs for easy tax returns."
              initialVotes={412}
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
              <h3 className="text-xl font-semibold mb-2">Can parents still pay termly if they prefer?</h3>
              <p className="text-neutral-600 leading-relaxed">Yes. While Learnio is built to smooth payments monthly, you can override this for specific families who prefer to pay for the entire term or year upfront.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Does Learnio collect the payments?</h3>
              <p className="text-neutral-600 leading-relaxed">Currently, Learnio generates the payment schedules, invoices, and tracking. You still receive payments via your normal bank transfer method. (Automated payment collection is our most upvoted roadmap feature!)</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">What if a student starts mid-year?</h3>
              <p className="text-neutral-600 leading-relaxed">Learnio automatically prorates the calculation based on their start date and the remaining lessons in your academic year.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Is there a contract?</h3>
              <p className="text-neutral-600 leading-relaxed">No. You can cancel your subscription at any time. You can also export all your student and billing data whenever you need it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final two-week trial call to action */}
      <section className="py-24 bg-brand-600 text-white text-center" id="pricing">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to smooth out your income?</h2>
          <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of music teachers taking the stress out of termly billing. Try Learnio completely free for 14 days.
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
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-6 h-6 rounded bg-neutral-700 flex items-center justify-center">
              <span className="text-white font-bold text-xs leading-none">L</span>
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Learnio</span>
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
