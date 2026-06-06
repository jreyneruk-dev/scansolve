"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  token: string;
  orgName: string;
  inviteEmail: string;
}

type Step = "loading" | "join" | "auth" | "wrong-account" | "done";

export function AcceptInviteForm({ token, orgName, inviteEmail }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [step, setStep] = useState<Step>("loading");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  // On mount: check if already signed in and whether the email matches the invite
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Not signed in — go straight to the sign-in form
        setStep("auth");
        return;
      }
      if (user.email?.toLowerCase() === inviteEmail.toLowerCase()) {
        // Signed in as the invited email — show a single "Join" button
        setStep("join");
      } else {
        // Signed in as a different account — tell them to switch
        setCurrentEmail(user.email ?? "");
        setStep("wrong-account");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleJoin() {
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

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setCurrentEmail("");
    setOtpSent(false);
    setOtp("");
    setError("");
    setLoading(false);
    setStep("auth");
  }

  async function sendMagicLink() {
    setLoading(true);
    setError("");
    try {
      // Send via our Resend route, not Supabase's built-in (rate-limited) email.
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/invite/${token}`)}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Unable to send sign-in link. Please try again.");
        return;
      }
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: inviteEmail,
        token: otp,
        type: "email",
      });
      if (verifyError) {
        setError(verifyError.message);
        return;
      }
      // Session established — accept the invite
      await handleJoin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="glass-card rounded-3xl p-7 flex items-center justify-center min-h-[120px]">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────
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

  // ── Wrong account signed in ───────────────────────────────────────────────
  if (step === "wrong-account") {
    return (
      <div className="glass-card rounded-3xl p-7 space-y-4">
        <p className="text-sm text-slate-600 text-center">
          You&apos;re signed in as <strong className="text-slate-800">{currentEmail}</strong>, but this invite is for{" "}
          <strong className="text-slate-800">{inviteEmail}</strong>.
        </p>
        <p className="text-xs text-slate-500 text-center">
          Sign out and we&apos;ll send a magic link to the invited email.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {loading ? "Signing out…" : "Sign out & use invited email"}
        </button>
        {error && <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>}
      </div>
    );
  }

  // ── Correct account signed in — one-tap join ──────────────────────────────
  if (step === "join") {
    return (
      <div className="glass-card rounded-3xl p-7 space-y-4">
        <p className="text-sm text-slate-600 text-center">
          Signed in as <strong className="text-slate-800">{inviteEmail}</strong>
        </p>
        {error && <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>}
        <button
          type="button"
          onClick={handleJoin}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Joining…" : `Join ${orgName}`}
        </button>
      </div>
    );
  }

  // ── Auth: send OTP / verify ───────────────────────────────────────────────
  // step === "auth"
  return (
    <div className="glass-card rounded-3xl p-7 space-y-4">
      {!otpSent ? (
        <>
          <p className="text-sm text-slate-600 text-center">
            We&apos;ll send a magic link to <strong className="text-slate-800">{inviteEmail}</strong> to verify it&apos;s you.
          </p>
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Sending…" : "Send Magic Link"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600 text-center">
            Email sent to <strong className="text-slate-800">{inviteEmail}</strong>. Click the link, or enter the code below.
          </p>
          <p className="text-xs text-slate-500 text-center">8-digit code</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="00000000"
            autoFocus
            className="glass-input w-full rounded-xl px-4 py-3 text-2xl tracking-[0.5em] font-mono text-center h-14 focus:outline-none"
          />
          <button
            type="button"
            onClick={verifyOtp}
            disabled={loading || otp.length < 6 || otp.length > 8}
            className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Verifying…" : "Verify & Join"}
          </button>
          <button
            type="button"
            onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors min-h-[36px]"
          >
            Resend or use a different method
          </button>
        </>
      )}
      {error && <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>}
    </div>
  );
}
