import type { Issue, CreateIssueInput, IssueFilters, UpdateIssueInput } from "@/types/schema";

export interface IDataAdapter {
  createIssue(data: CreateIssueInput & { location_id: string; org_id: string }): Promise<Issue>;
  getIssuesByOrg(orgId: string, filters?: IssueFilters): Promise<Issue[]>;
  getIssueById(id: string, orgId: string): Promise<Issue | null>;
  updateIssue(id: string, orgId: string, data: UpdateIssueInput): Promise<Issue>;
}
