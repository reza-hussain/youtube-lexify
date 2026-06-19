"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Check, Zap, BookOpen, Brain, Download, Infinity as InfinityIcon, ArrowLeft, AlertTriangle, RotateCcw, Calendar, CreditCard, X } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const PLANS = {
  monthly: {
    price: "$5", period: "/month", total: null,
    stripePriceId:   process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY   || "",
    razorpayPlanId:  process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID_MONTHLY  || "",
  },
  annual: {
    price: "$4", period: "/month", total: "billed $40/year",
    stripePriceId:   process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL    || "",
    razorpayPlanId:  process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID_ANNUAL   || "",
  },
};

const PRO_FEATURES = [
  { icon: InfinityIcon, label: "Unlimited word lookups" },
  { icon: Brain,        label: "AI definitions for rare words" },
  { icon: BookOpen,     label: "Full vocabulary history" },
  { icon: Zap,          label: "Spaced repetition flashcards" },
  { icon: Download,     label: "Export to CSV & Anki" },
];

const FREE_FEATURES = [
  "30 lookups/day",
  "Last 50 words in history",
  "Standard dictionary definitions",
  "Basic dashboard",
];

interface SubDetails {
  tier: string;
  status: string;
  subscription: {
    id: string;
    stripeStatus: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
    planName: string;
    amount: number | null;
    currency: string;
  } | null;
}

// Load Razorpay checkout script dynamically
function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const { data: session, status } = useSession();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<SubDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const jwt = (session as any)?.accessToken;

  useEffect(() => {
    if (status === 'loading') return;
    if (!jwt) { setDetailsLoading(false); return; }
    fetch(`${API}/subscription/details`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then(r => r.json())
      .then(setDetails)
      .catch(() => {})
      .finally(() => setDetailsLoading(false));
  }, [jwt, status]);

  const isPro = details?.tier === "PRO";
  const sub = details?.subscription;

  // Called when user clicks "Upgrade to Pro" — shows the provider picker modal
  const handleUpgradeClick = () => {
    if (!session) { signIn("google", { callbackUrl: "/pricing" }); return; }
    setShowPaymentModal(true);
  };

  const handleStripe = async () => {
    setLoading(true);
    setShowPaymentModal(false);
    try {
      const res = await fetch(`${API}/subscription/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({
          priceId: PLANS[billing].stripePriceId,
          successUrl: `${window.location.origin}/?upgraded=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleRazorpay = async () => {
    setLoading(true);
    setShowPaymentModal(false);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Razorpay SDK failed to load');

      const res = await fetch(`${API}/subscription/razorpay-subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ planId: PLANS[billing].razorpayPlanId }),
      });
      if (!res.ok) throw new Error();
      const { subscriptionId, keyId, prefill } = await res.json();

      const rzp = new (window as any).Razorpay({
        key: keyId,
        subscription_id: subscriptionId,
        name: 'Lexify',
        description: 'Lexify Pro — Unlimited vocabulary learning',
        handler: async (response: any) => {
          const verifyRes = await fetch(`${API}/subscription/razorpay-verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
            body: JSON.stringify({
              subscriptionId: response.razorpay_subscription_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });
          if (verifyRes.ok) {
            window.location.href = '/?upgraded=true';
          }
        },
        prefill,
        theme: { color: '#3b82f6' },
      });
      rzp.open();
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await fetch(`${API}/subscription`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      // Refresh details
      const r = await fetch(`${API}/subscription/details`, { headers: { Authorization: `Bearer ${jwt}` } });
      setDetails(await r.json());
      setConfirmCancel(false);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleReactivate = async () => {
    setLoading(true);
    try {
      await fetch(`${API}/subscription/reactivate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const r = await fetch(`${API}/subscription/details`, { headers: { Authorization: `Bearer ${jwt}` } });
      setDetails(await r.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const renewalDate = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-12">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-14">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
            <span className="text-white text-2xl font-bold">L</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-4">
            {isPro ? "Your Subscription" : "Upgrade to Lexify Pro"}
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            {isPro
              ? "Manage your plan, view billing details, or cancel at any time."
              : "Supercharge your vocabulary learning. Unlimited lookups, AI-powered definitions, and smarter review."}
          </p>
        </div>

        {/* ── PRO MANAGEMENT VIEW ── */}
        {!detailsLoading && isPro && (
          <div className="max-w-2xl mx-auto flex flex-col gap-6">

            {/* Cancellation notice banner */}
            {sub?.cancelAtPeriodEnd && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Subscription ending {renewalDate}</p>
                  <p className="text-xs text-amber-600 mt-0.5">You still have full Pro access until then. Changed your mind?</p>
                </div>
                <button
                  onClick={handleReactivate}
                  disabled={loading}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RotateCcw size={12} />
                  Keep Pro
                </button>
              </div>
            )}

            {/* Plan card */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-500 to-cyan-400 flex items-center justify-center">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Lexify Pro</p>
                    <p className="text-xs text-slate-500">{sub?.planName ?? "Pro"} plan</p>
                  </div>
                </div>
                {sub?.amount != null && (
                  <span className="text-2xl font-extrabold text-slate-800">
                    {sub.currency === "INR" ? "₹" : "$"}{sub.amount}
                    <span className="text-sm font-medium text-slate-400">/{sub.planName === "Annual" ? "yr" : "mo"}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={14} className="text-slate-400" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {sub?.cancelAtPeriodEnd ? "Access Until" : "Renews On"}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{renewalDate ?? "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={14} className="text-slate-400" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</p>
                  </div>
                  <p className={`text-sm font-bold ${sub?.cancelAtPeriodEnd ? "text-amber-600" : "text-green-600"}`}>
                    {sub?.cancelAtPeriodEnd ? "Canceling" : "Active"}
                  </p>
                </div>
              </div>
            </div>

            {/* What's included */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500 mb-4">What's included</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRO_FEATURES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-blue-500" />
                    </div>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cancel section */}
            {sub && !sub.cancelAtPeriodEnd && (
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-800 mb-1">Cancel subscription</p>
                <p className="text-xs text-slate-500 mb-4">
                  You'll keep Pro access until {renewalDate}. No refunds are issued for partial periods.
                </p>
                {!confirmCancel ? (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                  >
                    Cancel subscription
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-600">Are you sure?</p>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="text-sm font-bold text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {loading ? "Canceling..." : "Yes, cancel"}
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="text-sm font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl transition-colors"
                    >
                      Never mind
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── UPGRADE VIEW (free / not logged in) ── */}
        {!detailsLoading && !isPro && (
          <>
            {/* Billing toggle */}
            <div className="flex justify-center mb-12">
              <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
                <button
                  onClick={() => setBilling("monthly")}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${billing === "monthly" ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${billing === "annual" ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Annual
                  <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SAVE 20%</span>
                </button>
              </div>
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Free plan */}
              <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[28px] p-8 shadow-sm flex flex-col">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Free</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-800">$0</span>
                    <span className="text-slate-400 font-medium">forever</span>
                  </div>
                </div>
                <ul className="flex flex-col gap-3 flex-1 mb-8">
                  {FREE_FEATURES.map(f => (
                    <li key={f} className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                      <Check size={16} className="text-slate-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="w-full py-3 px-6 rounded-xl font-semibold text-sm text-center text-slate-500 bg-slate-100 border border-slate-200">
                  Current Plan
                </div>
              </div>

              {/* Pro plan */}
              <div className="relative bg-gradient-to-br from-blue-600 to-cyan-500 rounded-[28px] p-8 shadow-xl shadow-blue-500/20 flex flex-col overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                <div className="relative mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-bold text-white">Pro</h2>
                    <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase">Best Value</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{PLANS[billing].price}</span>
                    <span className="text-white/70 font-medium">{PLANS[billing].period}</span>
                  </div>
                  {PLANS[billing].total && <p className="text-white/60 text-xs mt-1 font-medium">{PLANS[billing].total}</p>}
                </div>
                <ul className="flex flex-col gap-3 flex-1 mb-8 relative">
                  {PRO_FEATURES.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-white text-sm font-medium">
                      <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <Icon size={13} className="text-white" />
                      </div>
                      {label}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleUpgradeClick}
                  disabled={loading}
                  className="relative w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-white text-blue-600 hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? "Processing..." : session ? "Upgrade to Pro" : "Sign in to Upgrade"}
                </button>
              </div>
            </div>

            <p className="text-center text-slate-400 text-sm mt-10">
              Secure payment via Stripe. Cancel anytime. No hidden fees.
            </p>
          </>
        )}

        {/* Loading skeleton */}
        {detailsLoading && (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Payment provider modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[28px] shadow-2xl p-8">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-extrabold text-slate-800 mb-1">Choose payment method</h2>
            <p className="text-sm text-slate-500 mb-7">
              Select how you'd like to pay for Lexify Pro ({billing === 'annual' ? '$4/mo billed annually' : '$5/mo'}).
            </p>

            <div className="flex flex-col gap-3">
              {/* Stripe */}
              <button
                onClick={handleStripe}
                className="flex items-center gap-4 w-full border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl px-5 py-4 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#635BFF] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 group-hover:text-blue-700">Pay with Stripe</p>
                  <p className="text-xs text-slate-500">Credit/debit card, international</p>
                </div>
              </button>

              {/* Razorpay */}
              <button
                onClick={handleRazorpay}
                className="flex items-center gap-4 w-full border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl px-5 py-4 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#072654] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 40 40" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4L6 12v16l14 8 14-8V12L20 4z" fill="#3395FF"/>
                    <path d="M20 4v36M6 12l14 8 14-8" stroke="white" strokeWidth="1.5" fill="none"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 group-hover:text-blue-700">Pay with Razorpay</p>
                  <p className="text-xs text-slate-500">UPI, cards, net banking, wallets</p>
                </div>
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-6">
              Secure, encrypted payments. Cancel anytime.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
