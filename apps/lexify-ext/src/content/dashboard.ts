const STORAGE_KEY = 'lexify_ext_jwt';
const JWT_TTL = 25 * 24 * 60 * 60 * 1000; // 25 days

function saveJwt(jwt: string) {
  chrome.storage.local.set({
    lexifyJwt: jwt,
    lexifyJwtExpiresAt: Date.now() + JWT_TTL,
    guestLookupCount: 0,
  });
}

function clearJwt() {
  chrome.storage.local.remove(['lexifyJwt', 'lexifyJwtExpiresAt']);
}

// ── Dashboard → Extension ────────────────────────────────────────────────────

// On load: sync whatever JWT is already in localStorage
const existing = localStorage.getItem(STORAGE_KEY);
if (existing) saveJwt(existing);

// Live: dashboard signed in
window.addEventListener('lexify:jwt', (e: Event) => {
  saveJwt((e as CustomEvent).detail);
});

// Live: dashboard signed out
window.addEventListener('lexify:signout', () => {
  clearJwt();
});

// ── Extension → Dashboard ────────────────────────────────────────────────────

// When the extension's JWT changes, write to localStorage so the dashboard
// picks it up via the StorageEvent listener in ExtensionBridge.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes.lexifyJwt) {
    const newJwt = changes.lexifyJwt.newValue;
    if (newJwt) {
      // Extension signed in — write to localStorage to trigger dashboard sign-in
      localStorage.setItem(STORAGE_KEY, newJwt);
    } else {
      // Extension signed out — remove from localStorage and tell dashboard
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('lexify:ext-signout'));
    }
  }
});
