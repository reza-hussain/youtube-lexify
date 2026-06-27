"use client";

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

interface FeaturedReview {
  id: string;
  rating: number;
  message: string;
  anonymous: boolean;
  createdAt: string;
  user: { name: string | null; avatar: string | null } | null;
}

export default function Testimonials() {
  const [reviews, setReviews] = useState<FeaturedReview[]>([]);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    fetch(`${API}/feedback/featured`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setReviews(data); })
      .catch(() => {});
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-white border-t border-slate-100">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-3">Reviews</p>
          <h2 className="text-4xl font-bold text-slate-800 tracking-tight">What users are saying</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => {
            const name = r.anonymous || !r.user ? 'Anonymous' : (r.user.name ?? 'User');
            const initials = name === 'Anonymous' ? '?' : name[0].toUpperCase();
            return (
              <div key={r.id} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 flex flex-col gap-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className={s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'} />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed flex-1">&ldquo;{r.message}&rdquo;</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
