const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Cache TTL: 24 hours (only used for guest / dictionary responses)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
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

async function exchangeAndCacheJwt(chromeToken: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/chrome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: chromeToken }),
  });
  if (!res.ok) throw new Error('Auth exchange failed');
  const { access_token } = await res.json();
  const expiresAt = Date.now() + 25 * 24 * 60 * 60 * 1000;
  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ lexifyJwt: access_token, lexifyJwtExpiresAt: expiresAt }, resolve);
  });
  return access_token;
}

async function getSilentJwt(): Promise<string | null> {
  const cached = await getCachedJwt();
  if (cached) return cached;

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
      const sentence: string = request.sentence || '';

      (async () => {
        // Authenticated path — POST with word + sentence for context-aware AI definitions.
        // We don't use local cache here because AI responses are sentence-specific.
        const jwt = await getSilentJwt();
        if (jwt) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(`${API_URL}/words/define`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${jwt}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ word, sentence }),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.status === 403) {
              const body = await res.json();
              sendResponse({ status: 'quota_exceeded', message: body.message });
              return;
            }

            if (res.ok) {
              const { definition, remaining, source } = await res.json();
              sendResponse({ definition, status: 'success', remaining, source });
              return;
            }
          } catch (err) {
            console.warn('[Lexify Background] Backend define failed, falling back to direct API:', err);
          }
        }

        // Guest path — enforce client-side daily limit, use local cache + direct dictionary API
        const allowed = await checkGuestQuota();
        if (!allowed) {
          sendResponse({ status: 'require_login' });
          return;
        }

        const cached = await getCached(word);
        if (cached) {
          sendResponse({ definition: cached, status: 'success' });
          return;
        }

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

      return true;
    }

    // ── INITIATE_GOOGLE_LOGIN (launchWebAuthFlow — survives popup close) ────
    if (request.type === 'INITIATE_GOOGLE_LOGIN') {
      const redirectUri = chrome.identity.getRedirectURL();
      const params = new URLSearchParams({
        client_id: '1030368911358-8j2pbjah5er7euk0mh83vaitjdpop88k.apps.googleusercontent.com',
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: 'email profile openid',
        prompt: 'select_account',
      });
      const authUrl = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;

      chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (responseUrl) => {
        if (chrome.runtime.lastError || !responseUrl) {
          sendResponse({ status: 'error', error: chrome.runtime.lastError?.message ?? 'Sign-in cancelled' });
          return;
        }
        try {
          const hash = new URL(responseUrl).hash.slice(1);
          const token = new URLSearchParams(hash).get('access_token');
          if (!token) throw new Error('No access token in response');

          const res = await fetch(`${API_URL}/auth/chrome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
          const { access_token } = await res.json();
          const expiresAt = Date.now() + 25 * 24 * 60 * 60 * 1000;
          await new Promise<void>(resolve => {
            chrome.storage.local.set({ lexifyJwt: access_token, lexifyJwtExpiresAt: expiresAt, guestLookupCount: 0 }, resolve);
          });
          sendResponse({ status: 'success' });
        } catch (err) {
          sendResponse({ status: 'error', error: String(err) });
        }
      });
      return true;
    }

    // ── INITIATE_LOGIN ─────────────────────────────────────────────────────
    if (request.type === 'INITIATE_LOGIN') {
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError || !token) {
          sendResponse({ status: 'error', error: 'Authentication failed.' });
          return;
        }
        try {
          const jwt = await exchangeAndCacheJwt(token);
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
