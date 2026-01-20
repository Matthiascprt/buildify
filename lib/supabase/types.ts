export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  theme: "light" | "dark";
  created_at: string;
};

export type Company = {
  id: string;
  created_at: string;
  user_id: string | null;
  name: string | null;
  activity: string | null;
  legal_status: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  siret: string | null;
  rcs: string | null;
  vat_rate: number | null;
  logo_url: string | null;
  payment_terms: string | null;
  legal_notice: string | null;
};

export type Client = {
  id: string;
  created_at: string;
  company_id: string;
  type: "particulier" | "professionnel" | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

export type ClientInsert = Omit<Client, "id" | "created_at">;
export type ClientUpdate = Partial<
  Omit<Client, "id" | "created_at" | "company_id">
>;

export type ProfileUpdate = Partial<Omit<Profile, "id" | "created_at">>;
export type CompanyUpdate = Partial<
  Omit<Company, "id" | "created_at" | "user_id">
>;

// ============================================
// DOCUMENTS (Quotes & Invoices)
// ============================================

// Structure JSONB content - Format hiérarchique
// SECTION → SOUS-SECTION → PRESTATION

export type LineType = "service" | "material";

export interface DocumentLine {
  line_id: string;
  line_number: string; // "1.1.1", "1.1.2", etc.
  designation: string;
  description?: string;
  line_type?: LineType; // "service" (main-d'œuvre) or "material" (fourniture)
  quantity: number;
  unit?: string; // "m²", "m", "h", "u", "kg", "L", etc.
  unit_price_ht: number;
  vat_rate: number;
  total_ht: number; // quantity × unit_price_ht
}

export interface DocumentSubsection {
  subsection_id: string;
  subsection_number: string; // "1.1", "1.2", etc.
  subsection_label: string;
  total_ht: number; // Somme des lignes
  lines: DocumentLine[];
}

export interface DocumentSection {
  section_id: string;
  section_number: string; // "1", "2", etc.
  section_label: string;
  total_ht: number; // Somme des sous-sections
  subsections: DocumentSubsection[];
}

export interface DocumentTotals {
  total_ht: number;
  total_vat: number;
  total_ttc: number;
  deposit: number;
}

export interface DocumentContent {
  project_title: string;
  sections: DocumentSection[];
  totals: DocumentTotals;
  signature?: string;
}

// Table quotes (matches actual Supabase schema)
export type Quote = {
  id: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  client_id: string | null;
  number: string;
  valid_until: string | null;
  color: string | null;
  content: DocumentContent | null;
};

// Table invoices (matches actual Supabase schema)
export type Invoice = {
  id: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  client_id: string | null;
  number: string;
  due_date: string | null;
  color: string | null;
  content: DocumentContent | null;
};

export type QuoteInsert = Omit<Quote, "id" | "created_at" | "updated_at">;
export type QuoteUpdate = Partial<
  Omit<Quote, "id" | "created_at" | "updated_at" | "company_id">
>;
export type InvoiceInsert = Omit<Invoice, "id" | "created_at" | "updated_at">;
export type InvoiceUpdate = Partial<
  Omit<Invoice, "id" | "created_at" | "updated_at" | "company_id">
>;

// Dashboard types
export interface DashboardStats {
  totalDocuments: number;
  totalClients: number;
  totalRevenue: number;
}

export interface RecentActivity {
  id: string;
  type: "quote" | "invoice";
  number: string;
  clientName: string | null;
  totalTTC: number;
  createdAt: string;
  companyName?: string;
  companyLogo?: string;
  accentColor?: string;
  projectTitle?: string;
}

// Advanced Dashboard types
export interface RevenueDataPoint {
  month: string;
  revenue: number;
  invoices: number;
}

export interface DocumentDistribution {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export interface TodayClient {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  type: "particulier" | "professionnel" | null;
  createdAt: string;
}

export interface AdvancedDashboardStats {
  totalDocuments: number;
  totalClients: number;
  totalRevenue: number;
  monthlyGrowth: number;
  pendingQuotes: number;
  pendingQuotesAmount: number;
  revenueData: RevenueDataPoint[];
  documentDistribution: DocumentDistribution[];
  todayClients: TodayClient[];
  todayDocuments: RecentActivity[];
}

// ============================================
// SUBSCRIPTIONS
// ============================================

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export type Subscription = {
  profile_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: SubscriptionStatus | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  canceled_at: string | null;
  plan: "standard" | "pro" | null;
  quota_docs_per_period: number | null;
  usage_docs_current_period: number;
  created_at: string;
  updated_at: string;
};

export type SubscriptionInsert = Omit<
  Subscription,
  "created_at" | "updated_at"
>;
export type SubscriptionUpdate = Partial<
  Omit<Subscription, "profile_id" | "created_at" | "updated_at">
>;
