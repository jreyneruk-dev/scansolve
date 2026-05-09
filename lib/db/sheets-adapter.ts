import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import type { IDataAdapter } from "./adapter";
import type { Issue, CreateIssueInput, IssueFilters, UpdateIssueInput } from "@/types/schema";

const ISSUES_SHEET = "Issues";
const ISSUE_COLS = [
  "id", "location_id", "org_id", "status", "category", "description",
  "photo_url", "contact_email", "reporter_meta", "assigned_to",
  "assigned_at", "resolved_at", "created_at", "updated_at",
] as const;

type IssueCol = typeof ISSUE_COLS[number];

export class SheetsAdapter implements IDataAdapter {
  private spreadsheetId: string;
  private sheets;

  constructor(credentials: { spreadsheet_id: string; service_account_key: string }) {
    this.spreadsheetId = credentials.spreadsheet_id;
    const keyJson = JSON.parse(credentials.service_account_key);
    const auth = new google.auth.GoogleAuth({
      credentials: keyJson,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    this.sheets = google.sheets({ version: "v4", auth });
  }

  private async ensureSheet() {
    const meta = await this.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
    const exists = meta.data.sheets?.some((s) => s.properties?.title === ISSUES_SHEET);
    if (!exists) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: ISSUES_SHEET } } }] },
      });
      // Write header row
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${ISSUES_SHEET}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [ISSUE_COLS as unknown as string[]] },
      });
    }
  }

  private async getAllRows(): Promise<Record<IssueCol, string>[]> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${ISSUES_SHEET}!A:Z`,
    });
    const rows = res.data.values ?? [];
    if (rows.length < 2) return [];
    const headers = rows[0] as IssueCol[];
    return rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
      return obj as Record<IssueCol, string>;
    });
  }

  private rowToIssue(row: Record<IssueCol, string>): Issue {
    return {
      id: row.id,
      location_id: row.location_id,
      org_id: row.org_id,
      status: row.status as Issue["status"],
      category: row.category,
      description: row.description || undefined,
      photo_url: row.photo_url || undefined,
      contact_email: row.contact_email || undefined,
      reporter_meta: row.reporter_meta ? JSON.parse(row.reporter_meta) : undefined,
      assigned_to: row.assigned_to || undefined,
      assigned_at: row.assigned_at || undefined,
      resolved_at: row.resolved_at || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private issueToRow(issue: Partial<Issue> & { id: string; location_id: string; org_id: string; category: string; created_at: string; updated_at: string }): string[] {
    return ISSUE_COLS.map((col) => {
      const val = (issue as Record<string, unknown>)[col];
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    });
  }

  async createIssue(
    data: CreateIssueInput & { location_id: string; org_id: string }
  ): Promise<Issue> {
    await this.ensureSheet();
    const now = new Date().toISOString();
    const issue: Issue = {
      id: uuidv4(),
      location_id: data.location_id,
      org_id: data.org_id,
      status: "reported",
      category: data.category,
      description: data.description,
      photo_url: data.photo_url,
      contact_email: data.contact_email,
      reporter_meta: data.reporter_meta,
      created_at: now,
      updated_at: now,
    };
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${ISSUES_SHEET}!A:A`,
      valueInputOption: "RAW",
      requestBody: { values: [this.issueToRow(issue)] },
    });
    return issue;
  }

  async getIssuesByOrg(orgId: string, filters?: IssueFilters): Promise<Issue[]> {
    const rows = await this.getAllRows();
    let issues = rows
      .filter((r) => r.org_id === orgId)
      .map(this.rowToIssue);

    if (filters?.status) issues = issues.filter((i) => i.status === filters.status);
    if (filters?.location_id) issues = issues.filter((i) => i.location_id === filters.location_id);
    if (filters?.from) issues = issues.filter((i) => i.created_at >= filters.from!);
    if (filters?.to) issues = issues.filter((i) => i.created_at <= filters.to!);

    issues.sort((a, b) => b.created_at.localeCompare(a.created_at));

    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 50;
    return issues.slice(offset, offset + limit);
  }

  async getIssueById(id: string, orgId: string): Promise<Issue | null> {
    const rows = await this.getAllRows();
    const row = rows.find((r) => r.id === id && r.org_id === orgId);
    return row ? this.rowToIssue(row) : null;
  }

  async updateIssue(id: string, orgId: string, data: UpdateIssueInput): Promise<Issue> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${ISSUES_SHEET}!A:Z`,
    });
    const rows = res.data.values ?? [];
    if (rows.length < 2) throw new Error("Issue not found");
    const headers = rows[0] as IssueCol[];
    const idIdx = headers.indexOf("id");
    const orgIdx = headers.indexOf("org_id");

    const rowIndex = rows.slice(1).findIndex(
      (r) => r[idIdx] === id && r[orgIdx] === orgId
    );
    if (rowIndex === -1) throw new Error("Issue not found");

    const sheetRowIndex = rowIndex + 2; // 1-based + header row
    const existing: Record<string, string> = {};
    headers.forEach((h, i) => { existing[h] = rows[rowIndex + 1][i] ?? ""; });

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...data,
      updated_at: now,
      ...(data.status === "resolved" ? { resolved_at: now } : {}),
      ...(data.status === "assigned" && data.assigned_to ? { assigned_at: now } : {}),
    };

    const newRow = ISSUE_COLS.map((col) => {
      const val = (updated as Record<string, unknown>)[col];
      return val === undefined || val === null ? "" : String(val);
    });

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${ISSUES_SHEET}!A${sheetRowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [newRow] },
    });

    return this.rowToIssue(updated as Record<IssueCol, string>);
  }
}
