"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Camera, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  orgId: string;
  /** Categories already used on this org's labels, offered as suggestions. */
  categories: string[];
}


/** Staff log an issue without a QR label, describing where it is in words. */
export function LogIssue({ orgId, categories }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [where, setWhere] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setWhere(""); setCategory(""); setDescription(""); setPhoto(null); setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let photo_url: string | undefined;
      if (photo) {
        const fd = new FormData();
        fd.append("file", photo);
        fd.append("org_id", orgId);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(upData.error ?? "Photo upload failed");
        photo_url = upData.url;
      }
      const res = await fetch("/api/issues/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location_text: where, category, description: description || undefined, photo_url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not log the issue");
      reset();
      setOpen(false);
      router.push(`/dashboard/issues/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 min-h-[44px] rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all"
      >
        <Plus className="h-4 w-4" /> Log issue
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="log-issue-title">
      <form onSubmit={submit} className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 id="log-issue-title" className="text-base font-bold text-slate-900">Log an issue</h2>
          <button type="button" onClick={() => { reset(); setOpen(false); }} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-slate-700">Where is it?</span>
          <Input className="h-11 rounded-xl" value={where} onChange={(e) => setWhere(e.target.value)} required minLength={2} maxLength={200}
            placeholder="e.g. Block C, 2nd floor, by the lifts" autoFocus />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-slate-700">What kind of issue?</span>
          <Input className="h-11 rounded-xl" value={category} onChange={(e) => setCategory(e.target.value)} required maxLength={50}
            list="log-issue-categories" placeholder="e.g. Lighting" />
          <datalist id="log-issue-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-slate-700">Details <span className="font-normal text-slate-400">(optional)</span></span>
          <Textarea className="min-h-[88px] rounded-xl" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        </label>

        <div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" capture="environment" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB"); return; }
              setPhoto(f);
            }} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 min-h-[44px] rounded-xl border border-dashed border-slate-300 px-3 text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-600">
            <Camera className="h-4 w-4" /> {photo ? photo.name : "Add a photo (optional)"}
          </button>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

        <button type="submit" disabled={saving}
          className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? "Saving…" : "Log issue"}
        </button>
      </form>
    </div>
  );
}
