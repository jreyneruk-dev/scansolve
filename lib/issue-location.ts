import type { Issue } from "@/types/schema";

/** Where an issue is: its QR label's location, or the free text staff typed. */
export function issueWhere(issue: Pick<Issue, "location" | "location_text">): string {
  return issue.location?.name ?? issue.location_text ?? "Unknown location";
}
