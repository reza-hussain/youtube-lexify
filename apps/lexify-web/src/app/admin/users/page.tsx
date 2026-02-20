"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, ShieldBan, MoreVertical, CheckCircle2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  _count: {
    wordSenses: number;
    sessions: number;
  };
}

export default function AdminUsers() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      if (!session) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/admin/users`, {
          headers: { Authorization: `Bearer ${(session as any).accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [session]);

  const toggleSuspend = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/users/${id}/suspend`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.id === id ? { ...u, status: updatedUser.status } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-sm text-slate-400 mt-1">Manage platform members and permissions</p>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
          />
        </div>
      </div>

      <div className="bg-slate-800/20 border border-slate-700/50 rounded-[18px] backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-800/50 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-300">User</th>
                  <th className="px-6 py-4 font-semibold text-slate-300">Words Saved</th>
                  <th className="px-6 py-4 font-semibold text-slate-300">Sessions</th>
                  <th className="px-6 py-4 font-semibold text-slate-300">Joined Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium">{user.name || 'No Name'}</p>
                          <p className="text-slate-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono">{user._count.wordSenses}</td>
                    <td className="px-6 py-4 text-slate-300 font-mono">{user._count.sessions}</td>
                    <td className="px-6 py-4 text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {user.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <ShieldBan className="w-3.5 h-3.5" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'SUPER_ADMIN' && (
                        <button 
                          onClick={() => toggleSuspend(user.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                            user.status === 'ACTIVE' 
                            ? "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white"
                            : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          }`}
                        >
                          {user.status === 'ACTIVE' ? 'Suspend' : 'Unsuspend'}
                        </button>
                      )}
                      {user.role === 'SUPER_ADMIN' && (
                        <span className="text-xs text-sky-400 font-semibold bg-sky-400/10 px-2 py-1 rounded-md">ADMIN</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500">No users found matching your search.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
