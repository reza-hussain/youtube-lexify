"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, BookOpen, Activity, TrendingUp, BookKey } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Dummy data for charts until we build the historical tracking API
const growthData = [
  { name: 'Mon', users: 12 },
  { name: 'Tue', users: 19 },
  { name: 'Wed', users: 24 },
  { name: 'Thu', users: 31 },
  { name: 'Fri', users: 45 },
  { name: 'Sat', users: 62 },
  { name: 'Sun', users: 85 },
];

export default function AdminOverview() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWordsSaved: 0,
    dau: 0,
    mau: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      if (!session) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/admin/overview`, {
          headers: {
            Authorization: `Bearer ${(session as any).accessToken}`,
          },
        });
        if (!res.ok) {
          if (res.status === 403) throw new Error("Requires Super Admin role.");
          throw new Error("Failed to load generic stats");
        }
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [session]);

  if (loading) return <div className="text-slate-400">Loading overview...</div>;
  if (error) return <div className="text-red-400 bg-red-400/10 p-4 border border-red-500/20 rounded-xl">Error: {error}</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300">
          Executive Overview
        </h2>
        <p className="text-slate-400 mt-2 text-sm">Lexify Platform Activity & Growth</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Users" value={stats.totalUsers} icon={<Users />} trend="+12% (7d)" />
        <KpiCard title="Daily Active (DAU)" value={stats.dau} icon={<Activity />} trend="Stable" />
        <KpiCard title="Total Words Saved" value={stats.totalWordsSaved} icon={<BookOpen />} trend="+8% (7d)" />
        <KpiCard title="Monthly Active (MAU)" value={stats.mau} icon={<TrendingUp />} trend="Growing" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-slate-800/20 border border-slate-700/50 p-6 rounded-[18px] backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-400" />
            Active Users (7 Days)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#bae6fd' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#38bdf8" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#bae6fd' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/20 border border-slate-700/50 p-6 rounded-[18px] backdrop-blur-sm flex flex-col items-center justify-center text-center">
            <BookKey className="w-16 h-16 text-cyan-500/50 mb-4" />
            <h3 className="text-xl font-bold text-slate-200">Word Density Visualization</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-[250px]">
              More charting modules (Pie charts, Heatmaps) will be deployed in the next phase.
            </p>
        </div>
      </div>
      
    </div>
  );
}

function KpiCard({ title, value, icon, trend }: { title: string; value: string | number; icon: React.ReactNode; trend: string }) {
  return (
    <div className="p-6 bg-slate-800/40 relative overflow-hidden backdrop-blur-md rounded-[18px] border border-slate-700/50 hover:bg-slate-700/40 transition-colors shadow-lg group">
      
      {/* Decorative Glow */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all" />
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-1 shadow-sm">{value}</p>
        </div>
        <div className="p-3 bg-slate-700/50 text-sky-400 rounded-xl border border-slate-600/30">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 relative z-10">
        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {trend}
        </span>
      </div>
    </div>
  );
}
