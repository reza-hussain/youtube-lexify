"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { BookOpen, LogOut, ExternalLink, Search, Clock, PlayCircle, Download, BarChart3, List, TrendingUp, CalendarDays } from "lucide-react";

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
  const [words, setWords] = useState<WordSense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');

  useEffect(() => {
    if (session && (session as any).accessToken) {
      fetchWords();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchWords = async () => {
    try {
      const jwt = (session as any).accessToken;
      
      const wordsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/words`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      if (!wordsRes.ok) {
        if (wordsRes.status === 401) {
          signOut();
          return;
        }
        throw new Error("Failed to fetch words from API");
      }
      
      const data = await wordsRes.json();
      setWords(data);
    } catch (error) {
      console.error("Error fetching words:", error);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format: 'json' | 'csv') => {
    let content = '';
    let type = '';
    let filename = `lexify-export-${new Date().toISOString().split('T')[0]}`;

    if (format === 'json') {
      content = JSON.stringify(words, null, 2);
      type = 'application/json';
      filename += '.json';
    } else if (format === 'csv') {
      const headers = ['Word', 'Meaning', 'Encounters', 'Date Saved'];
      const rows = words.map(w => [
        `"${w.word.replace(/"/g, '""')}"`,
        `"${w.meaning.replace(/"/g, '""')}"`,
        w.encounters?.length || 0,
        new Date(w.createdAt).toLocaleDateString()
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      type = 'text/csv';
      filename += '.csv';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white p-4 font-sans">
        <div className="w-full max-w-md bg-white/60 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[24px] p-10 border border-white/80 text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-[40px]"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-400/20 rounded-full blur-[40px]"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20 flex items-center justify-center mb-8">
              <span className="text-white text-4xl font-bold tracking-tighter">L</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-3 text-slate-800 tracking-tight">Lexify</h1>
            <p className="text-slate-500 mb-10 text-sm leading-relaxed px-4">
              Sign in to view and manage your collected vocabulary from YouTube.
            </p>
            
            <button
              onClick={() => signIn("google")}
              className="w-full py-3 px-6 bg-white hover:bg-slate-50 text-slate-800 rounded-xl font-semibold shadow-sm border border-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredWords = words.filter(w => 
    w.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Analytics Computations ---
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
        
        <header className="flex items-center justify-between mb-12 bg-white/60 backdrop-blur-md border border-white p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="text-white text-xl font-bold">L</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Lexify Dashboard</h1>
          </div>
          
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
            <button 
               onClick={() => setViewMode('list')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
               <List size={16} />
               Dictionary
            </button>
            <button 
               onClick={() => setViewMode('analytics')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${viewMode === 'analytics' ? 'bg-white shadow-sm text-blue-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
               <BarChart3 size={16} />
               Analytics
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100/50 px-4 py-2 rounded-full border border-slate-200/50">
              {session.user?.image && (
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full bg-slate-200 object-cover" 
                  onError={(e) => {
                    e.currentTarget.onerror = null; // Prevent infinite fallback loops
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || 'U')}&background=3b82f6&color=fff`;
                  }}
                />
              )}
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{session.user?.name}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

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
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-blue-50/50 px-5 py-3 rounded-2xl border border-blue-100/50 shadow-sm ml-2">
                <BookOpen size={18} className="text-blue-500" />
                <span>{words.length} Senses Collected</span>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'analytics' && (
          <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500 pb-12">
            {/* KPI Cards */}
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
               {/* Last 7 Days Activity */}
               <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-3 mb-8">
                     <CalendarDays size={20} className="text-slate-400" />
                     <h2 className="text-lg font-bold text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">Learning Activity (Last 7 Days)</h2>
                  </div>
                  
                  <div className="flex items-end justify-between h-48 gap-2 pt-4 border-b border-slate-100 pb-2">
                     {(() => {
                        // Compute last 7 days data
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

               {/* Top Words Leaderboard */}
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

        {/* Dictionary Layout View */}
        {viewMode === 'list' && (
           <>
              {/* Content Area */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin"></div>
                </div>
              ) : words.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-16 text-center shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
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
                      className="group flex flex-col bg-white/70 hover:bg-white backdrop-blur-xl border border-slate-200/60 hover:border-blue-200 rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.08)] transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                           <h3 className="text-xl font-bold text-slate-800 capitalize tracking-tight">{word.word}</h3>
                           <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                              Encountered {word.encounters?.length || 0} times
                           </span>
                        </div>
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                          <BookOpen size={18} />
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
                  
                  {filteredWords.length === 0 && searchQuery && (
                    <div className="col-span-full text-center py-12 text-slate-500 font-medium">
                      No words matching "{searchQuery}"
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
