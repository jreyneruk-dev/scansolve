"use client";
import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { PrimeUpsell } from "./PrimeUpsell";

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
      <PrimeUpsell
        heading="Branding"
        intro="Upload your logo to replace ScanSolve branding on reporter pages."
        title="Your logo on every reporter page"
        blurb="Upgrade to Prime to replace “Powered by ScanSolve” with your own branding."
      />
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
