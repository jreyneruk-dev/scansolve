"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, X } from "lucide-react";

interface Props {
  initialRecoveryEmail: string | null;
}

export function RecoveryEmailSettings({ initialRecoveryEmail }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [recoveryEmail, setRecoveryEmail] = useState(initialRecoveryEmail ?? "");
  const [saved, setSaved] = useState(initialRecoveryEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = recoveryEmail.trim() !== saved;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const newValue = recoveryEmail.trim() || null;

    const { error: updateError } = await supabase.auth.updateUser({
      data: { recovery_email: newValue },
    });

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved(newValue ?? "");
    setRecoveryEmail(newValue ?? "");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleRemove() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: updateError } = await supabase.auth.updateUser({
      data: { recovery_email: null },
    });

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved("");
    setRecoveryEmail("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Recovery Email</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            A backup email to receive sign-in codes if you lose access to your primary inbox.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="recovery-email" className="text-xs font-semibold text-slate-600">
            Recovery email address
          </Label>
          <div className="flex gap-2">
            <Input
              id="recovery-email"
              type="email"
              placeholder="backup@example.com"
              value={recoveryEmail}
              onChange={(e) => {
                setRecoveryEmail(e.target.value);
                setSuccess(false);
                setError(null);
              }}
              maxLength={254}
              className="h-10 text-sm"
            />
            {saved && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                title="Remove recovery email"
                className="flex items-center justify-center h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
            {saved ? "Recovery email saved." : "Recovery email removed."}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !isDirty}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {saved && !recoveryEmail.trim() ? "Remove" : "Save recovery email"}
        </button>
      </form>

      {saved && (
        <p className="text-xs text-slate-400">
          Current:{" "}
          <span className="font-medium text-slate-600">{saved}</span>
        </p>
      )}
    </div>
  );
}
