"use client";

import { useState } from "react";
import { CheckCircle, Zap, AlertCircle, Tag, Crown } from "lucide-react";
import type { OrgPlan } from "@/types/schema";

interface Props {
  currentPlan: OrgPlan;
  justUpgraded: boolean;
  justCancelled: boolean;
  stripeSubscriptionId: string | null;
}

export function BillingClient({ currentPlan, justUpgraded, justCancelled, stripeSubscriptionId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voucher, setVoucher] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start checkout");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function handleVoucherRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!voucher.trim()) return;
    setVoucherLoading(true);
    setVoucherMessage(null);
    try {
      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucher.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVoucherMessage({ ok: false, text: data.error ?? "Invalid code" });
      } else {
        setVoucherMessage({ ok: true, text: "Prime activated! Refreshing…" });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setVoucherMessage({ ok: false, text: "Something went wrong" });
    } finally {
      setVoucherLoading(false);
    }
  }

  const isPrime = currentPlan === "prime";
  const isEnterprise = currentPlan === "enterprise";

  return (
    <div className="space-y-6">
      {/* Status banners */}
      {justUpgraded && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Welcome to Prime! Your account has been upgraded.
        </div>
      )}
      {justCancelled && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Checkout was cancelled — you haven&apos;t been charged.
        </div>
      )}

      {/* Current plan card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-1 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Current plan</span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              isPrime || isEnterprise
                ? "bg-indigo-50 text-indigo-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {currentPlan === "free" ? "Starter" : currentPlan === "prime" ? "Prime" : "Enterprise"}
          </span>
        </div>

        {isPrime && (
          <div className="pt-2 space-y-1.5">
            <p className="text-sm text-slate-600">
              {stripeSubscriptionId
                ? "Your subscription is active. Billing is managed through Stripe."
                : "Prime access granted via voucher."}
            </p>
          </div>
        )}

        {isEnterprise && (
          <p className="text-sm text-slate-600 pt-2">
            Enterprise plan — contact us for billing details.
          </p>
        )}

        {!isPrime && !isEnterprise && (
          <p className="text-sm text-slate-600 pt-2">
            You&apos;re on the free Starter plan with limited features.
          </p>
        )}
      </div>

      {/* Upgrade CTA — only for free plan */}
      {!isPrime && !isEnterprise && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
              <Crown className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Upgrade to Prime</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your logo · bigger team · instant alerts</p>
            </div>
            <div className="ml-auto text-right shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-900">£15</span>
                <span className="text-xs text-slate-400">/mo</span>
              </div>
              <span className="text-xs text-slate-400 line-through">£20/mo</span>
            </div>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-600">
            {[
              "Your logo on every reporter page",
              "Up to 20 team members",
              "All 4 Avery label types",
              "Email + instant push alerts",
              "Insights — resolution times by location",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {loading ? "Redirecting to checkout…" : "Upgrade to Prime — £15/mo"}
          </button>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400 text-center">
            Subscriptions renew monthly until cancelled. By subscribing you agree to our{" "}
            <a href="/terms" className="underline hover:text-slate-600">Terms of Service</a>.
          </p>
          <p className="text-center text-xs text-slate-400">Limited time discount from £20/mo · Cancel anytime</p>
        </div>
      )}

      {/* Voucher redemption */}
      {!isPrime && !isEnterprise && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Have a voucher code?</h2>
          </div>
          <form onSubmit={handleVoucherRedeem} className="flex gap-2">
            <input
              type="text"
              value={voucher}
              onChange={(e) => setVoucher(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={32}
            />
            <button
              type="submit"
              disabled={voucherLoading || !voucher.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {voucherLoading ? "…" : "Redeem"}
            </button>
          </form>
          {voucherMessage && (
            <p
              className={`text-xs flex items-center gap-1.5 ${
                voucherMessage.ok ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {voucherMessage.ok ? (
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              {voucherMessage.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
