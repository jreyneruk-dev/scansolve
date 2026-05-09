"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, X, Plus, MapPin, Tag, SlidersHorizontal, MessageSquare, Zap } from "lucide-react";
import type { SurveyConfig } from "@/types/schema";

const DEFAULT_SURVEY: SurveyConfig = {
  categories: [],
  fields: {
    description: { enabled: true, required: false },
    photo: { enabled: true, required: false },
    contact: { enabled: true, required: false },
  },
  success_message: "Thank you! We'll look into this shortly.",
};

export function CommissionForm({ uid, orgId }: { uid: string; orgId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [surveyConfig, setSurveyConfig] = useState<SurveyConfig>(DEFAULT_SURVEY);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdded, setAiAdded] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function addCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed || surveyConfig.categories.includes(trimmed)) return;
    setSurveyConfig((c) => ({ ...c, categories: [...c.categories, trimmed] }));
    setNewCategory("");
  }

  function removeCategory(cat: string) {
    setSurveyConfig((c) => ({ ...c, categories: c.categories.filter((x) => x !== cat) }));
  }

  function toggleField(field: keyof SurveyConfig["fields"], key: "enabled" | "required") {
    setSurveyConfig((c) => ({
      ...c,
      fields: {
        ...c.fields,
        [field]: { ...c.fields[field], [key]: !c.fields[field][key] },
      },
    }));
  }

  async function handleAiSuggest() {
    if (!name.trim()) { setError("Enter a location name first to get AI suggestions"); return; }
    setAiLoading(true);
    setAiAdded(0);
    setError(null);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI suggestion failed");
      const incoming: string[] = Array.isArray(data.categories) ? data.categories : [];
      if (incoming.length === 0) throw new Error("AI returned no suggestions — try a more specific room name");
      let added = 0;
      setSurveyConfig((c) => {
        const merged = Array.from(new Set([...c.categories, ...incoming]));
        added = merged.length - c.categories.length;
        return { ...c, categories: merged };
      });
      // Small delay so `added` is captured after state flush
      setTimeout(() => setAiAdded(incoming.length), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI suggestion failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (surveyConfig.categories.length === 0) {
      setError("Add at least one category");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, name, description: description || undefined, survey_config: surveyConfig, org_id: orgId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to commission QR code");
      }
      router.push("/dashboard?commissioned=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pb-8">

      {/* Location Details */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MapPin className="h-4 w-4 text-indigo-500" />
          Location Details
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Location Name <span className="text-red-400 normal-case font-normal">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g. Ground Floor Restroom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="glass-input h-11 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Description <span className="text-slate-400 font-normal normal-case">optional</span>
          </Label>
          <Textarea
            id="desc"
            placeholder="Additional details about this location..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="glass-input rounded-xl resize-none"
          />
        </div>
      </div>

      {/* Issue Categories */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Tag className="h-4 w-4 text-indigo-500" />
            Issue Categories
          </div>
          <div className="flex items-center gap-2">
            {aiAdded > 0 && (
              <span className="text-xs text-emerald-600 font-semibold animate-fade-up">
                +{aiAdded} added ✓
              </span>
            )}
            <button
              type="button"
              onClick={handleAiSuggest}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100/80 disabled:opacity-50 transition-all duration-200"
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {aiLoading ? "Thinking…" : "AI Suggest"}
            </button>
          </div>
        </div>

        {surveyConfig.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {surveyConfig.categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => removeCategory(cat)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {surveyConfig.categories.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">No categories yet — add some below or use AI Suggest</p>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Add category…"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
            className="glass-input h-10 rounded-xl flex-1"
          />
          <button
            type="button"
            onClick={addCategory}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Survey Fields */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
          Survey Fields
        </div>
        {(["description", "photo", "contact"] as const).map((field) => (
          <div key={field} className="flex items-center justify-between py-1.5 border-b border-white/50 last:border-0">
            <span className="text-sm text-slate-700 font-medium capitalize">
              {field === "contact" ? "Contact email" : field}
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={surveyConfig.fields[field].enabled}
                  onChange={() => toggleField(field, "enabled")}
                  className="accent-indigo-600 rounded"
                />
                Show
              </label>
              <label className={`flex items-center gap-1.5 text-xs cursor-pointer select-none transition-opacity ${
                !surveyConfig.fields[field].enabled ? "opacity-30 pointer-events-none" : "text-slate-500"
              }`}>
                <input
                  type="checkbox"
                  checked={surveyConfig.fields[field].required}
                  disabled={!surveyConfig.fields[field].enabled}
                  onChange={() => toggleField(field, "required")}
                  className="accent-indigo-600 rounded"
                />
                Required
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Success Message */}
      <div className="glass-card rounded-2xl p-5 space-y-1.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MessageSquare className="h-4 w-4 text-indigo-500" />
          Success Message
        </div>
        <Input
          value={surveyConfig.success_message}
          onChange={(e) => setSurveyConfig((c) => ({ ...c, success_message: e.target.value }))}
          placeholder="Thank you! We'll look into this shortly."
          className="glass-input h-11 rounded-xl"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Activate QR Code
          </>
        )}
      </button>
    </form>
  );
}
