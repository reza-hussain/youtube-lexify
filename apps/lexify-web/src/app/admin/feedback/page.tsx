"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Star, StarOff, MessageSquare, Bug, Lightbulb } from "lucide-react";

interface Feedback {
  id: string;
  rating: number;
  category: string;
  message: string;
  anonymous: boolean;
  featured: boolean;
  createdAt: string;
  user: { name: string | null; email: string | null; avatar: string | null } | null;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const categoryConfig = {
  review: { label: "Review", icon: MessageSquare, color: "text-blue-500 bg-blue-50 border-blue-200" },
  bug: { label: "Bug Report", icon: Bug, color: "text-red-500 bg-red-50 border-red-200" },
  feature: { label: "Feature Request", icon: Lightbulb, color: "text-amber-500 bg-amber-50 border-amber-200" },
};

export default function AdminFeedback() {
  const { data: session } = useSession();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "review" | "bug" | "feature">("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const jwt = (session as any)?.accessToken;

  useEffect(() => {
    if (!session) return;
    fetch(`${API}/admin/feedback`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then((r) => r.json())
      .then(setFeedbacks)
      .finally(() => setLoading(false));
  }, [session]);

  const toggleFeatured = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await fetch(`${API}/admin/feedback/${id}/feature`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, featured: updated.featured } : f)));
      }
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = filter === "all" ? feedbacks : feedbacks.filter((f) => f.category === filter);

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : "—";

  const counts = { review: 0, bug: 0, feature: 0 };
  feedbacks.forEach((f) => { if (f.category in counts) counts[f.category as keyof typeof counts]++; });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Feedback</h1>
        <p className="text-slate-400 text-sm">User reviews, bug reports, and feature requests.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: feedbacks.length, color: "text-white" },
          { label: "Avg Rating", value: `${avgRating} ★`, color: "text-yellow-400" },
          { label: "Reviews", value: counts.review, color: "text-blue-400" },
          { label: "Featured", value: feedbacks.filter((f) => f.featured).length, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-700/40 border border-slate-700/50 rounded-2xl p-4">
            <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "review", "bug", "feature"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${
              filter === f
                ? "bg-sky-500/15 border-sky-500/30 text-sky-400"
                : "border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600"
            }`}
          >
            {f === "all" ? `All (${feedbacks.length})` : `${categoryConfig[f].label} (${counts[f]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading feedback...</div>
      ) : filtered.length === 0 ? (
        <div className="text-slate-500 text-sm py-12 text-center">No feedback yet.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((fb) => {
            const cat = categoryConfig[fb.category as keyof typeof categoryConfig];
            const Icon = cat?.icon ?? MessageSquare;
            return (
              <div
                key={fb.id}
                className={`bg-slate-800/50 border rounded-2xl p-5 flex gap-4 items-start ${fb.featured ? "border-yellow-500/40" : "border-slate-700/50"}`}
              >
                {/* Left: avatar / anon */}
                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center shrink-0 text-slate-400 font-bold text-sm">
                  {fb.anonymous || !fb.user ? "?" : (fb.user.name?.[0] ?? fb.user.email?.[0] ?? "?")}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-white">
                      {fb.anonymous || !fb.user ? "Anonymous" : fb.user.name ?? fb.user.email ?? "Unknown"}
                    </span>
                    {!fb.anonymous && fb.user?.email && (
                      <span className="text-xs text-slate-500">{fb.user.email}</span>
                    )}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${cat?.color}`}>
                      <Icon size={10} /> {cat?.label}
                    </span>
                    {fb.featured && (
                      <span className="text-[11px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                        ★ Featured
                      </span>
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={13}
                        className={s <= fb.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600 fill-slate-600"}
                      />
                    ))}
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">{fb.message}</p>
                  <p className="text-xs text-slate-600 mt-2">{new Date(fb.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                </div>

                {/* Feature toggle */}
                <button
                  onClick={() => toggleFeatured(fb.id)}
                  disabled={togglingId === fb.id}
                  title={fb.featured ? "Remove from featured" : "Feature on landing page"}
                  className={`shrink-0 p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
                    fb.featured
                      ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20"
                      : "border-slate-700/50 text-slate-500 hover:text-yellow-400 hover:border-yellow-500/40"
                  }`}
                >
                  {fb.featured ? <Star size={16} className="fill-yellow-400" /> : <StarOff size={16} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
