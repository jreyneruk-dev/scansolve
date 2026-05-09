"use client";

import { useState } from "react";
import { UserPlus, Loader2, CheckCircle2, AlertCircle, Clock, Users } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface Invite {
  id: string;
  email: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

interface Props {
  members: Member[];
  invites: Invite[];
  currentUserId: string;
}

export function TeamSettings({ members, invites: initialInvites, currentUserId }: Props) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [invites, setInvites] = useState(initialInvites);

  const pendingInvites = invites.filter(
    (i) => !i.accepted_at && new Date(i.expires_at) > new Date()
  );

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, msg: data.error ?? "Failed to send invite" });
      } else {
        setResult({ ok: true, msg: `Invite sent to ${email.trim()}` });
        setEmail("");
        const listRes = await fetch("/api/invites");
        if (listRes.ok) {
          const listData = await listRes.json();
          setInvites(listData.invites ?? []);
        }
      }
    } catch {
      setResult({ ok: false, msg: "Network error. Please try again." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Team Members</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Invite colleagues to manage issues. Only existing members can send invites.
        </p>
      </div>

      {/* Current members */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          <Users className="h-3.5 w-3.5" />
          {members.length} member{members.length !== 1 ? "s" : ""}
        </div>
        {members.map((m) => (
          <div key={m.id} className="glass-card flex items-center justify-between rounded-xl px-4 py-3">
            <span className="text-sm text-slate-600 font-mono text-xs">
              {m.user_id === currentUserId ? "You" : m.user_id.slice(0, 8) + "…"}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              m.role === "owner"
                ? "bg-indigo-50 text-indigo-700"
                : "bg-slate-100 text-slate-500"
            }`}>
              {m.role}
            </span>
          </div>
        ))}
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <Clock className="h-3.5 w-3.5" />
            Pending invites
          </div>
          {pendingInvites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-xl bg-amber-50/60 border border-amber-100 px-4 py-3">
              <span className="text-sm text-slate-700">{inv.email}</span>
              <span className="text-xs text-amber-600 font-medium">Pending</span>
            </div>
          ))}
        </div>
      )}

      {/* Invite form */}
      <form onSubmit={sendInvite} className="space-y-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Invite by email</label>
          <input
            type="text"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="glass-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
          />
        </div>

        {result && (
          <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
            result.ok ? "bg-emerald-50/80 text-emerald-800" : "bg-red-50/80 text-red-800"
          }`}>
            {result.ok
              ? <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
              : <AlertCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />}
            {result.msg}
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !email.trim()}
          className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {sending ? "Sending…" : "Send Invite"}
        </button>
      </form>
    </div>
  );
}
