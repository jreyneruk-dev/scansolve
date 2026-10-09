import type { Issue, CreateIssueInput, IssueFilters, UpdateIssueInput } from "@/types/schema";

/** A QR report (location_id) or a staff-logged issue (location_text + created_by). */
export type NewIssue = Omit<CreateIssueInput, "uid"> &
  Pick<Issue, "org_id" | "location_id"> &
  Partial<Pick<Issue, "location_text" | "created_by">>;

export interface IDataAdapter {
  createIssue(data: NewIssue): Promise<Issue>;
  getIssuesByOrg(orgId: string, filters?: IssueFilters): Promise<Issue[]>;
  getIssueById(id: string, orgId: string): Promise<Issue | null>;
  updateIssue(id: string, orgId: string, data: UpdateIssueInput): Promise<Issue>;
}
