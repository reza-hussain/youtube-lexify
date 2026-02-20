// Simple dictionary API URL (e.g. Free Dictionary API)
const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// Simple cache to store definitions
const definitionCache = new Map<string, any>();

chrome.runtime.onMessage.addListener((request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (request.type === 'FETCH_DEFINITION') {
    const word = request.word.toLowerCase().replace(/[^a-z]/g, '');

    console.log('[Lexify Background] Fetching definition for:', word);

    const proceedToFetch = () => {
      // Return cached definition if available
      if (definitionCache.has(word)) {
        sendResponse({ definition: definitionCache.get(word), status: 'success' });
        return;
      }

      // Fetch definition from Dictionary API
      fetch(`${DICTIONARY_API_URL}${word}`)
        .then(async response => {
           if (!response.ok) {
              if (response.status === 404) return null;
              throw new Error(`HTTP Error: ${response.status}`);
           }
           return response.json();
        })
        .then(data => {
          if (!data) {
             sendResponse({ definition: null, status: 'success' });
          } else {
             definitionCache.set(word, data);
             sendResponse({ definition: data, status: 'success' });
          }
        })
        .catch(error => {
          console.error('[Lexify Background] Error fetching definition:', error);
          sendResponse({ error: error.toString(), status: 'error' });
        });
    };

    // 1. Check usage limit BEFORE testing auth
    chrome.storage.local.get(['lexifyUsageCount'], function(result) {
       let count = (result.lexifyUsageCount as number) || 0;
       console.log('[Lexify Background] Current usage count:', count);

       if (count >= 50) {
          // Limit reached: ALWAYS require explicit UI login, ignoring silent tokens for now.
          // This ensures the "Sign In to Continue" button is always shown exactly at 50 words.
          console.log('[Lexify Background] Limit reached. Requiring explicit login from UI.');
          sendResponse({ status: 'require_login' });
       } else {
          // Under free limit: Increment count and fetch directly (no auth check needed here)
          console.log('[Lexify Background] Limit not reached. Incrementing limit to:', count + 1);
          chrome.storage.local.set({ lexifyUsageCount: count + 1 }, () => {
             proceedToFetch();
          });
       }
    });

    // Required for async response
    return true;
  }

  // --- Explicit Login Triggered by User ---
  if (request.type === 'INITIATE_LOGIN') {
     chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError || !token) {
           console.error('[Lexify Background] Login failed:', chrome.runtime.lastError);
           sendResponse({ status: 'error', error: 'Authentication failed.' });
        } else {
           // Reset usage count
           chrome.storage.local.set({ lexifyUsageCount: 0 }, () => {
              sendResponse({ status: 'success', token });
           });
        }
     });
     return true;
  }

  // --- Debug Logout ---
  if (request.type === 'FORCE_LOGOUT') {
     chrome.identity.getAuthToken({ interactive: false }, function(tokenResult: any) {
        if (tokenResult && typeof tokenResult === 'string') {
           // Older chrome API behavior? Let's just handle both
           const token = tokenResult;
           fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
             .then(() => {
                chrome.identity.removeCachedAuthToken({ token }, () => {
                   chrome.identity.clearAllCachedAuthTokens(() => {
                      console.log('[Lexify Background] Successfully logged out and revoked token.');
                      sendResponse({ status: 'success' });
                   });
                });
             })
             .catch(console.error);
        } else if (tokenResult && tokenResult.token) {
           const token = tokenResult.token;
           fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
             .then(() => {
                chrome.identity.removeCachedAuthToken({ token }, () => {
                   chrome.identity.clearAllCachedAuthTokens(() => {
                      console.log('[Lexify Background] Successfully logged out and revoked token.');
                      sendResponse({ status: 'success' });
                   });
                });
             })
             .catch(console.error);
        } else {
           sendResponse({ status: 'not_logged_in' });
        }
     });
     return true;
  }

  // --- Open Popup ---
  if (request.type === 'OPEN_POPUP') {
     // Note: chrome.action.openPopup requires Chrome 118+ and may require active user gesture
     if (chrome.action && chrome.action.openPopup) {
        chrome.action.openPopup().catch(console.error);
     }
     sendResponse({ status: 'success' });
     return true;
  }

  // --- Authenticated Sync Logic ---

  if (request.type === 'SAVE_WORD') {
     console.log('[Lexify Background] Saving word to history (silent fetch attempt):', request.payload);
     
     // Only try to sync if ALREADY logged in (interactive: false)
     // This prevents random login popups on hover
     chrome.identity.getAuthToken({ interactive: false }, function(token) {
        if (chrome.runtime.lastError || !token) {
           // Not logged in, skip sync silently
           chrome.runtime.lastError; // Clear error
           sendResponse({ status: 'skipped', reason: 'Not logged in' });
           return;
        }

        const API_URL = 'http://localhost:3000'; 
        
        fetch(`${API_URL}/auth/chrome`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ token })
        })
        .then(res => res.json())
        .then(authData => {
           if (!authData.access_token) throw new Error('Failed to get Lexify JWT');
           
           return fetch(`${API_URL}/words/save`, {
              method: 'POST',
              headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${authData.access_token}`
              },
              body: JSON.stringify(request.payload)
           }).then(async res => {
              const body = await res.json();
              if (!res.ok) {
                 throw new Error(body.message || `HTTP ${res.status} ${res.statusText}`);
              }
              return body;
           });
        })
        .then(saveResult => {
           console.log('[Lexify Background] Successfully synced word to cloud:', saveResult);
           sendResponse({ status: 'success', data: saveResult });
        })
        .catch(error => {
           console.error('[Lexify Background] Error syncing word to cloud:', error);
           sendResponse({ status: 'error', error: error.toString() });
        });
     });

     return true;
  }
});
