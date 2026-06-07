"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, MessageSquare, Phone, CheckCircle2, Loader2, X } from "lucide-react";
import Link from "next/link";

type Channel = "sms" | "whatsapp";

interface Props {
  isPrime: boolean;
  initialPhone: string | null;
  initialChannel: Channel | null;
  initialVerified: boolean;
}

export function NotificationSettings({ isPrime, initialPhone, initialChannel, initialVerified }: Props) {
  const [verified, setVerified] = useState(initialVerified && !!initialPhone);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [channel, setChannel] = useState<Channel>(initialChannel ?? "sms");
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isPrime) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Instant alerts</h2>
        <p className="text-xs text-slate-400 mb-4">Get an SMS or WhatsApp the moment a new issue is reported.</p>
        <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-indigo-100 shadow-sm">
            <Sparkles className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">SMS &amp; WhatsApp alerts</p>
            <p className="text-xs text-slate-500 mt-0.5">Upgrade to Prime to get real-time alerts the moment something breaks.</p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            Upgrade
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  async function sendCode() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send code");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not verify");
      setVerified(true);
      setStep("idle");
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/disable", { method: "POST" });
      if (!res.ok) throw new Error("Could not disable");
      setVerified(false);
      setPhone("");
      setStep("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Verified state — show active number + disable
  if (verified) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Instant alerts</h2>
        <p className="text-xs text-slate-400 mb-4">New issues are sent to your phone in real time.</p>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {channel === "whatsapp" ? "WhatsApp" : "SMS"} alerts active
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{phone}</p>
          </div>
          <button
            onClick={disable}
            disabled={loading}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-medium hover:border-red-200 hover:text-red-500 disabled:opacity-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Turn off
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-700 mb-1">Instant alerts</h2>
      <p className="text-xs text-slate-400 mb-4">
        Get an SMS or WhatsApp the moment a new issue is reported. We&apos;ll send a code to confirm your number.
      </p>

      {/* Channel toggle */}
      <div className="flex gap-2 mb-3">
        {([
          { key: "sms" as Channel, label: "SMS", icon: Phone },
          { key: "whatsapp" as Channel, label: "WhatsApp", icon: MessageSquare },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setChannel(key)}
            disabled={step === "code"}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
              channel === key
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 text-slate-600 hover:border-indigo-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {step === "idle" ? (
        <div className="flex gap-2">
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+44 7700 900123"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={sendCode}
            disabled={loading || !phone.trim()}
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Enter the code we sent to <span className="font-mono text-slate-700">{phone}</span>.</p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              maxLength={10}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={verifyCode}
              disabled={loading || code.length < 4}
              className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
            </button>
          </div>
          <button
            onClick={() => { setStep("idle"); setCode(""); setError(null); }}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Use a different number
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
    </div>
  );
}
