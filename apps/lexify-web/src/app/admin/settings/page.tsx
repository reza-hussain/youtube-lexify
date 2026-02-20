"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ToggleLeft, ToggleRight, ServerCrash, ShieldCheck } from "lucide-react";

interface FeatureFlag {
  key: string;
  name: string;
  isEnabled: boolean;
}

export default function AdminSettings() {
  const { data: session } = useSession();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  // Default flags if DB is empty to bootstrap UI
  const expectedFlags = ['enableNetflix', 'enableHoverMode', 'enableAiFallback'];

  useEffect(() => {
    async function fetchFlags() {
      if (!session) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/admin/feature-flags`, {
          headers: { Authorization: `Bearer ${(session as any).accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Merge db flags with expected
          const merged = expectedFlags.map(k => {
            const found = data.find((d: any) => d.key === k);
            return found || { key: k, name: k, isEnabled: false };
          });
          setFlags(merged);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFlags();
  }, [session]);

  const toggleFlag = async (key: string, current: boolean) => {
    try {
      // Optimistic UI update
      setFlags(flags.map(f => f.key === key ? { ...f, isEnabled: !current } : f));
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/feature-flags`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${(session as any).accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key, isEnabled: !current })
      });
      
      if (!res.ok) throw new Error('Toggle failed');
    } catch (err) {
      console.error(err);
      // Revert on fail
      setFlags(flags.map(f => f.key === key ? { ...f, isEnabled: current } : f));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold text-white">Settings & System</h2>
        <p className="text-slate-400 mt-2">Manage feature rollouts and monitor platform logs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Feature Flags */}
        <div className="bg-slate-800/20 border border-slate-700/50 rounded-[18px] backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <ToggleLeft className="w-5 h-5 text-sky-400" />
            Feature Flags
          </h3>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-slate-500 text-sm">Loading flags...</div>
            ) : (
              flags.map(flag => (
                <div key={flag.key} className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-slate-200">{flag.key}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">Globally toggle feature access.</p>
                  </div>
                  <button 
                    onClick={() => toggleFlag(flag.key, flag.isEnabled)}
                    className="focus:outline-none transition-transform active:scale-95"
                  >
                    {flag.isEnabled ? (
                      <ToggleRight className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-600" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Logs Placeholder */}
        <div className="bg-slate-800/20 border border-slate-700/50 rounded-[18px] backdrop-blur-sm p-6 overflow-hidden">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <ServerCrash className="w-5 h-5 text-red-400" />
            System Diagnostics
          </h3>
          
          <div className="h-48 flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-xl bg-slate-900/30">
            <ShieldCheck className="w-12 h-12 text-emerald-500/50 mb-3" />
            <span className="text-emerald-400 font-medium">All Systems Operational</span>
            <span className="text-xs text-slate-500 mt-1 block">Live logging infrastructure pending in v1.2</span>
          </div>
        </div>

      </div>
    </div>
  );
}
