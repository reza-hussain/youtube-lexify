import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Youtube Lexify',
  description: 'Terms of service for the Youtube Lexify Chrome extension and web dashboard.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FB] font-sans antialiased">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Lexify" className="w-8 h-8 rounded-[10px] shadow-sm shadow-blue-500/30" />
          <span className="text-slate-800 font-bold text-[15px] tracking-tight">Youtube Lexify</span>
        </Link>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
          ← Back to home
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-2">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-12">Last updated: July 2025</p>

        <div className="flex flex-col gap-10 text-slate-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Acceptance of Terms</h2>
            <p>
              By installing the Youtube Lexify Chrome extension or using the web dashboard at
              youtubelexify.com (collectively, the &ldquo;Service&rdquo;), you agree to be bound by
              these Terms of Service. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. Description of Service</h2>
            <p>
              Youtube Lexify provides a Chrome extension that displays AI-powered word definitions
              when hovering over YouTube subtitle words, and a web dashboard where users can review,
              manage, and export their saved vocabulary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. User Accounts</h2>
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-700 mb-1">Account creation</h3>
                <p className="text-sm">
                  You may sign in using Google OAuth. You are responsible for maintaining the
                  security of your account. You must be at least 13 years old to use the Service.
                </p>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-700 mb-1">Account termination</h3>
                <p className="text-sm">
                  We reserve the right to suspend or terminate accounts that violate these terms,
                  abuse the Service, or engage in fraudulent activity. You may delete your account
                  at any time by contacting us.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Free and Pro Plans</h2>
            <p className="mb-4">
              The Service is offered on a freemium basis. Free users receive a limited number of
              daily word lookups. Pro users receive unlimited lookups and access to additional
              AI features.
            </p>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-700 mb-1">Billing and refunds</h3>
              <p className="text-sm">
                Pro subscriptions are billed monthly or annually. All payments are processed
                securely via Stripe or Razorpay. Refunds are handled on a case-by-case basis —
                contact us within 7 days of a charge if you believe a refund is warranted.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc list-inside flex flex-col gap-2 text-sm ml-2">
              <li>Reverse-engineer, scrape, or copy the Service for a competing product</li>
              <li>Attempt to bypass usage limits or access controls</li>
              <li>Use the Service to transmit harmful, illegal, or misleading content</li>
              <li>Interfere with the security or integrity of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">6. Intellectual Property</h2>
            <p>
              All content, branding, and software comprising the Service are owned by Youtube
              Lexify. Your saved vocabulary data belongs to you — you can export it at any time
              from the dashboard. We do not claim ownership over any content you generate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">7. Third-Party Services</h2>
            <p>
              The Service integrates with Google OAuth, YouTube (for subtitle processing),
              Anthropic / Google Gemini (for AI definitions), and payment processors. Your use
              of those services is governed by their respective terms and privacy policies. We
              are not affiliated with or endorsed by YouTube or Google.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">8. Disclaimers</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind. AI-generated
              definitions may occasionally be inaccurate. We do not guarantee uninterrupted
              availability. Dictionary data is sourced from third-party APIs and may vary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Youtube Lexify shall not be liable for
              any indirect, incidental, or consequential damages arising from your use of the
              Service. Our total liability for any claim shall not exceed the amount you paid
              us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">10. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the Service after
              changes constitutes acceptance of the new terms. We will notify users of material
              changes via email where possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">11. Contact</h2>
            <p>
              For questions about these terms, please contact us at{' '}
              <a href="mailto:hi@youtubelexify.com" className="text-blue-500 hover:text-blue-700 transition-colors">
                hi@youtubelexify.com
              </a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-slate-200/60 py-8 px-6 mt-16">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} Youtube Lexify. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-700 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
