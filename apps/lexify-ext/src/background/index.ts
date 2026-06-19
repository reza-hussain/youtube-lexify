const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Cache TTL: 24 hours in milliseconds
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// Free unauthenticated limit per day (client-side only for guests)
const GUEST_DAILY_LIMIT = 30;

interface CacheEntry {
  data: any;
  expiresAt: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCached(word: string): Promise<any | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([`def_${word}`], (result) => {
      const entry: CacheEntry | undefined = result[`def_${word}`];
      if (entry && entry.expiresAt > Date.now()) {
        resolve(entry.data);
      } else {
        resolve(null);
      }
    });
  });
}

async function setCache(word: string, data: any): Promise<void> {
  return new Promise((resolve) => {
    const entry: CacheEntry = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    chrome.storage.local.set({ [`def_${word}`]: entry }, resolve);
  });
}

/** Get cached Lexify JWT. Returns null if missing or expired. */
async function getCachedJwt(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['lexifyJwt', 'lexifyJwtExpiresAt'], (result) => {
      if (result.lexifyJwt && result.lexifyJwtExpiresAt > Date.now()) {
        resolve(result.lexifyJwt as string);
      } else {
        resolve(null);
      }
    });
  });
}

/** Exchange Chrome OAuth token for a Lexify JWT and cache it for 25 days. */
async function exchangeAndCacheJwt(chromeToken: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/chrome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: chromeToken }),
  });
  if (!res.ok) throw new Error('Auth exchange failed');
  const { access_token } = await res.json();
  // JWT is valid for 30d; cache for 25d to stay safe
  const expiresAt = Date.now() + 25 * 24 * 60 * 60 * 1000;
  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ lexifyJwt: access_token, lexifyJwtExpiresAt: expiresAt }, resolve);
  });
  return access_token;
}

/** Get a valid Lexify JWT silently (no popup). Returns null if not logged in. */
async function getSilentJwt(): Promise<string | null> {
  // 1. Try cached JWT first (avoids two round-trips on every lookup)
  const cached = await getCachedJwt();
  if (cached) return cached;

  // 2. Try getting a Chrome token silently
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        resolve(null);
        return;
      }
      try {
        const jwt = await exchangeAndCacheJwt(token);
        resolve(jwt);
      } catch {
        resolve(null);
      }
    });
  });
}

/** Check guest daily usage, returns true if allowed (and increments count). */
async function checkGuestQuota(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['guestLookupCount', 'guestLookupDate'], (result) => {
      const today = new Date().toISOString().split('T')[0];
      let count = 0;

      if (result.guestLookupDate === today) {
        count = (result.guestLookupCount as number) || 0;
      }

      if (count >= GUEST_DAILY_LIMIT) {
        resolve(false);
        return;
      }

      chrome.storage.local.set(
        { guestLookupCount: count + 1, guestLookupDate: today },
        () => resolve(true),
      );
    });
  });
}

// ─── Message Listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {

    // ── FETCH_DEFINITION ───────────────────────────────────────────────────
    if (request.type === 'FETCH_DEFINITION') {
      const word = request.word.toLowerCase().replace(/[^a-z]/g, '');
      console.log('[Lexify Background] Fetching definition for:', word);

      (async () => {
        // 1. Return from persistent cache if fresh
        const cached = await getCached(word);
        if (cached) {
          sendResponse({ definition: cached, status: 'success' });
          return;
        }

        // 2. Try authenticated path (backend proxy — enforces server-side quota)
        const jwt = await getSilentJwt();
        if (jwt) {
          try {
            const res = await fetch(`${API_URL}/words/define/${encodeURIComponent(word)}`, {
              headers: { Authorization: `Bearer ${jwt}` },
            });

            if (res.status === 403) {
              // Daily quota exceeded for this user
              const body = await res.json();
              sendResponse({ status: 'quota_exceeded', message: body.message });
              return;
            }

            if (res.ok) {
              const { definition, remaining } = await res.json();
              if (definition) await setCache(word, definition);
              sendResponse({ definition, status: 'success', remaining });
              return;
            }
          } catch (err) {
            console.warn('[Lexify Background] Backend define failed, falling back to direct API:', err);
          }
        }

        // 3. Unauthenticated guest path — enforce client-side daily limit
        const allowed = await checkGuestQuota();
        if (!allowed) {
          sendResponse({ status: 'require_login' });
          return;
        }

        // 4. Direct dictionary API fetch for guests
        try {
          const response = await fetch(`${DICTIONARY_API_URL}${word}`);
          if (!response.ok) {
            if (response.status === 404) {
              sendResponse({ definition: null, status: 'success' });
            } else {
              throw new Error(`HTTP ${response.status}`);
            }
            return;
          }
          const data = await response.json();
          await setCache(word, data);
          sendResponse({ definition: data, status: 'success' });
        } catch (error) {
          console.error('[Lexify Background] Error fetching definition:', error);
          sendResponse({ error: String(error), status: 'error' });
        }
      })();

      return true; // async
    }

    // ── INITIATE_LOGIN ─────────────────────────────────────────────────────
    if (request.type === 'INITIATE_LOGIN') {
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError || !token) {
          console.error('[Lexify Background] Login failed:', chrome.runtime.lastError);
          sendResponse({ status: 'error', error: 'Authentication failed.' });
          return;
        }
        try {
          const jwt = await exchangeAndCacheJwt(token);
          // Reset guest counter on login
          chrome.storage.local.set({ guestLookupCount: 0 }, () => {
            sendResponse({ status: 'success', token, jwt });
          });
        } catch (err) {
          sendResponse({ status: 'error', error: String(err) });
        }
      });
      return true;
    }

    // ── FORCE_LOGOUT ────────────────────────────────────────────────────────
    if (request.type === 'FORCE_LOGOUT') {
      // Clear cached JWT
      chrome.storage.local.remove(['lexifyJwt', 'lexifyJwtExpiresAt'], () => {
        chrome.identity.getAuthToken({ interactive: false }, (tokenResult: any) => {
          const token =
            typeof tokenResult === 'string' ? tokenResult : tokenResult?.token;

          if (!token) {
            sendResponse({ status: 'not_logged_in' });
            return;
          }

          fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
            .then(() => {
              chrome.identity.removeCachedAuthToken({ token }, () => {
                chrome.identity.clearAllCachedAuthTokens(() => {
                  console.log('[Lexify Background] Successfully logged out.');
                  sendResponse({ status: 'success' });
                });
              });
            })
            .catch(console.error);
        });
      });
      return true;
    }

    // ── OPEN_POPUP ──────────────────────────────────────────────────────────
    if (request.type === 'OPEN_POPUP') {
      if (chrome.action?.openPopup) {
        chrome.action.openPopup().catch(console.error);
      }
      sendResponse({ status: 'success' });
      return true;
    }

    // ── SAVE_WORD ───────────────────────────────────────────────────────────
    if (request.type === 'SAVE_WORD') {
      console.log('[Lexify Background] Saving word to history:', request.payload);

      (async () => {
        const jwt = await getSilentJwt();
        if (!jwt) {
          sendResponse({ status: 'skipped', reason: 'Not logged in' });
          return;
        }

        try {
          const saveRes = await fetch(`${API_URL}/words/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify(request.payload),
          });

          const body = await saveRes.json();
          if (!saveRes.ok) throw new Error(body.message || `HTTP ${saveRes.status}`);
          console.log('[Lexify Background] Synced word to cloud:', body);
          sendResponse({ status: 'success', data: body });
        } catch (error) {
          console.error('[Lexify Background] Error syncing word:', error);
          sendResponse({ status: 'error', error: String(error) });
        }
      })();

      return true;
    }
  },
);
