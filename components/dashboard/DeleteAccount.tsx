"use client";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isNativeApp } from "@/lib/native";

interface Props {
  isOwner: boolean;
  /** What the user must type to confirm: the org name, or their email if they have no org. */
  confirmText: string;
}

export function DeleteAccount({ isOwner, confirmText }: Props) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = typed.trim().toLowerCase() === confirmText.trim().toLowerCase();

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete your account");
      if (isNativeApp()) await (await import("@/lib/native-push")).unregisterNativePush({ server: false });
      await createSupabaseBrowserClient().auth.signOut().catch(() => {});
      window.location.href = "/auth?deleted=1";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-red-600 mb-1">Delete account</h2>
      <p className="text-xs text-slate-500 mb-4">
        {isOwner
          ? "Permanently deletes your account and your whole organisation: every issue, label, photo and team member's access. Any subscription is cancelled. This can't be undone."
          : "Permanently deletes your account and removes you from this organisation. The organisation and its issues stay."}
      </p>
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 min-h-[44px] rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 className="h-4 w-4" /> Delete my account
        </button>
      ) : (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 space-y-3">
          <label className="block text-xs text-slate-700">
            Type <strong className="font-semibold">{confirmText}</strong> to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100" />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={remove} disabled={!matches || busy}
              className="flex items-center gap-1.5 min-h-[44px] rounded-xl bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-40">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete permanently
            </button>
            <button onClick={() => { setOpen(false); setTyped(""); setError(null); }} disabled={busy}
              className="min-h-[44px] rounded-xl px-4 text-sm font-medium text-slate-500 hover:bg-white">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
