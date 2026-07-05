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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'hover' | 'click'>('hover');
  const [status, setStatus] = useState<StatusData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    chrome.storage.local.get(['lexifyJwt', 'lexifyJwtExpiresAt', 'lexifyMode'], (result) => {
      const isValid = !!(result.lexifyJwt && result.lexifyJwtExpiresAt > Date.now());
      setIsLoggedIn(isValid);
      setMode(result.lexifyMode ?? 'hover');
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

    // Auth runs in background service worker so it survives the popup closing.
    // When the popup reopens, the useEffect on mount picks up the stored JWT.
    chrome.runtime.sendMessage({ type: 'INITIATE_GOOGLE_LOGIN' }, (response) => {
      if (chrome.runtime.lastError) {
        // Popup was closed mid-flow — recheck storage on next open (handled by mount effect)
        return;
      }
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
        const clearState = () => {
          setIsLoggedIn(false);
          setStatus(null);
        };
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
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-blue-500 to-cyan-400 shadow-lg flex items-center justify-center mb-3">
            <span className="text-white text-2xl font-bold">L</span>
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
            className="w-full py-3 px-4 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 shadow-md transition-all flex items-center justify-center gap-2.5 text-sm disabled:opacity-60"
          >
            {loginLoading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-4 h-4" />
            )}
            {loginLoading ? 'Signing in…' : 'Sign in with Google'}
          </button>
          {loginError && (
            <p className="text-[11px] text-red-500 font-medium mt-2 text-center break-all">
              {loginError}
            </p>
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
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white font-bold text-base">L</span>
          </div>
          <span className="font-bold text-slate-800 text-base">Lexify</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
        >
          Sign out
        </button>
      </div>

      {/* Hover / Click toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
          Trigger Mode
        </p>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => handleModeChange('hover')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'hover'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Hover
          </button>
          <button
            onClick={() => handleModeChange('click')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'click'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Click
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 text-center">
          {mode === 'hover'
            ? 'Hover over a subtitle word to see its meaning'
            : 'Click a subtitle word to see its meaning'}
        </p>
      </div>

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
            <div
              className={`h-full ${barColor} rounded-full transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
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
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                {stats.streak === 1 ? 'day streak' : 'day streak'}
              </span>
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
        className="w-full py-2.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors text-sm text-center"
      >
        Go to Dashboard →
      </a>
    </div>
  );
}

export default App;
