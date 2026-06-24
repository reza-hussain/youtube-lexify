import Link from 'next/link';
import { BookOpen, Zap, Download, Brain, Star, ArrowRight, Check } from 'lucide-react';

export const metadata = {
  title: 'Lexify — Grow your vocab as you watch.',
  description:
    'AI-powered definitions for every YouTube subtitle word. Hover to define, auto-save vocabulary, and export to Anki.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FB] font-sans antialiased">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2">
        <nav className="max-w-5xl mx-auto flex items-center justify-between bg-white/85 backdrop-blur-2xl border border-slate-200/70 rounded-2xl px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.8)_inset]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-linear-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm shadow-blue-500/30">
              <span className="text-white text-sm font-bold tracking-tight">L</span>
            </div>
            <span className="text-slate-800 font-bold text-[15px] tracking-tight">Lexify</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <a
              href="#features"
              className="text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 px-3.5 py-1.5 rounded-lg transition-all"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 px-3.5 py-1.5 rounded-lg transition-all"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 px-3.5 py-1.5 rounded-lg transition-all"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-[13px] font-bold text-white bg-linear-to-r from-blue-500 to-cyan-500 px-4 py-1.5 rounded-lg shadow-[0_2px_8px_rgba(77,163,255,0.4)] hover:shadow-[0_4px_16px_rgba(77,163,255,0.5)] hover:scale-[1.03] transition-all"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero — starts at top-0, navbar floats over it */}
      <section className="relative overflow-hidden bg-[#0F172A] text-white pt-20">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px]" />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-cyan-300 mb-8">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            AI-powered Chrome Extension
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6 max-w-4xl">
            Grow your vocab{' '}
            <span className="bg-gradient-to-r from-[#4DA3FF] to-[#38F2FF] bg-clip-text text-transparent">
              as you watch.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
            Hover any word in YouTube subtitles to get an instant AI-powered definition — in
            context, with no pausing required. Build your vocabulary while you watch.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/login"
              className="group flex items-center gap-2 bg-gradient-to-r from-[#4DA3FF] to-[#38F2FF] text-white font-bold px-8 py-4 rounded-2xl shadow-[0_0_40px_rgba(77,163,255,0.3)] hover:shadow-[0_0_60px_rgba(77,163,255,0.5)] hover:scale-[1.02] transition-all text-base"
            >
              Get Started
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Hero visual — YouTube player mockup */}
          <div className="relative mt-20 w-full max-w-4xl mx-auto">
            <div className="rounded-[18px] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.6)] overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 mx-3 bg-[#2a2a2a] border border-white/[0.08] rounded-md px-3 py-1 text-[11px] text-slate-500 text-left">
                  youtube.com/watch?v=dQw4w9WgXcQ
                </div>
              </div>

              {/* YouTube player */}
              <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>

                {/* Fake video scene — lecture / documentary feel */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a2744] via-[#0d1929] to-[#000d1a]" />
                  {/* Ambient colour blobs suggesting real video content */}
                  <div className="absolute top-4 left-8 w-48 h-32 bg-blue-700/20 rounded-full blur-[40px]" />
                  <div className="absolute bottom-16 right-12 w-36 h-24 bg-indigo-600/15 rounded-full blur-[30px]" />
                  {/* Silhouette of a presenter */}
                  <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-25">
                    <div className="w-10 h-10 rounded-full bg-slate-300 mb-1" />
                    <div className="w-20 h-24 rounded-t-[50%] bg-slate-400" />
                  </div>
                  {/* Slide / whiteboard on the right */}
                  <div className="absolute top-6 right-10 w-40 h-28 bg-white/5 border border-white/10 rounded-lg flex flex-col gap-1.5 p-3 opacity-40">
                    <div className="h-1.5 bg-white/40 rounded w-3/4" />
                    <div className="h-1.5 bg-white/20 rounded w-1/2" />
                    <div className="h-1.5 bg-white/20 rounded w-2/3 mt-1" />
                    <div className="h-1.5 bg-white/20 rounded w-1/2" />
                  </div>
                </div>

                {/* Lexify popup — top-right corner */}
                <div className="absolute top-4 right-4 w-64 z-20">
                  <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-white/[0.07]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-linear-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
                          <span className="text-white text-[9px] font-bold">L</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400 tracking-wide">Lexify</span>
                      </div>
                      <span className="text-[10px] font-bold text-violet-300 bg-violet-500/15 border border-violet-500/20 px-2 py-0.5 rounded-full">✦ AI</span>
                    </div>

                    {/* Word + pos */}
                    <div className="px-4 pt-3 pb-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-white font-bold text-base tracking-tight">serendipity</span>
                        <span className="text-[10px] text-slate-500 italic">noun</span>
                      </div>
                    </div>

                    {/* Definition */}
                    <div className="px-4 pb-3">
                      <p className="text-[12px] text-slate-300 leading-[1.6]">
                        The occurrence of fortunate events by chance — finding something good without looking for it.
                      </p>
                    </div>

                    {/* Context sentence */}
                    <div className="mx-3 mb-3 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2">
                      <p className="text-[10px] text-slate-500 italic leading-relaxed">
                        &ldquo;The concept of <span className="text-[#A5CFFF] not-italic">serendipity</span> is fascinating.&rdquo;
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 pb-3.5">
                      <span className="text-[10px] text-slate-600">encountered 1×</span>
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Saved
                      </span>
                    </div>
                  </div>
                </div>

                {/* YouTube bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 z-10">
                  {/* Gradient fade */}
                  <div className="h-16 bg-gradient-to-t from-black/80 to-transparent" />

                  {/* CC Subtitles */}
                  <div className="flex justify-center pb-8">
                    <div className="inline-flex items-center gap-1.5 bg-black/75 backdrop-blur-sm px-3.5 py-1.5 rounded-md text-white text-sm font-medium">
                      <span className="text-slate-300">The concept of</span>
                      {/* Hovered word */}
                      <span className="relative inline-flex items-end gap-0.5">
                        <span className="bg-[#4DA3FF]/25 border border-[#4DA3FF]/50 rounded px-1.5 py-0.5 text-[#A5CFFF]">
                          serendipity
                        </span>
                        {/* Mouse cursor */}
                        <svg className="absolute -bottom-1 -right-3 w-4 h-4 drop-shadow-lg" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 1L13 8.5L8.5 9.5L11 14L9 15L6.5 10L3 13V1Z" fill="white" stroke="#0f172a" strokeWidth="0.8"/>
                        </svg>
                      </span>
                      <span className="text-slate-300">is fascinating.</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-4 pb-2">
                    <div className="h-[3px] bg-white/20 rounded-full">
                      <div className="h-full bg-red-500 rounded-full w-[38%] relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-md" />
                      </div>
                    </div>
                  </div>

                  {/* Control bar */}
                  <div className="flex items-center justify-between px-4 pb-3 text-white/70">
                    <div className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>
                      <span className="text-[11px] font-medium text-white/60">12:34 / 45:21</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="opacity-80"><rect x="2" y="7" width="20" height="10" rx="1"/><rect x="5" y="10" width="14" height="4" rx="0.5" fill="#0f172a"/></svg>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow under mockup */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-blue-500/20 blur-[50px] rounded-full" />
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="bg-slate-100/80 border-y border-slate-200/60 py-5">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <Star size={15} className="text-yellow-400 fill-yellow-400" />
            <span>Built for language learners</span>
          </div>
          {/* <div className="flex items-center gap-2 font-medium">
            <Brain size={15} className="text-violet-500" />
            <span>Powered by Gemini AI</span>
          </div> */}
          <div className="flex items-center gap-2 font-medium">
            <BookOpen size={15} className="text-blue-500" />
            <span>Works on any YouTube video</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <Download size={15} className="text-cyan-600" />
            <span>Export to Anki, CSV, JSON</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-3">
              Features
            </p>
            <h2 className="text-4xl font-bold text-slate-800 tracking-tight mb-4">
              Everything you need to master vocabulary
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              One extension. Zero friction. Learn words in the exact context you heard them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(77,163,255,0.1)] hover:border-blue-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20 mb-5">
                <Zap size={22} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Hover to Define</h3>
              <p className="text-slate-500 leading-relaxed">
                Simply hover any highlighted subtitle word and an instant definition card appears —
                no clicking, no tab switching, no interruptions.
              </p>
            </div>

            <div className="group bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(168,85,247,0.1)] hover:border-violet-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-purple-400 flex items-center justify-center shadow-md shadow-violet-500/20 mb-5">
                <Brain size={22} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">AI-Powered Context</h3>
              <p className="text-slate-500 leading-relaxed">
                Gemini AI understands what the word means in that exact sentence — so definitions
                are precise, contextual, and actually useful.
              </p>
            </div>

            <div className="group bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(20,184,166,0.1)] hover:border-teal-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-500/20 mb-5">
                <BookOpen size={22} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Auto Vocabulary Tracker</h3>
              <p className="text-slate-500 leading-relaxed">
                Every word you look up is automatically saved to your personal vocabulary dashboard,
                along with the video timestamp and sentence context.
              </p>
            </div>

            <div className="group bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(245,158,11,0.08)] hover:border-amber-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-md shadow-amber-500/20 mb-5">
                <Download size={22} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Export Anywhere</h3>
              <p className="text-slate-500 leading-relaxed">
                Export your full vocabulary as Anki flashcards, CSV, or JSON with one click. Study
                on any device, any time — your words, your way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="py-24 px-6 bg-[#0F172A] text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-4xl font-bold tracking-tight mb-16">Three steps to fluency</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                icon: <Download size={24} />,
                color: 'from-blue-500 to-cyan-400',
                glow: 'shadow-blue-500/30',
                title: 'Install the Extension',
                desc: 'Add Lexify to Chrome in seconds. Sign up for free — no credit card needed.',
              },
              {
                step: '02',
                icon: <PlayCircle size={24} />,
                color: 'from-violet-500 to-purple-400',
                glow: 'shadow-violet-500/30',
                title: 'Open Any YouTube Video',
                desc: 'Enable subtitles and start watching. Lexify automatically highlights words as they appear.',
              },
              {
                step: '03',
                icon: <Zap size={24} />,
                color: 'from-cyan-500 to-teal-400',
                glow: 'shadow-cyan-500/30',
                title: 'Hover to Learn',
                desc: 'Hover any word to see an AI-powered definition. The word is instantly saved to your vocabulary.',
              },
            ].map(({ step, icon, color, glow, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${color} flex items-center justify-center shadow-lg ${glow} mb-5 text-white`}
                >
                  {icon}
                </div>
                <div className="text-xs font-bold text-slate-600 tracking-widest mb-2">{step}</div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-6 bg-[#F7F9FB]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-4xl font-bold text-slate-800 tracking-tight mb-4">Start free. Upgrade when ready.</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              The free tier lets you define 30 words a day. Upgrade to Pro for unlimited lookups and full vocabulary history.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free */}
            <div className="bg-white border border-slate-200/60 rounded-[28px] p-8 flex flex-col shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-1">Free</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-slate-800">$0</span>
                <span className="text-slate-400 font-medium">forever</span>
              </div>
              <ul className="flex flex-col gap-3 flex-1 mb-8">
                {['30 lookups/day', 'Last 50 words in history', 'Standard dictionary definitions', 'Basic dashboard'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                    <Check size={15} className="text-slate-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="w-full py-3 px-6 rounded-xl font-bold text-sm text-center text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-gradient-to-br from-blue-600 to-cyan-500 rounded-[28px] p-8 flex flex-col shadow-xl shadow-blue-500/20 overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
              <div className="relative flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-white">Pro</h3>
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase">Best Value</span>
              </div>
              <div className="relative flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">$5</span>
                <span className="text-white/70 font-medium">/month</span>
              </div>
              <ul className="relative flex flex-col gap-3 flex-1 mb-8">
                {['Unlimited word lookups', 'Full vocabulary history', 'Spaced repetition flashcards', 'Export to CSV & Anki'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-white text-sm font-medium">
                    <Check size={15} className="text-white/80 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="relative w-full py-3 px-6 rounded-xl font-bold text-sm text-center bg-white text-blue-600 hover:bg-white/90 transition-all active:scale-[0.98]"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400 mt-10">
            {['Free to install', 'No credit card required', 'Cancel anytime'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Check size={14} className="text-cyan-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center">
              <span className="text-white text-sm font-bold">L</span>
            </div>
            <span className="text-slate-700 font-bold">Lexify</span>
          </Link>

          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Lexify. Built for curious minds.
          </p>

          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
