"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, ShieldAlert } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const adminNavItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Words Analytics", href: "/admin/words", icon: BookOpen },
  { name: "Settings & Logs", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      // Allow them to stay on login page if unauthenticated
      if (pathname !== "/admin/login") {
        router.push("/admin/login");
      }
    } else if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      } else if (pathname === "/admin/login") {
        // If already admin, redirect away from login to dashboard
        router.push("/admin");
      }
    }
  }, [status, session, pathname, router]);

  // If the user goes to the login page specifically, do not render the sidebar layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (status === "loading") {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Admin...</div>;
  }

  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return null; // Don't flash the UI while redirecting
  }

  // We rely on the backend to enforce security on data, but we can do a soft client-side check if role is exposed in session. 
  // For now, if they are here, we allow rendering, but data fetches will 403 if they aren't admin.

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-sky-500/30">
      {/* Ambient Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-sky-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex h-screen relative z-10 p-4 gap-6 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-[18px] flex flex-col shadow-2xl overflow-hidden">
          <div className="p-6 flex items-center gap-3 border-b border-slate-700/50">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-300 flex items-center justify-center shadow-[0_0_20px_rgba(77,163,255,0.3)]">
              <ShieldAlert className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight">Lexify</h1>
              <span className="text-xs text-sky-400 font-medium">Owner Panel</span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-sky-500/15 text-sky-400 border border-sky-500/20 shadow-[0_4px_20px_-4px_rgba(14,165,233,0.15)]"
                      : "text-slate-400 hover:bg-slate-700/30 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-sky-400" : "text-slate-400"}`} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-700/50">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-[18px] overflow-hidden flex flex-col shadow-xl">
          <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
