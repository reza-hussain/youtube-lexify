"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface BetaRequest {
  id: string;
  status: string;
  source: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  user: { email: string; name: string; createdAt: string; betaProExpiresAt: string | null };
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function AdminBeta() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<BetaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const jwt = (session as any)?.accessToken;

  useEffect(() => {
    if (!session) return;
    fetch(`${API}/admin/beta/requests`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then((r) => r.json())
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, jwt]);

  const handleAction = async (requestId: string, action: "grant" | "reject") => {
    setActionLoading(requestId + action);
    try {
      const res = await fetch(`${API}/admin/beta/${action}/${requestId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? { ...r, status: action === "grant" ? "APPROVED" : "REJECTED", reviewedAt: new Date().toISOString() }
              : r
          )
        );
      }
    } catch { /* ignore */ } finally {
      setActionLoading(null);
    }
  };

  const pending = requests.filter((r) => r.status === "PENDING");
  const reviewed = requests.filter((r) => r.status !== "PENDING");
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Beta Access Requests</h1>
          <p className="text-sm text-slate-500 mt-1">{approvedCount} / 50 slots used</p>
        </div>
        <div className="w-32 bg-slate-100 rounded-full h-2.5">
          <div
            className="bg-violet-500 h-2.5 rounded-full transition-all"
            style={{ width: `${Math.min(100, (approvedCount / 50) * 100)}%` }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-violet-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Pending ({pending.length})
              </h2>
              <div className="flex flex-col gap-3">
                {pending.map((req) => (
                  <RequestRow
                    key={req.id}
                    req={req}
                    onGrant={() => handleAction(req.id, "grant")}
                    onReject={() => handleAction(req.id, "reject")}
                    loading={actionLoading}
                  />
                ))}
              </div>
            </section>
          )}

          {pending.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No pending requests</div>
          )}

          {/* Reviewed */}
          {reviewed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Reviewed ({reviewed.length})
              </h2>
              <div className="flex flex-col gap-3">
                {reviewed.map((req) => (
                  <RequestRow key={req.id} req={req} loading={actionLoading} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function RequestRow({
  req,
  onGrant,
  onReject,
  loading,
}: {
  req: BetaRequest;
  onGrant?: () => void;
  onReject?: () => void;
  loading: string | null;
}) {
  const isPending = req.status === "PENDING";

  return (
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            req.status === "APPROVED"
              ? "bg-green-100"
              : req.status === "REJECTED"
              ? "bg-red-100"
              : "bg-amber-100"
          }`}
        >
          {req.status === "APPROVED" ? (
            <CheckCircle2 size={18} className="text-green-600" />
          ) : req.status === "REJECTED" ? (
            <XCircle size={18} className="text-red-500" />
          ) : (
            <Clock size={18} className="text-amber-500" />
          )}
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">{req.user.name || "—"}</p>
          <p className="text-xs text-slate-500">{req.user.email}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Requested {new Date(req.requestedAt).toLocaleDateString()} · Source: {req.source ?? "unknown"}
            {req.status === "APPROVED" && req.user.betaProExpiresAt && (
              <> · Pro expires <span className={new Date(req.user.betaProExpiresAt) < new Date() ? "text-red-400 font-semibold" : "text-green-500 font-semibold"}>
                {new Date(req.user.betaProExpiresAt).toLocaleDateString()}
              </span></>
            )}
          </p>
        </div>
      </div>

      {isPending ? (
        <div className="flex items-center gap-2">
          <button
            onClick={onGrant}
            disabled={!!loading}
            className="text-sm font-bold text-white bg-green-500 hover:bg-green-600 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading === req.id + "grant" ? "..." : "Approve"}
          </button>
          <button
            onClick={onReject}
            disabled={!!loading}
            className="text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading === req.id + "reject" ? "..." : "Reject"}
          </button>
        </div>
      ) : (
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            req.status === "APPROVED"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {req.status}
        </span>
      )}
    </div>
  );
}
