import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Lexify',
  description: 'Privacy policy for the Lexify Chrome extension and web dashboard.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FB] font-sans antialiased">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-linear-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm shadow-blue-500/30">
            <span className="text-white text-sm font-bold">L</span>
          </div>
          <span className="text-slate-800 font-bold text-[15px] tracking-tight">Lexify</span>
        </Link>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
          ← Back to home
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-12">Last updated: June 2025</p>

        <div className="flex flex-col gap-10 text-slate-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Overview</h2>
            <p>
              Lexify (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) provides a Chrome extension and web dashboard that
              helps users look up definitions of words in YouTube subtitles and build a personal
              vocabulary. This policy explains what data we collect, why we collect it, and how
              it is used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. Data We Collect</h2>
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-700 mb-1">Account information</h3>
                <p className="text-sm">
                  When you sign up, we collect your name and email address — either directly or
                  via Google OAuth. This is used to create and identify your account.
                </p>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-700 mb-1">Authentication tokens</h3>
                <p className="text-sm">
                  We store a JSON Web Token (JWT) locally in your browser to keep you signed in.
                  Google OAuth credentials are handled by Google and never stored on our servers.
                </p>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-700 mb-1">Words and context sentences</h3>
                <p className="text-sm">
                  When you hover over a subtitle word, that word and the surrounding sentence are
                  sent to our API to generate a contextual definition. Both are saved to your
                  personal vocabulary so you can review them later.
                </p>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-700 mb-1">Video metadata</h3>
                <p className="text-sm">
                  The YouTube video URL and timestamp of each word lookup are saved alongside
                  the word so you can return to the exact moment in the video.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. How We Use Your Data</h2>
            <ul className="flex flex-col gap-2 text-sm list-none">
              {[
                'To provide word definitions tailored to the context in which the word appeared.',
                'To save your vocabulary and make it available on your dashboard.',
                'To authenticate you and secure your account.',
                'To track your daily lookup quota (free tier) and subscription status.',
                'To send transactional emails (account creation, subscription events).',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Third-Party Services</h2>
            <p className="text-sm mb-4">We share data with the following third parties only as needed to operate the service:</p>
            <div className="flex flex-col gap-3 text-sm">
              {[
                { name: 'Google OAuth', use: 'Sign-in authentication. Governed by Google\'s Privacy Policy.' },
                { name: 'Google Gemini AI', use: 'Generating contextual word definitions. Only the word and context sentence are sent.' },
                { name: 'Anthropic Claude', use: 'Alternative AI provider for word definitions. Only the word and context sentence are sent.' },
                { name: 'Resend', use: 'Sending transactional emails. Your email address is shared only for email delivery.' },
                { name: 'Supabase', use: 'Database hosting. Your account data and vocabulary are stored here.' },
              ].map(({ name, use }) => (
                <div key={name} className="flex gap-3 bg-white border border-slate-200/60 rounded-xl px-4 py-3">
                  <span className="font-semibold text-slate-700 min-w-[140px]">{name}</span>
                  <span className="text-slate-500">{use}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. Data Retention</h2>
            <p className="text-sm">
              Your vocabulary and account data are retained for as long as your account is active.
              You can delete individual words from your dashboard at any time. To request full
              account deletion, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">6. Data We Do Not Collect</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {[
                'We do not record your browsing history or track any websites outside of YouTube.',
                'We do not collect financial information — payments are handled entirely by Razorpay.',
                'We do not sell or transfer your data to any third party for advertising or unrelated purposes.',
                'We do not use your data to determine creditworthiness or for lending purposes.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">7. Security</h2>
            <p className="text-sm">
              All data is transmitted over HTTPS. Authentication is handled via JWT tokens and
              Google OAuth. We do not store plain-text passwords — passwords are hashed before
              storage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">8. Children&apos;s Privacy</h2>
            <p className="text-sm">
              Lexify is not directed at children under 13. We do not knowingly collect personal
              information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">9. Changes to This Policy</h2>
            <p className="text-sm">
              We may update this policy from time to time. The date at the top of this page will
              reflect the most recent revision. Continued use of the extension after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">10. Contact</h2>
            <p className="text-sm">
              For privacy-related questions or data deletion requests, contact us at{' '}
              <a
                href="mailto:hi@youtubelexify.com"
                className="text-blue-500 hover:text-blue-700 transition-colors"
              >
                hi@youtubelexify.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200/60 py-8 px-6 mt-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-sm text-slate-400">
          <span>© {new Date().getFullYear()} Lexify</span>
          <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
