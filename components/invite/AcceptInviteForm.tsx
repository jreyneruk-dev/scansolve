"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  token: string;
  orgName: string;
  inviteEmail: string;
}

export function AcceptInviteForm({ token, orgName, inviteEmail }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"confirm" | "auth" | "done">("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState(inviteEmail);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  async function sendMagicLink() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next: `/invite/${token}` }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to send login email");
        return;
      }
      setOtpSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otp, type: "email" }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Invalid code");
        return;
      }
      await acceptInvite();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function acceptInvite() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to accept invite");
        return;
      }
      setStep("done");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="glass-card rounded-3xl p-7 text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
          <CheckCircle2 className="h-7 w-7 text-white" />
        </div>
        <p className="font-semibold text-slate-900">You&apos;ve joined {orgName}!</p>
        <p className="text-sm text-slate-500">Redirecting to your dashboard…</p>
      </div>
    );
  }

  if (step === "auth") {
    return (
      <div className="glass-card rounded-3xl p-7 space-y-4">
        <p className="text-sm text-slate-600">
          Sign in to accept the invite. We&apos;ll send a magic link to:
        </p>
        <input
          type="text"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="glass-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
        />
        {!otpSent ? (
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Sending…" : "Send Magic Link"}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 text-center">Enter the 6-digit code from your email</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="glass-input w-full rounded-xl px-4 py-3 text-2xl tracking-[0.6em] font-mono text-center h-14 focus:outline-none"
            />
            <button
              type="button"
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Verifying…" : "Verify & Join"}
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>}
      </div>
    );
  }

  // step === "confirm"
  return (
    <div className="glass-card rounded-3xl p-7 space-y-4">
      <p className="text-sm text-slate-600 text-center">
        You were invited as <strong className="text-slate-800">{inviteEmail}</strong>
      </p>
      {error && <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>}
      <button
        type="button"
        onClick={async () => {
          setLoading(true);
          setError("");
          try {
            const res = await fetch(`/api/invites/${token}`, { method: "POST" });
            const data = await res.json();
            if (res.status === 401) {
              setStep("auth");
              return;
            }
            if (!res.ok) {
              setError(data.error ?? "Failed to accept invite");
              return;
            }
            setStep("done");
            setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 1500);
          } catch {
            setError("Network error. Please try again.");
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Joining…" : `Join ${orgName}`}
      </button>
      <button
        type="button"
        onClick={() => setStep("auth")}
        className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors min-h-[36px]"
      >
        Sign in with a different account
      </button>
    </div>
  );
}
