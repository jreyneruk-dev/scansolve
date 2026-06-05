"use client";

import { useState } from "react";
import { Zap, AlertCircle } from "lucide-react";

interface Props {
  className?: string;
  label?: string;
}

export function PrimeCtaButton({ className, label = "Get Prime" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) {
        // Not logged in — send to signup then back to billing
        window.location.href = "/auth?mode=signup&next=/dashboard/billing";
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start checkout");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <span className="flex items-center gap-2 justify-center">
            <Zap className="h-4 w-4 animate-pulse" />
            Redirecting…
          </span>
        ) : (
          label
        )}
      </button>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
