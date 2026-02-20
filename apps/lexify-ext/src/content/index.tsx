import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import tailwindStyles from '../index.css?inline';

// Create a host element for our React app to mount into
const host = document.createElement('div');
host.id = 'lexify-overlay-host';
// Force maximum z-index, viewport coverage, and ignore clicks (children can re-enable clicks)
host.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;';

// We use an open shadow DOM so our components are isolated from YouTube's CSS
const shadowRoot = host.attachShadow({ mode: 'open' });

// We need to inject our Tailwind CSS into the shadow DOM too
const styleTag = document.createElement('style');
styleTag.textContent = tailwindStyles;
shadowRoot.appendChild(styleTag);

const rootElement = document.createElement('div');
rootElement.id = 'lexify-root';
shadowRoot.appendChild(rootElement);

document.body.appendChild(host);

const root = createRoot(rootElement);

// Icons
const VolumeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

// Tooltip component matching Brand Guidelines (Liquid Glass)
const LexifyOverlay = () => {
  const [definitionData, setDefinitionData] = useState<{ word: string, meaning: string, meanings?: {partOfSpeech: string, definition: string}[], phoneticText?: string, audioUrl?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [requireLogin, setRequireLogin] = useState(false);
  const [isPersistent, setIsPersistent] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const handleReceiveDefinition = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.type === 'LOADING') {
        setLoading(true);
        setRequireLogin(false);
        setDefinitionData({ word: customEvent.detail.word, meaning: '' });
      } else if (customEvent.detail.type === 'SUCCESS') {
        setLoading(false);
        setRequireLogin(false);
        setDefinitionData(customEvent.detail.payload);
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

  const closePanel = () => {
    window.dispatchEvent(new CustomEvent('LEXIFY_DEFINITION', { detail: { type: 'PERSISTENT_CLOSE' } }));
  };

  // Switch styles based on exact state. Removed CSS transitions since framer-motion handles it.
  const containerClasses = isPersistent 
     ? "absolute top-24 right-[10vw] w-[450px] p-6 bg-slate-50/90 backdrop-blur-[40px] rounded-[24px] shadow-[0_30px_60px_rgba(0,0,0,0.12),0_10px_20px_rgba(0,0,0,0.05),0_0_0_1px_rgba(255,255,255,0.5)] pointer-events-auto"
     : "absolute top-24 right-10 w-96 p-5 bg-[#E2E6EB80] backdrop-blur-[30px] rounded-[18px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 pointer-events-auto";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
           layout
           initial={{ opacity: 0, y: 15, scale: 0.96 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           exit={{ opacity: 0, y: 10, scale: 0.96 }}
           transition={{ type: "spring", stiffness: 400, damping: 30 }}
           className={containerClasses}
        >
          <motion.div layout="position" className="flex flex-col gap-2">
            {loading ? (
              <div className="flex animate-pulse space-x-4">
                 <div className="flex-1 space-y-3 py-1">
                    <div className="h-2 bg-[#0F172A]/10 rounded w-1/3"></div>
                    <div className="h-2 bg-[#0F172A]/10 rounded w-5/6"></div>
                    {isPersistent && <div className="h-2 bg-[#0F172A]/10 rounded w-4/6 mt-4"></div>}
                 </div>
              </div>
            ) : requireLogin ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <p className="text-[15px] text-slate-800 text-center font-medium">
                  You've reached your free translations limit.
                  <br/>
                  <span className="text-[#4DA3FF] font-semibold">Please open the Lexify extension popup to sign in and continue!</span>
                </p>
                {isPersistent && (
                    <button onClick={closePanel} className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-200/50 px-3 py-1.5 rounded-full transition-colors">Close panel</button>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-start justify-between mb-2">
                   <div>
                      <h3 className={`text-slate-800 font-bold capitalize tracking-tight ${isPersistent ? 'text-[24px]' : 'text-[18px] mb-1'}`}>
                         {definitionData?.word}
                      </h3>
                      {isPersistent && definitionData?.phoneticText && (
                         <div className="flex items-center gap-3 mt-1.5 mb-2">
                            <span className="text-[14px] text-slate-500 font-medium tracking-wide bg-slate-200/50 px-2 py-0.5 rounded-md">
                               {definitionData.phoneticText}
                            </span>
                            {definitionData?.audioUrl && (
                               <button 
                                  onClick={playAudio}
                                  className={`p-1.5 rounded-full transition-all flex items-center justify-center ${isPlayingAudio ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-200/80 text-blue-600 hover:bg-slate-300 hover:text-blue-700 hover:shadow-sm'}`}
                                  title="Listen to pronunciation"
                               >
                                  <VolumeIcon />
                               </button>
                            )}
                         </div>
                      )}
                   </div>
                   
                   {isPersistent && (
                      <button onClick={closePanel} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 rounded-full transition-colors mt-0.5">
                         <CloseIcon />
                      </button>
                   )}
                </div>
                
                <div className={`flex flex-col gap-1.5 ${isPersistent ? 'mt-3 border-t border-slate-200/60 pt-4' : ''}`}>
                   {definitionData?.meanings && definitionData.meanings.length > 0 ? (
                      definitionData.meanings.map((m, i) => (
                        <div key={i} className={`flex flex-col gap-0.5 ${isPersistent ? 'mb-3' : 'mb-1.5'}`}>
                           <span className={`font-semibold italic text-blue-600 uppercase ${isPersistent ? 'text-[11px] tracking-wider mb-0.5' : 'text-[12px]'}`}>[{m.partOfSpeech}]</span>
                           <p className={`text-slate-700 ${isPersistent ? 'text-[15px] leading-relaxed' : 'text-[14px] leading-snug'}`}>{m.definition}</p>
                        </div>
                      ))
                   ) : (
                      <p className={`text-slate-800 font-medium ${isPersistent ? 'text-[16px] leading-relaxed' : 'text-[15px] leading-relaxed'}`}>
                        {definitionData?.meaning || "Definition not found."}
                      </p>
                   )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

root.render(<LexifyOverlay />);

// --- Subtitle Interception Logic ---

let currentVideo: HTMLVideoElement | null = null;
let pauseTimeout: number | null = null;
let hoverTimeout: number | null = null;
let currentWord: string | null = null;
let isLexifyEnabled = true;

// Initialize enabled state from storage ASAP
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get(['lexifyEnabled'], (result) => {
    if (result.lexifyEnabled !== undefined && result.lexifyEnabled !== null) {
      isLexifyEnabled = !!result.lexifyEnabled;
    }
  });

  // Listen for Live toggle changes from popup
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.lexifyEnabled) {
      isLexifyEnabled = !!changes.lexifyEnabled.newValue;
      if (!isLexifyEnabled) {
        // Immediately dismiss panel and resume video if user toggles off while watching
        currentWord = null;
        dispatchDefinitionEvent('CLEAR');
        if (currentVideo && currentVideo.paused && (window as any).lexifyIsPersistent) {
           (window as any).lexifyIsPersistent = false;
           currentVideo.play();
        }
      }
    }
  });
}

const dispatchDefinitionEvent = (type: string, payload?: any, word?: string) => {
  const event = new CustomEvent('LEXIFY_DEFINITION', { detail: { type, payload, word } });
  window.dispatchEvent(event);
};

// Helper to tokenize a caption segment by wrapping words in spans so hover works perfectly
const tokenizeCaptionSegment = (segment: HTMLElement) => {
  if (segment.hasAttribute('data-lexify-tokenized')) return;
  segment.setAttribute('data-lexify-tokenized', 'true');

  const text = segment.textContent || '';
  const words = text.split(/([\s\u00A0]+)/); 

  segment.textContent = ''; 

  words.forEach(word => {
    if (/^[\s\u00A0]+$/.test(word)) {
      segment.appendChild(document.createTextNode(word));
    } else {
      const span = document.createElement('span');
      span.textContent = word;
      span.className = 'lexify-word';
      span.style.cssText = 'pointer-events: auto !important; display: inline-block; border-radius: 4px; transition: background-color 0.15s; cursor: pointer !important;';
      
      span.addEventListener('mouseenter', () => {
         span.style.backgroundColor = 'rgba(77, 163, 255, 0.3)';
      });
      span.addEventListener('mouseleave', () => {
         span.style.backgroundColor = 'transparent';
      });
      span.addEventListener('click', (e) => {
         e.stopPropagation();
         const targetWord = span.textContent?.trim().replace(/[^a-zA-Z]/g, '') || "";
         if (targetWord) {
            // Hard lock the video playback
            if (currentVideo && !currentVideo.paused) {
               currentVideo.pause();
            }
            if (pauseTimeout) clearTimeout(pauseTimeout);
            
            dispatchDefinitionEvent('PERSISTENT_OPEN', null, targetWord);
            
            // If they clicked a DIFFERENT word than they are currently hovering, we need to fetch it immediately
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
    console.log('[Lexify] Dispatching LOADING for:', word);
    dispatchDefinitionEvent('LOADING', null, word);
    
    console.log('[Lexify] Sending fetch message to background for:', word);
    chrome.runtime.sendMessage({ type: 'FETCH_DEFINITION', word }, (response) => {
       if (chrome.runtime.lastError) {
          console.error('[Lexify] SendMessage Error:', chrome.runtime.lastError);
          dispatchDefinitionEvent('SUCCESS', { word, meaning: 'Connection error with extension background.' });
          return;
       }
       
       if (response && response.status === 'require_login') {
          dispatchDefinitionEvent('REQUIRE_LOGIN', null, word);
          chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
          return;
       }
       
       if (response && response.status === 'success') {
          const data = response.definition;
          let meaningString = '';
          let phoneticText = '';
          let audioUrl = '';
          let meaningsList: {partOfSpeech: string, definition: string}[] = [];
          
          if (Array.isArray(data) && data.length > 0) {
              const exactMatch = data.find(entry => entry.word?.toLowerCase() === word.toLowerCase()) || data[0];
              const meanings = exactMatch?.meanings || [];
              const phonetics = exactMatch?.phonetics || [];
              
              for (const p of phonetics) {
                if (p.text && !phoneticText) phoneticText = p.text;
                if (p.audio && !audioUrl) audioUrl = p.audio;
              }
              if (!phoneticText && exactMatch?.phonetic) {
                  phoneticText = exactMatch.phonetic;
              }
              
              const uniquePoS = new Set();
              for (const m of meanings) {
                 if (m.definitions && m.definitions.length > 0 && !uniquePoS.has(m.partOfSpeech)) {
                    uniquePoS.add(m.partOfSpeech);
                    meaningsList.push({
                        partOfSpeech: m.partOfSpeech,
                        definition: m.definitions[0].definition
                    });
                 }
                 if (meaningsList.length >= 4) break; 
              }
              meaningString = meaningsList.map(m => `[${m.partOfSpeech}] ${m.definition}`).join(' • ');
          }

          if (meaningsList.length > 0) {
             dispatchDefinitionEvent('SUCCESS', { word, meaning: meaningString, meanings: meaningsList, phoneticText, audioUrl });
             
             let timestamp = '0:00';
             if (currentVideo) {
               const minutes = Math.floor(currentVideo.currentTime / 60);
               const seconds = Math.floor(currentVideo.currentTime % 60).toString().padStart(2, '0');
               timestamp = `${minutes}:${seconds}`;
             }
             
             let contextSentence = captionSegment?.textContent?.trim() || '';

             chrome.runtime.sendMessage({
                type: 'SAVE_WORD',
                payload: { word, meaning: meaningString, videoUrl: window.location.href, timestamp, contextSentence }
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
  if (!isLexifyEnabled) return;
  const target = event.target as HTMLElement;
  let wordSpan = target.closest('.lexify-word') as HTMLElement;
  let captionSegment = target.closest('.ytp-caption-segment') as HTMLElement;

  if (!captionSegment) return;
  if (!captionSegment.hasAttribute('data-lexify-tokenized')) {
     tokenizeCaptionSegment(captionSegment);
     return;
  }
  if (!wordSpan) return;

  const rawWord = wordSpan.textContent?.trim() || "";
  const word = rawWord.replace(/[^a-zA-Z]/g, '');

  if (!word || word === currentWord) return;
  
  // If panel is persistent for another word, don't auto-switch on hover to prevent annoyance
  // Just let them hover without doing anything until they close it
  // We can track persistence from the window object for the content script natively
  if ((window as any).lexifyIsPersistent) return;
  
  currentWord = word;
  (window as any).lastHoverTime = Date.now();

  if (pauseTimeout) clearTimeout(pauseTimeout);
  if (hoverTimeout) clearTimeout(hoverTimeout);

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
  if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
  }

  setTimeout(() => {
    if (Date.now() - (window as any).lastHoverTime > 200) {
      currentWord = null;
      dispatchDefinitionEvent('CLEAR');
    }
  }, 200);

  pauseTimeout = window.setTimeout(() => {
    if (currentVideo && currentVideo.paused && !(window as any).lexifyIsPersistent) {
      currentVideo.play();
    }
  }, 300) as unknown as number;
};

const setupSubtitleObserver = () => {
  const videoPlayer = document.querySelector('video.html5-main-video') as HTMLVideoElement;
  if (videoPlayer) currentVideo = videoPlayer;

  const captionContainer = document.querySelector('.ytp-caption-window-container');
  if (captionContainer && !captionContainer.hasAttribute('data-lexify-bound')) {
    captionContainer.setAttribute('data-lexify-bound', 'true');
    captionContainer.addEventListener('mouseover', onWordHover as EventListener);
    captionContainer.addEventListener('mouseleave', onWordHoverOut as EventListener);
  } else if (!captionContainer) {
    setTimeout(setupSubtitleObserver, 1000);
  }
};

// Ensure we don't miss the load event if Chrome injects late (document_idle)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setupSubtitleObserver();
} else {
  window.addEventListener('load', setupSubtitleObserver);
}
window.addEventListener('yt-navigate-finish', () => { setTimeout(setupSubtitleObserver, 1000) });

// Keep the window variable in sync with React state so vanilla JS can block hovers/resume
window.addEventListener('LEXIFY_DEFINITION', (e: Event) => {
   const details = (e as CustomEvent).detail;
   if (details.type === 'PERSISTENT_OPEN') {
      (window as any).lexifyIsPersistent = true;
   } else if (details.type === 'PERSISTENT_CLOSE') {
      (window as any).lexifyIsPersistent = false;
      // Force unpause video physically when they explicitly click close
      if (currentVideo && currentVideo.paused) currentVideo.play();
      currentWord = null;
   }
});
