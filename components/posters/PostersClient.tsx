"use client";
import { useState } from "react";
import { Printer, QrCode } from "lucide-react";
import { PosterPreviewModal, type PosterLocation } from "./PosterPreviewModal";

interface Props {
  orgNumber: number;
  appUrl: string;
  locations: PosterLocation[];
}

export function PostersClient({ orgNumber, appUrl, locations }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(locations.map((l) => l.uid)));
  const [preview, setPreview] = useState(false);

  if (!locations.length) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-500">
        No commissioned locations yet. Activate a QR label for a location first, then come back to print its poster.
      </div>
    );
  }

  const toggle = (uid: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(uid)) n.delete(uid); else n.add(uid);
      return n;
    });
  const allOn = selected.size === locations.length;
  const chosen = locations.filter((l) => selected.has(l.uid));

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setSelected(allOn ? new Set() : new Set(locations.map((l) => l.uid)))}
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          {allOn ? "Clear all" : "Select all"}
        </button>
        <button
          onClick={() => setPreview(true)}
          disabled={!chosen.length}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print {chosen.length || ""} poster{chosen.length !== 1 ? "s" : ""}
        </button>
      </div>

      {/* Location list */}
      <div className="glass-card rounded-2xl divide-y divide-slate-100">
        {locations.map((loc) => (
          <label
            key={loc.uid}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-indigo-50/40 transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.has(loc.uid)}
              onChange={() => toggle(loc.uid)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <QrCode className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="flex-1 text-sm font-medium text-slate-900">{loc.name}</span>
            <span className="text-xs text-slate-400 font-mono">{loc.uid}</span>
          </label>
        ))}
      </div>

      {preview && (
        <PosterPreviewModal
          locations={chosen}
          orgNumber={orgNumber}
          appUrl={appUrl}
          onClose={() => setPreview(false)}
        />
      )}
    </div>
  );
}
