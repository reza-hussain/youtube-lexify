"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BookOpen, Languages, Sparkles } from "lucide-react";

interface WordStat {
  word: string;
  language: string;
  _count: { word: number };
}

interface LangStat {
  language: string;
  _count: { language: number };
}

export default function AdminWords() {
  const { data: session } = useSession();
  const [topWords, setTopWords] = useState<WordStat[]>([]);
  const [byLanguage, setByLanguage] = useState<LangStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWords() {
      if (!session) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/admin/words`, {
          headers: { Authorization: `Bearer ${(session as any).accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTopWords(data.topWords);
          setByLanguage(data.byLanguage);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchWords();
  }, [session]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white">Words Analytics</h2>
        <p className="text-slate-400 mt-2">Insights on vocabulary engagement across Lexify</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Words List */}
        <div className="lg:col-span-2 bg-slate-800/20 border border-slate-700/50 rounded-[18px] backdrop-blur-sm overflow-hidden p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Top Interacted Words
          </h3>
          
          {loading ? (
            <div className="text-slate-500 py-8 text-center">Loading words data...</div>
          ) : topWords.length === 0 ? (
            <div className="text-slate-500 py-8 text-center bg-slate-800/50 rounded-xl border border-dashed border-slate-700">No words saved yet.</div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {topWords.map((item, index) => (
                <div key={`${item.word}-${index}`} className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-slate-600 w-6 text-center">{index + 1}</span>
                    <div>
                      <p className="font-semibold text-white text-lg tracking-wide">{item.word}</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-700 text-slate-300 uppercase tracking-wider">{item.language}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-sky-400">{item._count.word}</span>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Saves</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language Distribution */}
        <div className="bg-slate-800/20 border border-slate-700/50 rounded-[18px] backdrop-blur-sm p-6 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <Languages className="w-5 h-5 text-purple-400" />
            Language Distribution
          </h3>
          
          {loading ? (
            <div className="text-slate-500 py-8 text-center">Loading language data...</div>
          ) : byLanguage.length === 0 ? (
            <div className="text-slate-500 py-8 text-center">No language data.</div>
          ) : (
            <div className="flex-1 flex flex-col gap-4">
              {byLanguage.map((item, idx) => {
                const total = byLanguage.reduce((acc, curr) => acc + curr._count.language, 0);
                const percent = Math.round((item._count.language / total) * 100);
                return (
                  <div key={item.language} className="relative p-4 rounded-xl border border-slate-700/50 overflow-hidden group">
                    <div 
                      className="absolute inset-y-0 left-0 bg-purple-500/10 transition-all duration-1000 ease-out" 
                      style={{ width: `${percent}%` }}
                    />
                    <div className="relative z-10 flex justify-between items-center">
                      <span className="uppercase font-bold tracking-wider text-slate-300">{item.language}</span>
                      <div className="text-right">
                        <span className="font-bold text-white block">{item._count.language} words</span>
                        <span className="text-xs text-purple-400 font-semibold">{percent}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
