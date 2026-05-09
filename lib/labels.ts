/** Shared label utilities used by both API routes and client components */

export const SHEET_TYPES: Record<string, { label: string; labelsPerSheet: number }> = {
  avery_l7165: { label: "Avery L7165 (2×4, 8/sheet)", labelsPerSheet: 8 },
  avery_l7163: { label: "Avery L7163 (2×7, 14/sheet)", labelsPerSheet: 14 },
  avery_l7160: { label: "Avery L7160 (3×7, 21/sheet)", labelsPerSheet: 21 },
  avery_l7166: { label: "Avery L7166 (2×3, 6/sheet)", labelsPerSheet: 6 },
};

/** Format a sequence number + year into the UID string: 10yy000001 */
export function formatUID(seqNum: number, year?: number): string {
  const yy = String(year ?? new Date().getFullYear()).slice(-2);
  return `10${yy}${String(seqNum).padStart(6, "0")}`;
}
