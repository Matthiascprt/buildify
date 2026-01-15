export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export type Company = {
  id: string;
  created_at: string;
  user_id: string | null;
  name: string | null;
  legal_status: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  siret: string | null;
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

// Structure JSONB content
export interface DocumentLine {
  line_id: string; // UUID stable - NE JAMAIS utiliser line_number pour identifier
  line_number: number; // Numéro d'affichage uniquement
  designation: string;
  description?: string;
  quantity: number;
  unit_price_ht: number;
  vat_rate: number;
  total_ttc: number;
  is_section?: boolean;
}

export interface DocumentTotals {
  total_ht: number;
  total_vat: number;
  deposit: number;
  total_ttc: number;
}

export interface DocumentContent {
  project_title: string;
  lines: DocumentLine[];
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
