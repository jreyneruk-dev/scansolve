"use client";
import { useRef, useState } from "react";
import { Upload, X, Sparkles, ArrowRight, ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  isPrime: boolean;
  initialLogoUrl: string | null;
}

export function BrandingSettings({ isPrime, initialLogoUrl }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isPrime) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Branding</h2>
        <p className="text-xs text-slate-400 mb-4">Upload your logo to replace ScanSolve branding on reporter pages.</p>
        <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-indigo-100 shadow-sm">
            <Sparkles className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Your logo on every reporter page</p>
            <p className="text-xs text-slate-500 mt-0.5">Upgrade to Prime to replace &ldquo;Powered by ScanSolve&rdquo; with your own branding.</p>
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/org/logo", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setLogoUrl(data.logo_url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemove() {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch("/api/org/logo", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove logo");
      setLogoUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-700 mb-1">Branding</h2>
      <p className="text-xs text-slate-400 mb-4">
        Your logo appears on the reporter scan page and replaces &ldquo;Powered by ScanSolve.&rdquo;
        Recommended: square PNG or SVG, at least 200×200px, under 2 MB.
      </p>

      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Your logo"
              width={64}
              height={64}
              className="object-contain w-full h-full"
              unoptimized
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-slate-300" />
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
          </button>
          {logoUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:border-red-200 hover:text-red-500 disabled:opacity-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      {success && <p className="mt-3 text-xs text-emerald-600">Logo updated — visible on reporter pages immediately.</p>}
    </div>
  );
}
