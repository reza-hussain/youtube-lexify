"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ToggleLeft, ToggleRight, ServerCrash, ShieldCheck, Cpu } from "lucide-react";

interface FeatureFlag {
  key: string;
  name: string;
  isEnabled: boolean;
}

interface AppSetting {
  key: string;
  value: string;
}

const API_PROVIDERS = [
  { value: "claude", label: "Claude Haiku (Anthropic)", description: "Fast, affordable. Uses your ANTHROPIC_API_KEY." },
  { value: "gemini", label: "Gemini Flash (Google)", description: "Free 1M tokens/day tier. Requires GEMINI_API_KEY setup." },
];

const expectedFlags = ['enableNetflix', 'enableHoverMode', 'enableAiFallback'];

export default function AdminSettings() {
  const { data: session } = useSession();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [appSettings, setAppSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (!session) return;

    async function fetchAll() {
      const headers = { Authorization: `Bearer ${(session as any).accessToken}` };

      const [flagsRes, settingsRes] = await Promise.allSettled([
        fetch(`${apiUrl}/admin/feature-flags`, { headers }),
        fetch(`${apiUrl}/admin/app-settings`, { headers }),
      ]);

      if (flagsRes.status === "fulfilled" && flagsRes.value.ok) {
        const data = await flagsRes.value.json();
        const merged = expectedFlags.map(k => {
          const found = data.find((d: any) => d.key === k);
          return found || { key: k, name: k, isEnabled: false };
        });
        setFlags(merged);
      }
      setLoading(false);

      if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
        const data = await settingsRes.value.json();
        setAppSettings(data);
      }
      setSettingsLoading(false);
    }

    fetchAll();
  }, [session]);

  const toggleFlag = async (key: string, current: boolean) => {
    setFlags(flags.map(f => f.key === key ? { ...f, isEnabled: !current } : f));
    try {
      const res = await fetch(`${apiUrl}/admin/feature-flags`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, isEnabled: !current }),
      });
      if (!res.ok) throw new Error('Toggle failed');
    } catch {
      setFlags(flags.map(f => f.key === key ? { ...f, isEnabled: current } : f));
    }
  };

  const updateAppSetting = async (key: string, value: string) => {
    setSavingKey(key);
    // Optimistic update
    setAppSettings(prev => {
      const existing = prev.find(s => s.key === key);
      if (existing) return prev.map(s => s.key === key ? { ...s, value } : s);
      return [...prev, { key, value }];
    });
    try {
      await fetch(`${apiUrl}/admin/app-settings`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });
    } catch (err) {
      console.error('Failed to save setting:', err);
    } finally {
      setSavingKey(null);
    }
  };

  const getSettingValue = (key: string, fallback: string) =>
    appSettings.find(s => s.key === key)?.value ?? fallback;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold text-white">Settings & System</h2>
        <p className="text-slate-400 mt-2">Manage feature rollouts and platform configuration</p>
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

        {/* System Diagnostics */}
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

        {/* AI Provider */}
        <div className="bg-slate-800/20 border border-slate-700/50 rounded-[18px] backdrop-blur-sm p-6 md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-400" />
            AI Provider
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Controls which AI model powers context-aware definitions for PRO users. Changes take effect within 60 seconds.
          </p>

          {settingsLoading ? (
            <div className="text-slate-500 text-sm">Loading settings...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {API_PROVIDERS.map(provider => {
                const isActive = getSettingValue('aiProvider', 'claude') === provider.value;
                const isSaving = savingKey === 'aiProvider';
                return (
                  <button
                    key={provider.value}
                    onClick={() => updateAppSetting('aiProvider', provider.value)}
                    disabled={isSaving}
                    className={`text-left p-5 rounded-xl border-2 transition-all ${
                      isActive
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                    } ${isSaving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-200">{provider.label}</span>
                      {isActive && (
                        <span className="text-xs font-semibold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{provider.description}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
