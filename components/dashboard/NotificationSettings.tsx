"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Bell, BellOff, Loader2, Share, Plus, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Props {
  isPrime: boolean;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function NotificationSettings({ isPrime }: Props) {
  const [supported, setSupported] = useState(true);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPrime) { setChecking(false); return; }

    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // On iOS, Push only exists once the PWA is installed to the home screen.
    if (isIOS && !isStandalone && !("PushManager" in window)) {
      setIosNeedsInstall(true);
      setChecking(false);
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      setChecking(false);
      return;
    }

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [isPrime]);

  async function enable() {
    setError(null);
    setLoading(true);
    try {
      if (!VAPID_PUBLIC_KEY) throw new Error("Push is not configured");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notifications were blocked. Enable them in your browser settings.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await sub.unsubscribe().catch(() => {});
        throw new Error(data.error ?? "Could not enable alerts");
      }
      setEnabled(true);
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
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setEnabled(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── Not Prime → upsell ──
  if (!isPrime) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Instant alerts</h2>
        <p className="text-xs text-slate-400 mb-4">Get a push notification the moment a new issue is reported.</p>
        <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-indigo-100 shadow-sm">
            <Sparkles className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Real-time push alerts</p>
            <p className="text-xs text-slate-500 mt-0.5">Upgrade to Prime to get alerted the moment something breaks.</p>
          </div>
          <Link href="/pricing" className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">
            Upgrade <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  const header = (
    <>
      <h2 className="text-sm font-semibold text-slate-700 mb-1">Instant alerts</h2>
      <p className="text-xs text-slate-400 mb-4">Get a push notification on this device the moment a new issue is reported.</p>
    </>
  );

  // ── iOS, not installed → Add to Home Screen card ──
  if (iosNeedsInstall) {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-indigo-100">
            <Bell className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-sm font-bold text-slate-900">Add ScanSolve to your Home Screen</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            On iPhone, alerts need the app installed first. It takes one tap and adds a ScanSolve icon to your phone.
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-600">
            Tap <Share className="h-4 w-4 text-indigo-500" /> then <span className="font-semibold flex items-center gap-1">&ldquo;Add to Home Screen&rdquo; <Plus className="h-3.5 w-3.5" /></span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Then open ScanSolve from the new icon and come back here to turn on alerts.</p>
        </div>
      </div>
    );
  }

  if (!supported) {
    return (
      <div>
        {header}
        <p className="text-xs text-slate-500 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
          This browser doesn&apos;t support push notifications. Try Chrome on Android/desktop, or install the app on iPhone.
        </p>
      </div>
    );
  }

  return (
    <div>
      {header}
      {checking ? (
        <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Checking…</div>
      ) : enabled ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Alerts on for this device</p>
            <p className="text-xs text-slate-500 mt-0.5">You&apos;ll get a push when a new issue is reported.</p>
          </div>
          <button onClick={disable} disabled={loading} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-medium hover:border-red-200 hover:text-red-500 disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellOff className="h-3.5 w-3.5" />} Turn off
          </button>
        </div>
      ) : (
        <button onClick={enable} disabled={loading} className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          {loading ? "Enabling…" : "Enable alerts on this device"}
        </button>
      )}
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
    </div>
  );
}
