"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { SurveyConfig } from "@/types/schema";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, X, ChevronRight } from "lucide-react";

interface SurveyFormProps {
  locationUid: string;
  orgNumber: number;
  surveyConfig: SurveyConfig;
}

export function SurveyForm({ locationUid, orgNumber, surveyConfig }: SurveyFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { categories, fields, success_message } = surveyConfig;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB"); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function uploadPhoto(): Promise<string | undefined> {
    if (!photoFile) return undefined;
    const fd = new FormData();
    fd.append("file", photoFile);
    fd.append("org_id", "temp");
    fd.append("issue_id", crypto.randomUUID());
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Photo upload failed");
    const { url } = await res.json();
    return url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) { setError("Please select a category"); return; }
    setLoading(true);
    setError(null);
    try {
      let photo_url: string | undefined;
      if (photoFile) photo_url = await uploadPhoto();
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: locationUid, org_number: orgNumber, category, description: description || undefined, photo_url, contact_email: contact || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Submission failed");
      }
      const { message } = await res.json();
      router.push(`/scan/${orgNumber}/${locationUid}/success?message=${encodeURIComponent(message ?? success_message)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Category grid */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          What type of issue? <span className="text-red-400">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`min-h-[48px] rounded-2xl border-2 px-3 py-3 text-sm font-medium text-left transition-all duration-200 ${
                category === cat
                  ? "border-indigo-500 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]"
                  : "glass-card border-transparent text-slate-700 hover:border-indigo-200 hover:scale-[1.01]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      {fields.description.enabled && (
        <div className="glass-card rounded-2xl p-4 space-y-1.5">
          <Label htmlFor="description" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Description
            {!fields.description.required && (
              <span className="ml-1 text-slate-400 font-normal normal-case">optional</span>
            )}
          </Label>
          <Textarea
            id="description"
            placeholder="Describe the issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required={fields.description.required}
            rows={3}
            className="glass-input resize-none rounded-xl border-0 focus:ring-0"
          />
        </div>
      )}

      {/* Photo */}
      {fields.photo.enabled && (
        <div className="glass-card rounded-2xl p-4 space-y-1.5">
          <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Photo
            {!fields.photo.required && (
              <span className="ml-1 text-slate-400 font-normal normal-case">optional</span>
            )}
          </Label>
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Preview" className="w-full rounded-xl object-cover max-h-48" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 min-h-[48px] rounded-xl border-2 border-dashed border-slate-200/80 py-5 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all duration-200"
            >
              <Camera className="h-5 w-5" />
              Tap to add a photo
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
            required={fields.photo.required && !photoFile}
          />
        </div>
      )}

      {/* Contact */}
      {fields.contact.enabled && (
        <div className="glass-card rounded-2xl p-4 space-y-1.5">
          <Label htmlFor="contact" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Your email
            {!fields.contact.required && (
              <span className="ml-1 text-slate-400 font-normal normal-case">optional</span>
            )}
          </Label>
          <Input
            id="contact"
            type="email"
            placeholder="you@example.com"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required={fields.contact.required}
            className="glass-input rounded-xl h-11"
          />
          <p className="text-xs text-slate-400">Only used to follow up on your report.</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !category}
        className="flex items-center justify-center gap-2 w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Submit Report
            <ChevronRight className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  );
}
