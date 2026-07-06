"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { BookOpen, LogOut, ExternalLink, Search, Clock, PlayCircle, Download, BarChart3, List, TrendingUp, CalendarDays, Zap, Heart, ChevronDown, CreditCard, MessageSquarePlus, Star, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface WordEncounter {
  id: string;
  videoUrl: string;
  timestamp: string;
  contextSentence: string | null;
  createdAt: string;
}

interface WordSense {
  id: string;
  senseId: string;
  word: string;
  meaning: string;
  source: string;
  isFavourite: boolean;
  createdAt: string;
  encounters: WordEncounter[];
}

const getYouTubeUrlWithTime = (videoUrl: string, timestamp: string) => {
  if (!timestamp) return videoUrl;
  try {
    const parts = timestamp.split(':');
    let totalSeconds = 0;
    if (parts.length === 2) {
      totalSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    } else if (parts.length === 3) {
      totalSeconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    }
    if (totalSeconds > 0) {
      const url = new URL(videoUrl);
      url.searchParams.set('t', `${totalSeconds}s`);
      return url.toString();
    }
  } catch (e) {
    // Ignore URL parse errors
  }
  return videoUrl;
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [words, setWords] = useState<WordSense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favourites'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za' | 'most-encountered'>('newest');
  const [quota, setQuota] = useState<{ tier: string; remaining: number | null; dailyLimit: number | null } | null>(null);
  const [betaStatus, setBetaStatus] = useState<{ status: string; slotsRemaining: number } | null>(null);
  const [betaLoading, setBetaLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackCategory, setFeedbackCategory] = useState<'review' | 'bug' | 'feature'>('review');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackAnonymous, setFeedbackAnonymous] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session && (session as any).accessToken) {
      fetchWords();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchWords = async () => {
    try {
      const jwt = (session as any).accessToken;
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const [wordsRes, quotaRes, betaRes] = await Promise.all([
        fetch(`${API}/words`, { headers: { Authorization: `Bearer ${jwt}` } }),
        fetch(`${API}/subscription/status`, { headers: { Authorization: `Bearer ${jwt}` } }),
        fetch(`${API}/beta/status`, { headers: { Authorization: `Bearer ${jwt}` } }),
      ]);

      if (!wordsRes.ok) {
        if (wordsRes.status === 401) { signOut(); return; }
        throw new Error("Failed to fetch words from API");
      }

      const [data, quotaData, betaData] = await Promise.all([wordsRes.json(), quotaRes.ok ? quotaRes.json() : null, betaRes.ok ? betaRes.json() : null]);
      setWords(data);
      if (quotaData) setQuota(quotaData);
      if (betaData) setBetaStatus({ status: betaData.request?.status ?? 'NONE', slotsRemaining: betaData.slotsRemaining });
    } catch (error) {
      console.error("Error fetching words:", error);
      setWords([]);
    } finally {
      setLoading(false);
    }
  };

  const requestBetaAccess = async () => {
    const jwt = (session as any)?.accessToken;
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    setBetaLoading(true);
    try {
      const source = new URLSearchParams(window.location.search).get('ref') ?? 'unknown';
      const res = await fetch(`${API}/beta/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ source }),
      });
      if (res.ok) {
        setBetaStatus(prev => ({ slotsRemaining: (prev?.slotsRemaining ?? 1) - 1, status: 'PENDING' }));
      }
    } catch { /* ignore */ } finally {
      setBetaLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackRating || !feedbackMessage.trim()) return;
    const jwt = (session as any)?.accessToken;
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    setFeedbackLoading(true);
    try {
      const res = await fetch(`${API}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ rating: feedbackRating, category: feedbackCategory, message: feedbackMessage.trim(), anonymous: feedbackAnonymous }),
      });
      if (res.ok) {
        setFeedbackDone(true);
        setTimeout(() => { setFeedbackOpen(false); setFeedbackDone(false); setFeedbackRating(0); setFeedbackMessage(''); setFeedbackCategory('review'); setFeedbackAnonymous(false); }, 2000);
      }
    } catch { /* ignore */ } finally {
      setFeedbackLoading(false);
    }
  };

  const triggerDownload = (content: string, type: string, filename: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportData = (format: 'json' | 'csv' | 'anki') => {
    const date = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      triggerDownload(JSON.stringify(words, null, 2), 'application/json', `lexify-export-${date}.json`);
    } else if (format === 'csv') {
      const headers = ['Word', 'Meaning', 'Encounters', 'Date Saved'];
      const rows = words.map(w => [
        `"${w.word.replace(/"/g, '""')}"`,
        `"${w.meaning.replace(/"/g, '""')}"`,
        w.encounters?.length || 0,
        new Date(w.createdAt).toLocaleDateString()
      ]);
      triggerDownload([headers.join(','), ...rows.map(r => r.join(','))].join('\n'), 'text/csv', `lexify-export-${date}.csv`);
    } else if (format === 'anki') {
      const rows = words.map(w => {
        const front = w.word;
        const context = w.encounters?.find(e => e.contextSentence)?.contextSentence;
        const back = context
          ? `${w.meaning.replace(/\t/g, ' ')}<br><br><i>${context.replace(/\t/g, ' ')}</i>`
          : w.meaning.replace(/\t/g, ' ');
        return `${front}\t${back}`;
      });
      const header = '#separator:tab\n#html:true\n#notetype:Basic\n#deck:Lexify Vocabulary\n#columns:Front\tBack\n';
      triggerDownload(header + rows.join('\n'), 'text/plain', `lexify-anki-${date}.txt`);
    }
  };

  const toggleFavourite = async (wordId: string) => {
    const jwt = (session as any).accessToken;
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    setWords(prev => prev.map(w => w.id === wordId ? { ...w, isFavourite: !w.isFavourite } : w));
    try {
      await fetch(`${API}/words/${wordId}/favourite`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${jwt}` },
      });
    } catch {
      setWords(prev => prev.map(w => w.id === wordId ? { ...w, isFavourite: !w.isFavourite } : w));
    }
  };

  if (status === "loading" || (status === "unauthenticated")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin"></div>
      </div>
    );
  }

  const filteredWords = words
    .filter(w => {
      if (activeFilter === 'favourites' && !w.isFavourite) return false;
      return w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'az': return a.word.localeCompare(b.word);
        case 'za': return b.word.localeCompare(a.word);
        case 'most-encountered': return (b.encounters?.length || 0) - (a.encounters?.length || 0);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const totalSenses = words.length;
  const totalEncounters = words.reduce((acc, word) => acc + (word.encounters?.length || 0), 0);
  const topWords = [...words]
    .sort((a, b) => (b.encounters?.length || 0) - (a.encounters?.length || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-cyan-400/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">

        <header className="relative z-50 flex items-center justify-between mb-12 bg-white/60 backdrop-blur-md border border-white p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4 px-2">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Lexify" className="w-12 h-12 rounded-2xl shadow-md shadow-blue-500/20" />
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Lexify Dashboard</h1>
            </Link>
          </div>

          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
            <button
               onClick={() => setViewMode('list')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
               <List size={16} />
               Dictionary
            </button>
            <button
               onClick={() => setViewMode('analytics')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${viewMode === 'analytics' ? 'bg-white shadow-sm text-blue-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
               <BarChart3 size={16} />
               Analytics
            </button>
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(o => !o)}
              className="flex items-center gap-2 bg-slate-100/50 hover:bg-slate-100 px-3 py-2 rounded-full border border-slate-200/50 transition-colors"
            >
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-8 h-8 rounded-full bg-slate-200 object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || 'U')}&background=3b82f6&color=fff`;
                  }}
                />
              )}
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{session?.user?.name}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-[9999]">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{session?.user?.email}</p>
                  {quota?.tier === 'PRO' && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <Zap size={10} /> Pro
                    </span>
                  )}
                </div>
                <div className="p-1.5 flex flex-col gap-0.5">
                  {quota?.tier === 'PRO' ? (
                    <Link
                      href="/pricing"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <CreditCard size={15} className="text-slate-400" />
                      Manage Subscription
                    </Link>
                  ) : (
                    <Link
                      href="/pricing"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <Zap size={15} />
                      Upgrade to Pro
                    </Link>
                  )}
                  {((session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'SUPER_ADMIN') && (
                    <Link
                      href="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                    >
                      <BarChart3 size={15} />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors w-full text-left"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Floating feedback button */}
        <button
          onClick={() => setFeedbackOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-white border border-slate-200 shadow-lg hover:shadow-xl text-slate-700 hover:text-blue-600 font-semibold text-sm px-4 py-3 rounded-2xl transition-all cursor-pointer hover:border-blue-200"
        >
          <MessageSquarePlus size={16} />
          Give Feedback
        </button>

        {/* Feedback Modal */}
        {feedbackOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative">
              <button onClick={() => setFeedbackOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>

              {feedbackDone ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-2xl">✓</div>
                  <p className="text-lg font-bold text-slate-800">Thanks for your feedback!</p>
                  <p className="text-sm text-slate-500">We really appreciate it.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-slate-800 mb-1">Share your feedback</h2>
                  <p className="text-sm text-slate-500 mb-5">Help us improve Youtube Lexify.</p>

                  {/* Star rating */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Your rating</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setFeedbackRating(s)}
                          onMouseEnter={() => setFeedbackHover(s)}
                          onMouseLeave={() => setFeedbackHover(0)}
                          className="cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            size={28}
                            className={`transition-colors ${s <= (feedbackHover || feedbackRating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Category</p>
                    <div className="flex gap-2">
                      {([['review', '📝 Review'], ['bug', '🐛 Bug Report'], ['feature', '💡 Feature Request']] as const).map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => setFeedbackCategory(val)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${feedbackCategory === val ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Message</p>
                    <textarea
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder={feedbackCategory === 'bug' ? 'Describe the bug and steps to reproduce...' : feedbackCategory === 'feature' ? 'What feature would you like to see?' : 'Share your experience...'}
                      rows={4}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 resize-none"
                    />
                  </div>

                  {/* Anonymous */}
                  <label className="flex items-center gap-2 mb-5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={feedbackAnonymous}
                      onChange={(e) => setFeedbackAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 accent-blue-500"
                    />
                    <span className="text-sm text-slate-600">Submit anonymously</span>
                  </label>

                  <button
                    onClick={submitFeedback}
                    disabled={!feedbackRating || !feedbackMessage.trim() || feedbackLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors cursor-pointer text-sm"
                  >
                    {feedbackLoading ? 'Sending...' : 'Send Feedback'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {quota && quota.tier === 'FREE' && quota.dailyLimit !== null && (
          <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/60 rounded-2xl px-6 py-4">
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-blue-500" />
              <span className="text-sm font-medium text-slate-700">
                <span className="font-bold">{quota.remaining ?? 0}</span> of {quota.dailyLimit} lookups remaining today
              </span>
            </div>
            <Link
              href="/pricing"
              className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
            >
              Upgrade for unlimited <Zap size={13} />
            </Link>
          </div>
        )}

        {/* Beta access banner — only for FREE users who haven't been approved yet */}
        {quota?.tier === 'FREE' && betaStatus && betaStatus.status !== 'APPROVED' && (
          <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/60 rounded-2xl px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-lg">🎁</span>
              <div>
                {betaStatus.status === 'NONE' && (
                  <p className="text-sm font-medium text-slate-700">
                    <span className="font-bold text-violet-700">{betaStatus.slotsRemaining} spots left</span> — Request 1 month of free Pro access
                  </p>
                )}
                {betaStatus.status === 'PENDING' && (
                  <p className="text-sm font-medium text-slate-700">
                    Your beta access request is <span className="font-bold text-amber-600">under review</span>. Check back here for updates.
                  </p>
                )}
                {betaStatus.status === 'REJECTED' && (
                  <p className="text-sm font-medium text-slate-700">
                    Beta slots are full. <Link href="/pricing" className="text-violet-600 font-bold hover:underline">Upgrade to Pro →</Link>
                  </p>
                )}
              </div>
            </div>
            {betaStatus.status === 'NONE' && betaStatus.slotsRemaining > 0 && (
              <button
                onClick={requestBetaAccess}
                disabled={betaLoading}
                className="text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {betaLoading ? 'Requesting...' : 'Request free access'}
              </button>
            )}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search your vocabulary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white/60 hover:bg-white backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-white shadow-sm transition-colors cursor-pointer" onClick={() => exportData('csv')}>
                 <Download size={16} className="text-slate-500" />
                 <span>CSV</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white/60 hover:bg-white backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-white shadow-sm transition-colors cursor-pointer" onClick={() => exportData('json')}>
                 <Download size={16} className="text-slate-500" />
                 <span>JSON</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white/60 hover:bg-white backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-white shadow-sm transition-colors cursor-pointer" onClick={() => exportData('anki')}>
                 <Download size={16} className="text-slate-500" />
                 <span>Anki</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-blue-50/50 px-5 py-3 rounded-2xl border border-blue-100/50 shadow-sm ml-2">
                <BookOpen size={18} className="text-blue-500" />
                <span>{words.length} Senses Collected</span>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'analytics' && (
          <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <BookOpen size={20} className="text-blue-500" />
                     </div>
                     <h3 className="text-slate-500 font-medium">Total Senses</h3>
                  </div>
                  <div className="text-4xl font-bold text-slate-800 tracking-tight">{totalSenses}</div>
               </div>

               <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                        <PlayCircle size={20} className="text-cyan-500" />
                     </div>
                     <h3 className="text-slate-500 font-medium">Video Encounters</h3>
                  </div>
                  <div className="text-4xl font-bold text-slate-800 tracking-tight">{totalEncounters}</div>
               </div>

               <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full blur-[30px] opacity-20"></div>
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <TrendingUp size={20} className="text-indigo-500" />
                     </div>
                     <h3 className="text-slate-500 font-medium">Avg Encounters / Word</h3>
                  </div>
                  <div className="text-4xl font-bold text-slate-800 tracking-tight">
                     {totalSenses > 0 ? (totalEncounters / totalSenses).toFixed(1) : '0.0'}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-3 mb-8">
                     <CalendarDays size={20} className="text-slate-400" />
                     <h2 className="text-lg font-bold text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">Learning Activity (Last 7 Days)</h2>
                  </div>

                  <div className="flex items-end justify-between h-48 gap-2 pt-4 border-b border-slate-100 pb-2">
                     {(() => {
                        const days = Array.from({length: 7}, (_, i) => {
                           const d = new Date();
                           d.setDate(d.getDate() - (6 - i));
                           return d.toISOString().split('T')[0];
                        });

                        const counts = days.map(dayStr => {
                           let count = 0;
                           words.forEach(w => {
                              w.encounters.forEach(e => {
                                 if (e.createdAt.startsWith(dayStr)) count++;
                              });
                           });
                           return count;
                        });

                        const maxCount = Math.max(...counts, 1);

                        return days.map((dayStr, i) => {
                           const heightPct = (counts[i] / maxCount) * 100;
                           const dateObj = new Date(dayStr);
                           const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                           return (
                              <div key={dayStr} className="flex flex-col items-center flex-1 group h-full">
                                 <div className="w-full relative flex justify-center h-full items-end group-hover:bg-slate-50 rounded-t-lg transition-colors">
                                    <div
                                       className="w-10 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg shadow-sm transition-all duration-700 ease-out group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] group-hover:from-blue-400 group-hover:to-cyan-300 min-h-[4px]"
                                       style={{ height: `${heightPct}%` }}
                                    ></div>
                                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold py-1 px-3 rounded-lg shadow-lg whitespace-nowrap">
                                       {counts[i]} words
                                    </div>
                                 </div>
                                 <span className="text-xs font-semibold text-slate-400 mt-4 group-hover:text-slate-800 transition-colors">{dayName}</span>
                              </div>
                           );
                        });
                     })()}
                  </div>
               </div>

               <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-3 mb-6">
                     <BookOpen size={20} className="text-slate-400" />
                     <h2 className="text-lg font-bold text-slate-800">Top Words</h2>
                  </div>
                  <div className="flex flex-col gap-3">
                     {topWords.length > 0 ? topWords.map((word, index) => (
                        <div key={word.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                           <div className="flex items-center gap-4">
                              <span className={`w-6 text-center font-bold font-mono ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-600' : 'text-slate-300'}`}>
                                 {index + 1}
                              </span>
                              <div className="flex flex-col">
                                 <span className="font-bold text-slate-700 capitalize group-hover:text-blue-600 transition-colors">{word.word}</span>
                              </div>
                           </div>
                           <div className="flex items-baseline gap-1 bg-slate-100 px-3 py-1 rounded-full">
                              <span className="font-bold text-slate-700">{word.encounters?.length || 0}</span>
                              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">x</span>
                           </div>
                        </div>
                     )) : (
                        <div className="text-center py-8 text-slate-400 font-medium">No words collected yet</div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {viewMode === 'list' && (
           <>
              <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${activeFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white/60 text-slate-500 hover:text-slate-700 border border-slate-200/60'}`}
                  >
                    All words
                  </button>
                  <button
                    onClick={() => setActiveFilter('favourites')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${activeFilter === 'favourites' ? 'bg-red-500 text-white shadow-sm' : 'bg-white/60 text-slate-500 hover:text-slate-700 border border-slate-200/60'}`}
                  >
                    <Heart size={13} fill={activeFilter === 'favourites' ? 'currentColor' : 'none'} />
                    Favourites
                  </button>
                </div>
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
                  className="text-sm font-semibold text-slate-600 bg-white/70 border border-slate-200/60 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="az">A → Z</option>
                  <option value="za">Z → A</option>
                  <option value="most-encountered">Most encountered</option>
                </select>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin"></div>
                </div>
              ) : words.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl border border-white rounded-4xl p-16 text-center shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen size={32} className="text-slate-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">No words found</h2>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Your dictionary is empty. Head over to YouTube and use the Lexify extension to start collecting vocabulary!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWords.map((word) => (
                    <div
                      key={word.id}
                      className="group flex flex-col bg-white/70 hover:bg-white backdrop-blur-xl border border-slate-200/60 hover:border-blue-200 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.08)] transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                           <h3 className="text-xl font-bold text-slate-800 capitalize tracking-tight">{word.word}</h3>
                           <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                             <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full inline-block">
                               Encountered {word.encounters?.length || 0} times
                             </span>
                             {word.source === 'ai' ? (
                               <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full inline-block">✦ AI</span>
                             ) : (
                               <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full inline-block">Dictionary</span>
                             )}
                           </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavourite(word.id); }}
                            className={`p-2 rounded-xl transition-all ${word.isFavourite ? 'text-red-400 bg-red-50 hover:bg-red-100' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 hover:bg-red-50'}`}
                          >
                            <Heart size={16} fill={word.isFavourite ? 'currentColor' : 'none'} />
                          </button>
                          <div className="bg-blue-50 text-blue-600 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                            <BookOpen size={18} />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5 mb-6 flex-1">
                        {word.meaning.split(' • ').map((part, i) => {
                          const match = part.match(/^\[(.*?)\]\s*(.*)$/);
                          if (match) {
                            return (
                              <div key={i} className="flex flex-col gap-0.5">
                                <span className="font-semibold italic text-blue-600/90 text-[11px] uppercase tracking-wider">[{match[1]}]</span>
                                <p className="text-slate-600 font-medium text-[15px] leading-relaxed">{match[2]}</p>
                              </div>
                            );
                          }
                          return (
                            <p key={i} className="text-slate-600 font-medium text-[15px] leading-relaxed">{part}</p>
                          );
                        })}
                      </div>

                      {word.encounters && word.encounters.length > 0 && (
                         <div className="pt-4 border-t border-slate-100 space-y-3">
                            {word.encounters.slice(0, 2).map(encounter => (
                               <div key={encounter.id} className="bg-slate-50 rounded-xl p-3 text-sm">
                                  {encounter.contextSentence && (
                                     <p className="text-slate-600 italic mb-2">"{encounter.contextSentence}"</p>
                                  )}
                                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                                     <a
                                        href={getYouTubeUrlWithTime(encounter.videoUrl, encounter.timestamp || '')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                                     >
                                        <PlayCircle size={14} />
                                        <span>Watch @ {encounter.timestamp || '0:00'}</span>
                                        <ExternalLink size={12} className="ml-0.5 opacity-50" />
                                     </a>
                                     <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(encounter.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                     </div>
                                  </div>
                               </div>
                            ))}
                            {word.encounters.length > 2 && (
                               <button className="w-full text-center text-xs font-semibold text-blue-500 hover:text-blue-700 py-1 transition-colors">
                                  View {word.encounters.length - 2} more encounters
                               </button>
                            )}
                         </div>
                      )}
                    </div>
                  ))}

                  {filteredWords.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500 font-medium">
                      {activeFilter === 'favourites'
                        ? 'No favourites yet — click the heart on any word card to save it here.'
                        : `No words matching "${searchQuery}"`}
                    </div>
                  )}
                </div>
              )}
           </>
        )}
      </div>
    </div>
  );
}
