import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import tailwindStyles from '../index.css?inline';
import { lookupCefr } from './cefrLookup';

const host = document.createElement('div');
host.id = 'lexify-overlay-host';
host.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;';

const shadowRoot = host.attachShadow({ mode: 'open' });

const styleTag = document.createElement('style');
styleTag.textContent = tailwindStyles;
shadowRoot.appendChild(styleTag);

const rootElement = document.createElement('div');
rootElement.id = 'lexify-root';
shadowRoot.appendChild(rootElement);

document.body.appendChild(host);

// Inject a global page-level style so YouTube's cursor:grab on the caption
// window container cannot override our word spans
const lexifyGlobalStyle = document.createElement('style');
lexifyGlobalStyle.textContent = '.lexify-word { cursor: pointer !important; user-select: none !important; }';
document.head.appendChild(lexifyGlobalStyle);

const root = createRoot(rootElement);

// Icons
const VolumeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/></svg>
);

const cefrColors: Record<string, string> = {
  A1: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  A2: 'bg-green-100 text-green-700 border-green-200',
  B1: 'bg-amber-100 text-amber-700 border-amber-200',
  B2: 'bg-orange-100 text-orange-700 border-orange-200',
  C1: 'bg-red-100 text-red-700 border-red-200',
  C2: 'bg-purple-100 text-purple-700 border-purple-200',
};

const CefrBadge = ({ level }: { level: string }) => (
  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cefrColors[level] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
    {level}
  </span>
);

interface VideoWord { word: string; cefr?: string }

const LexifyOverlay = () => {
  const [definitionData, setDefinitionData] = useState<{
    word: string;
    meaning: string;
    meanings?: { partOfSpeech: string; definition: string }[];
    phoneticText?: string;
    audioUrl?: string;
    etymology?: string;
    tip?: string;
    cefr?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [requireLogin, setRequireLogin] = useState(false);
  const [isPersistent, setIsPersistent] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [nonEnglish, setNonEnglish] = useState(false);
  const [videoWords, setVideoWords] = useState<VideoWord[]>([]);
  const [showWordPanel, setShowWordPanel] = useState(false);
  const [wordListEnabled, setWordListEnabled] = useState(true);
  const [currentSentence, setCurrentSentence] = useState('');
  const [contextBuffer, setContextBuffer] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  // controlsBottom: safe bottom offset (px) to sit above YouTube's controls bar
  const [controlsBottom, setControlsBottom] = useState(88);

  // Read word list enabled from storage and keep in sync
  useEffect(() => {
    chrome.storage.local.get(['lexifyShowWordList'], (result) => {
      setWordListEnabled(result.lexifyShowWordList !== false);
    });
    const storageListener = (changes: Record<string, chrome.storage.StorageChange>, ns: string) => {
      if (ns === 'local' && 'lexifyShowWordList' in changes) {
        setWordListEnabled(changes.lexifyShowWordList.newValue !== false);
      }
    };
    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, []);

  useEffect(() => {
    const handleReceiveDefinition = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.type === 'LOADING') {
        setLoading(true);
        setRequireLogin(false);
        setDefinitionData({ word: customEvent.detail.word, meaning: '' });
        setCurrentSentence(customEvent.detail.payload?.sentence || '');
        setContextBuffer(customEvent.detail.payload?.contextBuffer || customEvent.detail.payload?.sentence || '');
        setExplanation(null);
        setExplanationLoading(false);
      } else if (customEvent.detail.type === 'SUCCESS') {
        setLoading(false);
        setRequireLogin(false);
        const payload = customEvent.detail.payload;
        setDefinitionData(payload);
        if (payload?.word && payload.meaning !== 'Definition not found.' && payload.meaning !== 'Could not fetch definition. Please try again.') {
          setVideoWords(prev => {
            if (prev.some(w => w.word.toLowerCase() === payload.word.toLowerCase())) return prev;
            return [{ word: payload.word, cefr: payload.cefr }, ...prev];
          });
        }
      } else if (customEvent.detail.type === 'REQUIRE_LOGIN') {
        setLoading(false);
        setRequireLogin(true);
        setDefinitionData(null);
      } else if (customEvent.detail.type === 'CLEAR') {
        if (!isPersistent) {
          setLoading(false);
          setRequireLogin(false);
          setDefinitionData(null);
        }
      } else if (customEvent.detail.type === 'PERSISTENT_OPEN') {
        setIsPersistent(true);
      } else if (customEvent.detail.type === 'PERSISTENT_CLOSE') {
        setIsPersistent(false);
        setLoading(false);
        setRequireLogin(false);
        setDefinitionData(null);
        setExplanation(null);
        setExplanationLoading(false);
      } else if (customEvent.detail.type === 'NON_ENGLISH') {
        setNonEnglish(true);
        setTimeout(() => setNonEnglish(false), 6000);
      } else if (customEvent.detail.type === 'VIDEO_CHANGE') {
        setVideoWords([]);
        setShowWordPanel(false);
      } else if (customEvent.detail.type === 'CONTROLS_HEIGHT') {
        const h = (customEvent.detail.payload?.height ?? 0) as number;
        setControlsBottom(Math.max(h + 12, 48));
      }
    };

    window.addEventListener('LEXIFY_DEFINITION', handleReceiveDefinition);
    return () => window.removeEventListener('LEXIFY_DEFINITION', handleReceiveDefinition);
  }, [isPersistent]);

  const isVisible = !!(definitionData || loading || requireLogin);

  const playAudio = () => {
    if (definitionData?.audioUrl) {
      setIsPlayingAudio(true);
      const audio = new Audio(definitionData.audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
    }
  };

  const persistDismissRef = useRef<number | null>(null);

  const cancelPersistDismiss = () => {
    if (persistDismissRef.current) {
      clearTimeout(persistDismissRef.current);
      persistDismissRef.current = null;
    }
  };

  const schedulePersistDismiss = (delay = 2500) => {
    cancelPersistDismiss();
    persistDismissRef.current = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('LEXIFY_DEFINITION', { detail: { type: 'PERSISTENT_CLOSE' } }));
    }, delay) as unknown as number;
  };

  const closePanel = () => {
    cancelPersistDismiss();
    window.dispatchEvent(new CustomEvent('LEXIFY_DEFINITION', { detail: { type: 'PERSISTENT_CLOSE' } }));
  };

  // Auto-dismiss click-mode popup after 5 seconds; cancel when mouse is on it
  useEffect(() => {
    if (isPersistent) {
      schedulePersistDismiss(5000);
    } else {
      cancelPersistDismiss();
    }
    return cancelPersistDismiss;
  }, [isPersistent]);

  const handleExplainSentence = () => {
    if (!currentSentence || explanationLoading) return;
    setExplanationLoading(true);
    setExplanation(null);
    chrome.runtime.sendMessage(
      { type: 'EXPLAIN_SENTENCE', sentence: contextBuffer || currentSentence },
      (response) => {
        setExplanationLoading(false);
        if (response?.status === 'success' && response.explanation) {
          setExplanation(response.explanation);
        } else {
          setExplanation('Could not explain this sentence. Try again.');
        }
      }
    );
  };

  const containerClasses = "absolute top-24 right-10 w-96 p-5 bg-[#E2E6EB80] backdrop-blur-[30px] rounded-[18px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 pointer-events-auto";

  // Word panel sits above the controls bar, offset by controlsBottom
  const wordPanelStyle = { bottom: `${controlsBottom + 48}px`, left: '40px' };
  const wordBadgeStyle = { bottom: `${controlsBottom + 4}px`, left: '40px' };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={containerClasses}
            onMouseEnter={() => { (window as any).lexifyCancelHoverOut?.(); cancelPersistDismiss(); }}
            onMouseLeave={() => { if ((window as any).lexifyIsPersistent) schedulePersistDismiss(2500); else (window as any).lexifyScheduleHoverOut?.(); }}
          >
            <motion.div layout="position" className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {loading ? (
                <div className="flex animate-pulse space-x-4">
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-2 bg-[#0F172A]/10 rounded w-1/3"></div>
                    <div className="h-2 bg-[#0F172A]/10 rounded w-5/6"></div>
                  </div>
                </div>
              ) : requireLogin ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <p className="text-[15px] text-slate-800 text-center font-medium">
                    You've reached your free translations limit.
                    <br />
                    <span className="text-[#4DA3FF] font-semibold">Please open the Lexify extension popup to sign in and continue!</span>
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-slate-800 font-bold capitalize tracking-tight text-[18px]">
                      {definitionData?.word}
                    </h3>
                    {definitionData?.cefr && <CefrBadge level={definitionData.cefr} />}
                    {definitionData?.phoneticText && (
                      <span className="text-[12px] text-slate-500 font-medium">{definitionData.phoneticText}</span>
                    )}
                    {definitionData?.audioUrl && (
                      <button
                        onClick={playAudio}
                        className={`p-1 rounded-full transition-all flex items-center justify-center ${isPlayingAudio ? 'bg-blue-500 text-white' : 'text-blue-500 hover:bg-slate-200/80'}`}
                        title="Listen to pronunciation"
                      >
                        <VolumeIcon />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {definitionData?.meanings && definitionData.meanings.length > 0 ? (
                      definitionData.meanings.map((m, i) => (
                        <div key={i} className="flex flex-col gap-0.5 mb-1.5">
                          <span className="font-semibold italic text-blue-600 uppercase text-[12px]">[{m.partOfSpeech}]</span>
                          <p className="text-slate-700 text-[14px] leading-snug">{m.definition}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-800 font-medium text-[15px] leading-relaxed">
                        {definitionData?.meaning || "Definition not found."}
                      </p>
                    )}

                    {definitionData?.etymology && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Etymology</p>
                        <p className="text-[13px] text-slate-600 leading-relaxed italic">{definitionData.etymology}</p>
                      </div>
                    )}

                    {definitionData?.tip && (
                      <div className="mt-2 p-3 bg-blue-50/80 rounded-xl border border-blue-100">
                        <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider mb-1">Memory Tip</p>
                        <p className="text-[13px] text-blue-700 leading-relaxed">{definitionData.tip}</p>
                      </div>
                    )}

                    {currentSentence && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Context sentence</p>
                        <p className="text-[13px] text-slate-600 italic leading-relaxed mb-2">"{currentSentence}"</p>
                        {explanation ? (
                          <div className="p-3 bg-violet-50/80 rounded-xl border border-violet-100">
                            <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-wider mb-1">AI Explanation</p>
                            <p className="text-[13px] text-violet-800 leading-relaxed">{explanation}</p>
                          </div>
                        ) : (
                          <button
                            onClick={handleExplainSentence}
                            disabled={explanationLoading}
                            className="flex items-center gap-1.5 text-[12px] font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                          >
                            <SparkleIcon />
                            {explanationLoading ? 'Explaining…' : 'Explain this sentence'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-English caption toast */}
      <AnimatePresence>
        {nonEnglish && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800/90 backdrop-blur-md text-white text-[13px] font-medium px-4 py-2.5 rounded-full shadow-xl border border-white/10 pointer-events-none whitespace-nowrap"
          >
            🌐 Lexify works with English captions — switch captions to English to enable
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word panel — dynamically positioned above YouTube controls */}
      <AnimatePresence>
        {showWordPanel && wordListEnabled && (
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={wordPanelStyle}
            className="absolute w-60 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 pointer-events-auto overflow-hidden"
          >
            <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between">
              <p className="text-white text-[12px] font-semibold uppercase tracking-wider">This video</p>
              <p className="text-slate-400 text-[11px]">{videoWords.length} words</p>
            </div>
            <div className="max-h-64 overflow-y-auto p-2 flex flex-col gap-0.5">
              {videoWords.map((w, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="text-white text-[13px] capitalize">{w.word}</span>
                  {w.cefr && <CefrBadge level={w.cefr} />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word count badge — sits above YouTube controls bar */}
      {wordListEnabled && videoWords.length > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowWordPanel(p => !p)}
          style={wordBadgeStyle}
          className={`absolute flex items-center gap-1.5 backdrop-blur-md text-white text-[12px] font-semibold px-3 py-2 rounded-full shadow-xl border pointer-events-auto transition-colors ${showWordPanel ? 'bg-slate-700/95 border-white/20' : 'bg-slate-800/90 border-white/10 hover:bg-slate-700/90'}`}
        >
          📚 {videoWords.length} {videoWords.length === 1 ? 'word' : 'words'}
        </motion.button>
      )}
    </>
  );
};

root.render(<LexifyOverlay />);

// ─── Subtitle Interception Logic ──────────────────────────────────────────────

// Rolling buffer of recent subtitle cue texts — used to build sentence context for AI
const subtitleBuffer: string[] = [];
const MAX_BUFFER_SIZE = 5;

const pushToSubtitleBuffer = (text: string) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean || clean === subtitleBuffer[subtitleBuffer.length - 1]) return;
  subtitleBuffer.push(clean);
  if (subtitleBuffer.length > MAX_BUFFER_SIZE) subtitleBuffer.shift();
};

let currentVideo: HTMLVideoElement | null = null;
let pauseTimeout: number | null = null;
let hoverTimeout: number | null = null;
let hoverOutTimer: number | null = null;
let currentWord: string | null = null;
let lexifyMode: 'hover' | 'click' = 'hover';

// Monotonically increasing request counter — used to discard stale fetch responses
let fetchRequestId = 0;

// Keep YouTube controls visible while a word is being hovered
let controlsKeepAliveTimer: number | null = null;

const keepYtControlsVisible = () => {
  const player = document.querySelector('#movie_player') as HTMLElement | null;
  if (!player) return;
  const rect = player.getBoundingClientRect();
  player.dispatchEvent(new MouseEvent('mousemove', {
    bubbles: true, cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height * 0.9,
  }));
};

const startControlsKeepAlive = () => {
  if (controlsKeepAliveTimer) return;
  keepYtControlsVisible();
  controlsKeepAliveTimer = window.setInterval(keepYtControlsVisible, 1500) as unknown as number;
};

const stopControlsKeepAlive = () => {
  if (controlsKeepAliveTimer) {
    clearInterval(controlsKeepAliveTimer);
    controlsKeepAliveTimer = null;
  }
};

const cancelHoverOut = () => {
  if (hoverOutTimer !== null) {
    clearTimeout(hoverOutTimer);
    hoverOutTimer = null;
  }
};
// Expose to React popup so onMouseEnter can cancel the timer
(window as any).lexifyCancelHoverOut = cancelHoverOut;

const scheduleHoverOut = () => {
  cancelHoverOut();
  hoverOutTimer = window.setTimeout(() => {
    hoverOutTimer = null;
    if (!(window as any).lexifyIsPersistent) {
      fetchRequestId++;
      stopControlsKeepAlive();
      currentWord = null;
      dispatchDefinitionEvent('CLEAR');
    }
    if (pauseTimeout) clearTimeout(pauseTimeout);
    pauseTimeout = window.setTimeout(() => {
      if (currentVideo && currentVideo.paused && !(window as any).lexifyIsPersistent) {
        currentVideo.play();
      }
    }, 300) as unknown as number;
  }, 500) as unknown as number;
};
(window as any).lexifyScheduleHoverOut = scheduleHoverOut;

// Initialize mode from storage ASAP
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get(['lexifyMode'], (result) => {
    lexifyMode = result.lexifyMode ?? 'hover';
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.lexifyMode) {
      lexifyMode = changes.lexifyMode.newValue ?? 'hover';
      if (!((window as any).lexifyIsPersistent)) {
        currentWord = null;
        dispatchDefinitionEvent('CLEAR');
      }
      if (currentVideo && currentVideo.paused && !((window as any).lexifyIsPersistent)) {
        currentVideo.play();
      }
    }
  });
}

const dispatchDefinitionEvent = (type: string, payload?: any, word?: string) => {
  window.dispatchEvent(new CustomEvent('LEXIFY_DEFINITION', { detail: { type, payload, word } }));
};

const getCaptionLanguage = (): string | null => {
  try {
    const player = document.querySelector('#movie_player') as any;
    const track = player?.getOption?.('captions', 'track');
    return track?.languageCode ?? null;
  } catch {
    return null;
  }
};

const isLikelyEnglish = (text: string): boolean => {
  if (!text || text.trim().length < 3) return true;
  const nonAscii = text.split('').filter(c => c.charCodeAt(0) > 127).length;
  return nonAscii / text.length < 0.2;
};

const tokenizeCaptionSegment = (segment: HTMLElement) => {
  if (segment.hasAttribute('data-lexify-tokenized')) return;
  if (segment.hasAttribute('data-lexify-skipped')) return;

  const text = segment.textContent || '';
  const lang = getCaptionLanguage();
  const isEnglish = lang ? lang.startsWith('en') : isLikelyEnglish(text);

  if (!isEnglish) {
    segment.setAttribute('data-lexify-skipped', 'true');
    if (!(window as any).lexifyNonEnglishShown) {
      (window as any).lexifyNonEnglishShown = true;
      dispatchDefinitionEvent('NON_ENGLISH');
    }
    return;
  }

  segment.setAttribute('data-lexify-tokenized', 'true');
  const words = text.split(/([\s ]+)/);
  segment.textContent = '';

  words.forEach(word => {
    if (/^[\s ]+$/.test(word)) {
      segment.appendChild(document.createTextNode(word));
    } else {
      const span = document.createElement('span');
      span.textContent = word;
      span.className = 'lexify-word';
      span.style.cssText = 'pointer-events: auto !important; display: inline-block; border-radius: 4px; transition: background-color 0.15s; cursor: pointer !important;';

      span.addEventListener('mouseenter', () => { span.style.backgroundColor = 'rgba(77, 163, 255, 0.3)'; });
      span.addEventListener('mouseleave', () => { span.style.backgroundColor = 'transparent'; });
      span.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetWord = span.textContent?.trim().replace(/[^a-zA-Z]/g, '') || "";
        if (targetWord) {
          if (currentVideo && !currentVideo.paused) currentVideo.pause();
          if (pauseTimeout) clearTimeout(pauseTimeout);
          dispatchDefinitionEvent('PERSISTENT_OPEN', null, targetWord);
          if (targetWord !== currentWord) {
            currentWord = targetWord;
            fetchDefinitionForWord(targetWord, span.closest('.ytp-caption-segment') as HTMLElement);
          }
        }
      });

      segment.appendChild(span);
    }
  });
};

const fetchDefinitionForWord = (word: string, captionSegment?: HTMLElement) => {
  const thisRequestId = ++fetchRequestId;
  const sentence = captionSegment?.textContent?.trim() || '';
  const contextBuffer = subtitleBuffer.length > 0 ? subtitleBuffer.join(' ') : sentence;
  dispatchDefinitionEvent('LOADING', { sentence, contextBuffer }, word);
  startControlsKeepAlive();

  const fallbackTimer = setTimeout(() => {
    if (thisRequestId !== fetchRequestId && !(window as any).lexifyIsPersistent) return;
    dispatchDefinitionEvent('SUCCESS', { word, meaning: 'Could not fetch definition. Please try again.' });
  }, 12000);

  chrome.runtime.sendMessage({ type: 'FETCH_DEFINITION', word, sentence }, (response) => {
    clearTimeout(fallbackTimer);

    // Discard stale responses — user already hovered away (unless in persistent/click mode)
    if (thisRequestId !== fetchRequestId && !(window as any).lexifyIsPersistent) return;

    if (chrome.runtime.lastError) {
      dispatchDefinitionEvent('SUCCESS', { word, meaning: 'Connection error with extension background.' });
      return;
    }

    if (response?.status === 'require_login') {
      dispatchDefinitionEvent('REQUIRE_LOGIN', null, word);
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
      return;
    }

    if (response?.status === 'quota_exceeded') {
      dispatchDefinitionEvent('SUCCESS', { word, meaning: 'Daily limit reached. Upgrade to Pro for unlimited lookups.' });
      return;
    }

    if (response?.status === 'success') {
      const data = response.definition;
      let meaningString = '';
      let phoneticText = '';
      let audioUrl = '';
      let etymology = '';
      let tip = '';
      let cefr = '';
      let meaningsList: { partOfSpeech: string; definition: string }[] = [];

      if (Array.isArray(data) && data.length > 0) {
        const exactMatch = data.find(entry => entry.word?.toLowerCase() === word.toLowerCase()) || data[0];
        const meanings = exactMatch?.meanings || [];
        const phonetics = exactMatch?.phonetics || [];
        etymology = exactMatch?.etymology || '';
        tip = exactMatch?.tip || '';
        cefr = exactMatch?.cefr || lookupCefr(word) || '';

        for (const p of phonetics) {
          if (p.text && !phoneticText) phoneticText = p.text;
          if (p.audio && !audioUrl) audioUrl = p.audio;
        }
        if (!phoneticText && exactMatch?.phonetic) phoneticText = exactMatch.phonetic;

        const uniquePoS = new Set();
        for (const m of meanings) {
          if (m.definitions?.length > 0 && !uniquePoS.has(m.partOfSpeech)) {
            uniquePoS.add(m.partOfSpeech);
            meaningsList.push({ partOfSpeech: m.partOfSpeech, definition: m.definitions[0].definition });
          }
          if (meaningsList.length >= 4) break;
        }
        meaningString = meaningsList.map(m => `[${m.partOfSpeech}] ${m.definition}`).join(' • ');
      }

      if (meaningsList.length > 0) {
        dispatchDefinitionEvent('SUCCESS', { word, meaning: meaningString, meanings: meaningsList, phoneticText, audioUrl, etymology, tip, cefr });

        let timestamp = '0:00';
        if (currentVideo) {
          const minutes = Math.floor(currentVideo.currentTime / 60);
          const seconds = Math.floor(currentVideo.currentTime % 60).toString().padStart(2, '0');
          timestamp = `${minutes}:${seconds}`;
        }

        chrome.runtime.sendMessage({
          type: 'SAVE_WORD',
          payload: { word, meaning: meaningString, videoUrl: window.location.href, timestamp, contextSentence: sentence, source: response.source ?? 'dictionary' }
        }, () => {});
      } else {
        dispatchDefinitionEvent('SUCCESS', { word, meaning: "Definition not found." });
      }
    } else {
      dispatchDefinitionEvent('SUCCESS', { word, meaning: "Network error fetching definition." });
    }
  });
};

const onWordHover = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const wordSpan = target.closest('.lexify-word') as HTMLElement;
  const captionSegment = target.closest('.ytp-caption-segment') as HTMLElement;

  if (!captionSegment) return;
  if (!captionSegment.hasAttribute('data-lexify-tokenized')) {
    tokenizeCaptionSegment(captionSegment);
    return;
  }

  if (lexifyMode !== 'hover') return;
  if (!wordSpan) return;

  const rawWord = wordSpan.textContent?.trim() || "";
  const word = rawWord.replace(/[^a-zA-Z]/g, '');
  if (!word || word === currentWord) return;
  if ((window as any).lexifyIsPersistent) return;

  currentWord = word;
  (window as any).lastHoverTime = Date.now();

  if (pauseTimeout) clearTimeout(pauseTimeout);
  if (hoverTimeout) clearTimeout(hoverTimeout);
  // Cancel any pending hide-timer from the previous word so it doesn't
  // increment fetchRequestId and kill this word's in-flight fetch
  cancelHoverOut();

  hoverTimeout = window.setTimeout(() => {
    setTimeout(() => {
      if (currentVideo && !currentVideo.paused && currentWord === word && !(window as any).lexifyIsPersistent) {
        currentVideo.pause();
      }
    }, 300);
    fetchDefinitionForWord(word, captionSegment);
  }, 200) as unknown as number;
};

const onWordHoverOut = () => {
  if (lexifyMode !== 'hover') return;
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
  // Give the user 500ms to move from the caption word to the popup before hiding
  scheduleHoverOut();
};

let captionMutationObserver: MutationObserver | null = null;

const setupSubtitleObserver = () => {
  const videoPlayer = document.querySelector('video.html5-main-video') as HTMLVideoElement;
  if (videoPlayer) currentVideo = videoPlayer;

  const captionContainer = document.querySelector('.ytp-caption-window-container');
  if (captionContainer && !captionContainer.hasAttribute('data-lexify-bound')) {
    captionContainer.setAttribute('data-lexify-bound', 'true');
    captionContainer.addEventListener('mouseover', onWordHover as EventListener);
    captionContainer.addEventListener('mouseleave', onWordHoverOut as EventListener);

    // Populate subtitle buffer as new cues appear
    if (captionMutationObserver) captionMutationObserver.disconnect();
    captionMutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          const segments = node.classList.contains('ytp-caption-segment')
            ? [node]
            : Array.from(node.querySelectorAll('.ytp-caption-segment'));
          for (const seg of segments) {
            pushToSubtitleBuffer(seg.textContent || '');
          }
        }
      }
    });
    captionMutationObserver.observe(captionContainer, { childList: true, subtree: true });
  } else if (!captionContainer) {
    setTimeout(setupSubtitleObserver, 1000);
  }
};

// Observe the YouTube controls bar height and report it to React for dynamic positioning
let controlsResizeObserver: ResizeObserver | null = null;

const setupControlsObserver = () => {
  const bar = document.querySelector('.ytp-chrome-bottom') as HTMLElement | null;
  if (!bar) {
    setTimeout(setupControlsObserver, 1500);
    return;
  }
  if (controlsResizeObserver) controlsResizeObserver.disconnect();
  controlsResizeObserver = new ResizeObserver(() => {
    const h = (document.querySelector('.ytp-chrome-bottom') as HTMLElement)?.offsetHeight ?? 0;
    dispatchDefinitionEvent('CONTROLS_HEIGHT', { height: h });
  });
  controlsResizeObserver.observe(bar);
  dispatchDefinitionEvent('CONTROLS_HEIGHT', { height: bar.offsetHeight });
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setupSubtitleObserver();
  setupControlsObserver();
} else {
  window.addEventListener('load', () => {
    setupSubtitleObserver();
    setupControlsObserver();
  });
}

window.addEventListener('yt-navigate-finish', () => {
  (window as any).lexifyNonEnglishShown = false;
  dispatchDefinitionEvent('VIDEO_CHANGE');
  setTimeout(() => {
    setupSubtitleObserver();
    setupControlsObserver();
  }, 1000);
});

// Sync persistent state to vanilla JS so hover/click logic can check it
window.addEventListener('LEXIFY_DEFINITION', (e: Event) => {
  const details = (e as CustomEvent).detail;
  if (details.type === 'PERSISTENT_OPEN') {
    (window as any).lexifyIsPersistent = true;
  } else if (details.type === 'PERSISTENT_CLOSE') {
    (window as any).lexifyIsPersistent = false;
    stopControlsKeepAlive();
    if (currentVideo && currentVideo.paused) currentVideo.play();
    currentWord = null;
  }
});
