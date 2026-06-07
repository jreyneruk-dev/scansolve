export type OrgPlan = "free" | "prime" | "enterprise";
export type IssueStatus = "reported" | "assigned" | "in_progress" | "resolved";
export type BackendType = "supabase" | "sheets" | "airtable";

export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  plan: OrgPlan;
  plan_expires_at?: string | null; // null = permanent; ISO string = time-limited (voucher)
  plan_source?: "free" | "paid" | "voucher" | "comp";
  // Prime SMS/WhatsApp issue alerts (migration 012)
  notify_phone?: string | null;
  notify_channel?: "sms" | "whatsapp" | null;
  notify_verified?: boolean;
  backend: BackendType;
  backend_credentials?: Record<string, string>; // encrypted, never sent to client
  created_at: string;
}

export interface SurveyFieldConfig {
  enabled: boolean;
  required: boolean;
}

export interface SurveyConfig {
  categories: string[];
  fields: {
    description: SurveyFieldConfig;
    photo: SurveyFieldConfig;
    contact: SurveyFieldConfig;
  };
  success_message: string;
}

export interface Location {
  id: string;
  org_id: string;
  uid: string; // the value encoded in the QR code
  name: string;
  description?: string;
  floor_plan_url?: string;
  survey_config: SurveyConfig;
  claimed_by?: string;
  claimed_at?: string;
  created_at: string;
}

export interface Issue {
  id: string;
  location_id: string;
  org_id: string;
  status: IssueStatus;
  category: string;
  description?: string;
  photo_url?: string;
  contact_email?: string;
  reporter_meta?: Record<string, unknown>;
  assigned_to?: string;
  assigned_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  // joined fields (not in DB columns)
  location?: Pick<Location, "name" | "uid">;
}

// Input types (for API payloads)

export interface CreateIssueInput {
  uid: string; // QR uid, resolved server-side to location_id
  category: string;
  description?: string;
  photo_url?: string;
  contact_email?: string;
  reporter_meta?: Record<string, unknown>;
}

export interface CreateLocationInput {
  uid: string;
  name: string;
  description?: string;
  floor_plan_url?: string;
  survey_config: SurveyConfig;
  org_id: string;
  claimed_by: string;
}

export interface UpdateIssueInput {
  status?: IssueStatus;
  assigned_to?: string;
  description?: string;
}

export interface IssueFilters {
  status?: IssueStatus;
  location_id?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

// API response shapes

export interface PublicLocationData {
  uid: string;
  name: string;
  survey_config: SurveyConfig;
}

export interface ApiError {
  error: string;
  code?: string;
}
