"use client";
import { useState, Suspense } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Mail, KeyRound, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

type AuthStep = "email" | "sent";

function AuthForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const mode = searchParams.get("mode"); // "signup" when coming from landing page CTAs
  const isSignup = mode === "signup";
  const supabase = createSupabaseBrowserClient();

  const errorParam = searchParams.get("error");
  const initialError =
    errorParam === "banned"
      ? "This account has been suspended. Please contact support."
      : errorParam === "auth_failed"
      ? "The sign-in link expired or was opened in a different browser. Enter your email below to get a fresh one."
      : null;

  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [useRecovery, setUseRecovery] = useState(false);

  async function handleSendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (useRecovery) {
      // Send OTP to the recovery email instead
      const res = await fetch("/api/auth/send-to-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryEmail: email,
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) {
        setError(data.error ?? "Unable to send to recovery email. Please try again.");
        return;
      }
      setStep("sent");
      return;
    }

    // Check if this email is banned before sending anything
    const checkRes = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!checkRes.ok) {
      const data = await checkRes.json().catch(() => ({}));
      setError(data.message ?? "Unable to send sign-in link. Please try again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStep("sent");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    setLoading(false);
    if (error) { setError(error.message); return; }
    window.location.href = next;
  }

  if (step === "sent") {
    return (
      <div className="w-full max-w-sm space-y-5 animate-slide-in">
        <div className="glass-card rounded-3xl p-7 space-y-5">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
              <p className="mt-1 text-sm text-slate-500">
                {useRecovery
                  ? <>Code sent to your <strong className="text-slate-700">recovery email</strong>.<br />Enter it below to sign in to <strong className="text-slate-700">{email}</strong>.</>
                  : <>Magic link + 8-digit code sent to<br /><strong className="text-slate-700">{email}</strong></>
                }
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otp" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">8-digit code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6,8}"
                maxLength={8}
                placeholder="00000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                className="text-center text-2xl tracking-[0.5em] font-mono h-14 glass-input rounded-xl"
              />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length < 6 || otp.length > 8}
              className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Sign In"}
            </button>
          </form>
        </div>

        <button
          onClick={() => { setStep("email"); setOtp(""); setUseRecovery(false); }}
          className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-5 animate-slide-in">
      <div className="text-center space-y-3">
        <div className="relative mx-auto w-fit">
          <div className="absolute inset-0 rounded-3xl bg-indigo-500 blur-xl opacity-35 animate-pulse-glow" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30">
            <QrCode className="h-8 w-8 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isSignup
              ? "Enter your email and we'll send you a link to get started — no password needed."
              : "Sign in with a magic code — no password needed."}
          </p>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <form onSubmit={handleSendMagicLink} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              {useRecovery ? "Primary email address" : "Email address"}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="pl-10 h-12 glass-input rounded-xl"
              />
            </div>
            {useRecovery && (
              <p className="text-xs text-slate-500 pt-0.5">
                Enter your primary email — the code will be sent to your recovery inbox.
              </p>
            )}
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="group flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                {useRecovery ? "Send to Recovery Email" : isSignup ? "Create Account" : "Send Magic Code"}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>

      {!isSignup && (
        <button
          type="button"
          onClick={() => { setUseRecovery((r) => !r); setError(null); }}
          className="w-full text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors py-2"
        >
          {useRecovery
            ? "← Back to sending to primary email"
            : "Lost access to your inbox? Send code to recovery email instead"}
        </button>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <Suspense>
        <AuthForm />
      </Suspense>
    </main>
  );
}
