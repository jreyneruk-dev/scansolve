/** Shared label utilities used by both API routes and client components.
 *  SHEET_TYPES is the single source of truth for Avery sheet geometry — the
 *  reserve API, the on-screen preview (LabelSheet) and the print builder
 *  (PrintPreviewModal) all read from here so a selected size renders and prints
 *  identically. All dimensions in millimetres. Geometry derived from the
 *  gLabels Avery ISO templates (points → mm). */

export type SheetLayout = "split" | "stacked";

export interface SheetConfig {
  /** Full dropdown label */
  label: string;
  /** Short name for headers, e.g. "Avery L7165" */
  short: string;
  pageWidthMm: number;
  pageHeightMm: number;
  marginTopMm: number;
  marginLeftMm: number;
  labelWidthMm: number;
  labelHeightMm: number;
  /** Gap between columns / rows (pitch − label size) */
  colGapMm: number;
  rowGapMm: number;
  cols: number;
  rows: number;
  labelsPerSheet: number;
  /** How the label cell is composed for this size/shape */
  layout: SheetLayout;
}

export const SHEET_TYPES: Record<string, SheetConfig> = {
  // 4 per sheet — large (99.1 × 139 mm). Premium, lots of room.
  avery_l7169: {
    label: "Avery L7169 — 4 / sheet · 99 × 139 mm (large)",
    short: "Avery L7169",
    pageWidthMm: 210, pageHeightMm: 297,
    marginTopMm: 7.1, marginLeftMm: 5.0,
    labelWidthMm: 99.1, labelHeightMm: 139.0,
    colGapMm: 2.4, rowGapMm: 0,
    cols: 2, rows: 2, labelsPerSheet: 4,
    layout: "stacked",
  },
  // 6 per sheet — near-square (99.1 × 93.1 mm). Big scannable QR.
  avery_l7166: {
    label: "Avery L7166 — 6 / sheet · 99 × 93 mm",
    short: "Avery L7166",
    pageWidthMm: 210, pageHeightMm: 297,
    marginTopMm: 8.9, marginLeftMm: 5.05,
    labelWidthMm: 99.1, labelHeightMm: 93.1,
    colGapMm: 2.6, rowGapMm: 0,
    cols: 2, rows: 3, labelsPerSheet: 6,
    layout: "stacked",
  },
  // 8 per sheet — the default (99.1 × 67.7 mm). Logo + QR side by side.
  avery_l7165: {
    label: "Avery L7165 — 8 / sheet · 99 × 68 mm (default)",
    short: "Avery L7165",
    pageWidthMm: 210, pageHeightMm: 297,
    marginTopMm: 13.5, marginLeftMm: 5.05,
    labelWidthMm: 99.1, labelHeightMm: 67.7,
    colGapMm: 0, rowGapMm: 0,
    cols: 2, rows: 4, labelsPerSheet: 8,
    layout: "split",
  },
  // 12 per sheet — compact (63.5 × 72 mm). More codes, still scannable.
  avery_l7164: {
    label: "Avery L7164 — 12 / sheet · 64 × 72 mm (compact)",
    short: "Avery L7164",
    pageWidthMm: 210, pageHeightMm: 297,
    marginTopMm: 4.5, marginLeftMm: 7.0,
    labelWidthMm: 63.5, labelHeightMm: 72.0,
    colGapMm: 2.5, rowGapMm: 0,
    cols: 3, rows: 4, labelsPerSheet: 12,
    layout: "stacked",
  },
};

export const DEFAULT_SHEET_TYPE = "avery_l7165";

/** Look up a sheet config, falling back to the default for unknown/legacy keys
 *  (e.g. reprinting an old job whose sheet_type was since removed). */
export function getSheetConfig(sheetType?: string | null): SheetConfig {
  return (sheetType && SHEET_TYPES[sheetType]) || SHEET_TYPES[DEFAULT_SHEET_TYPE];
}

/** Format a sequence number + year into the UID string: 10yy000001 */
export function formatUID(seqNum: number, year?: number): string {
  const yy = String(year ?? new Date().getFullYear()).slice(-2);
  return `10${yy}${String(seqNum).padStart(6, "0")}`;
}
