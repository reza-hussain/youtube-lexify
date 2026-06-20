"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"google" | "email">("google");
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        const res = await fetch(`${API}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.message || "Registration failed");
        }
      }
      const result = await signIn("user-credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("Invalid email or password");
      if (!result?.error) router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      <Link href="/" className="mb-8 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        ← Back to home
      </Link>

      <div className="w-full max-w-md bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[24px] p-10 border border-slate-200 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400/10 rounded-full blur-[40px]" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-400/10 rounded-full blur-[40px]" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">L</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold mb-1 text-slate-800 tracking-tight text-center">Welcome back</h1>
          <p className="text-slate-500 mb-8 text-sm text-center">Sign in to manage your vocabulary.</p>

          <div className="flex bg-slate-100 rounded-xl p-1 mb-6 gap-1">
            <button
              onClick={() => setTab("google")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "google" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Google
            </button>
            <button
              onClick={() => setTab("email")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "email" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Email
            </button>
          </div>

          {tab === "google" ? (
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full py-3 px-6 bg-white hover:bg-slate-50 text-slate-800 rounded-xl font-semibold shadow-sm border border-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
          ) : (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
              {isRegister && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-60 text-sm mt-1"
              >
                {loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(r => !r); setError(""); }}
                className="text-xs text-slate-500 hover:text-slate-700 text-center transition-colors mt-1"
              >
                {isRegister ? "Already have an account? Sign in" : "Don't have an account? Register"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
