import { useState, useEffect } from 'react';
import './index.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WEB_URL = import.meta.env.VITE_WEB_URL || 'http://localhost:3001';

interface StatusData {
  dailyLookupCount: number;
  dailyLimit: number | null;
  remaining: number | null;
}

interface StatsData {
  streak: number;
  todayWords: number;
  totalWords: number;
}

const LexifyLogo = ({ size = 36 }: { size?: number }) => (
  <img src="/logo.png" alt="Lexify" width={size} height={size} style={{ borderRadius: 9, display: 'block' }} />
);

const LexifyLogoLarge = () => (
  <img src="/logo.png" alt="Lexify" width={56} height={56} style={{ borderRadius: 14, display: 'block' }} />
);

const GearIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${enabled ? 'bg-blue-500' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'hover' | 'click'>('hover');
  const [status, setStatus] = useState<StatusData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showWordList, setShowWordList] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(['lexifyJwt', 'lexifyJwtExpiresAt', 'lexifyMode', 'lexifyShowWordList'], (result) => {
      const isValid = !!(result.lexifyJwt && result.lexifyJwtExpiresAt > Date.now());
      setIsLoggedIn(isValid);
      setMode(result.lexifyMode ?? 'hover');
      setShowWordList(result.lexifyShowWordList !== false);
      if (isValid) {
        fetchStatus(result.lexifyJwt);
        fetchStats();
      }
    });
  }, []);

  const fetchStatus = async (jwt: string) => {
    try {
      const res = await fetch(`${API}/subscription/status`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) setStatus(await res.json());
    } catch {}
  };

  const fetchStats = () => {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
      if (response?.status === 'success') {
        setStats({ streak: response.streak, todayWords: response.todayWords, totalWords: response.totalWords });
      }
    });
  };

  const handleLogin = () => {
    setLoginError(null);
    setLoginLoading(true);
    chrome.runtime.sendMessage({ type: 'INITIATE_GOOGLE_LOGIN' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response?.status === 'success') {
        chrome.storage.local.get(['lexifyJwt'], (result) => {
          const jwt = result.lexifyJwt as string;
          setIsLoggedIn(true);
          fetchStatus(jwt);
          fetchStats();
          setLoginLoading(false);
        });
      } else {
        setLoginError(response?.error ?? 'Sign-in failed');
        setLoginLoading(false);
      }
    });
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['lexifyJwt', 'lexifyJwtExpiresAt'], () => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        const clearState = () => { setIsLoggedIn(false); setStatus(null); };
        if (!token) { clearState(); return; }
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
          .finally(() => {
            chrome.identity.removeCachedAuthToken({ token }, () => {
              chrome.identity.clearAllCachedAuthTokens(clearState);
            });
          });
      });
    });
  };

  const handleModeChange = (newMode: 'hover' | 'click') => {
    setMode(newMode);
    chrome.storage.local.set({ lexifyMode: newMode });
  };

  const handleShowWordListChange = (show: boolean) => {
    setShowWordList(show);
    chrome.storage.local.set({ lexifyShowWordList: show });
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoggedIn === null) {
    return (
      <div className="w-75 h-45 bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  // ── Signed-out ─────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="w-75 bg-slate-50 flex flex-col items-center p-6 font-sans">
        <div className="flex flex-col items-center mb-7 mt-1">
          <div className="mb-3 drop-shadow-lg">
            <LexifyLogoLarge />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Lexify</h1>
          <p className="text-sm text-slate-500 mt-1 text-center leading-snug">
            Learn words from YouTube subtitles
          </p>
        </div>

        <div className="w-full bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-center text-slate-600 text-sm mb-4 leading-relaxed">
            Sign in to save vocabulary and sync across devices.
          </p>
          <button
            onClick={handleLogin}
            disabled={loginLoading}
            className="w-full py-3 px-4 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 shadow-md transition-all flex items-center justify-center gap-2.5 text-sm disabled:opacity-60 cursor-pointer"
          >
            {loginLoading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-4 h-4" />
            )}
            {loginLoading ? 'Signing in…' : 'Sign in with Google'}
          </button>
          {loginError && (
            <p className="text-[11px] text-red-500 font-medium mt-2 text-center break-all">{loginError}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Signed-in ──────────────────────────────────────────────────────────────
  const count = status?.dailyLookupCount ?? 0;
  const limit = status?.dailyLimit ?? null;
  const pct = limit ? Math.min(100, (count / limit) * 100) : 0;
  const barColor = limit && count >= limit ? 'bg-red-400' : 'bg-blue-500';

  return (
    <div className="w-75 bg-slate-50 flex flex-col p-5 font-sans gap-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <LexifyLogo size={36} />
          <span className="font-bold text-slate-800 text-base">Lexify</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(s => !s)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showSettings ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            title="Settings"
          >
            <GearIcon />
          </button>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium cursor-pointer ml-1"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-4">
          {/* Trigger mode */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">Trigger Mode</p>
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => handleModeChange('hover')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${mode === 'hover' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Hover
              </button>
              <button
                onClick={() => handleModeChange('click')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${mode === 'click' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Click
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              {mode === 'hover' ? 'Hover a subtitle word to see its meaning' : 'Click a subtitle word to see its meaning'}
            </p>
          </div>

          {/* Word list toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">Word list panel</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Show word count badge on YouTube</p>
            </div>
            <Toggle enabled={showWordList} onChange={handleShowWordListChange} />
          </div>
        </div>
      )}

      {/* Daily lookups */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Today's Lookups
        </p>
        <div className="flex items-end justify-between mb-2.5">
          <span className="text-3xl font-extrabold text-slate-800">{count}</span>
          <span className="text-sm text-slate-400 mb-0.5 font-medium">
            {limit === null ? 'unlimited' : `/ ${limit}`}
          </span>
        </div>
        {limit !== null && (
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
          </div>
        )}
        {limit !== null && count >= limit && (
          <p className="text-[11px] text-red-500 font-medium mt-2">
            Daily limit reached. Upgrade to Pro for unlimited lookups.
          </p>
        )}
      </div>

      {/* Streak & stats */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Your Progress
          </p>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-extrabold text-slate-800">
                {stats.streak > 0 ? `🔥 ${stats.streak}` : '—'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">day streak</span>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-extrabold text-slate-800">{stats.todayWords}</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">today</span>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-extrabold text-slate-800">{stats.totalWords}</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">total</span>
            </div>
          </div>
        </div>
      )}

      {/* Go to Dashboard */}
      <a
        href={WEB_URL}
        target="_blank"
        rel="noreferrer"
        className="w-full py-2.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors text-sm text-center cursor-pointer"
      >
        Go to Dashboard →
      </a>
    </div>
  );
}

export default App;
