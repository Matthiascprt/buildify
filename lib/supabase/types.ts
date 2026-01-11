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
};

export type Client = {
  id: number;
  created_at: string;
  company_id: string | null;
  type: string | null;
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

export type Quote = {
  id: number;
  created_at: string;
  company_id: string | null;
  client_id: number | null;
  quote_number: string | null;
  valid_until: string | null;
  content: Record<string, unknown> | null;
  payment_terms: string | null;
  color: string | null;
};

export type Invoice = {
  id: number;
  created_at: string;
  company_id: string | null;
  client_id: number | null;
  invoice_number: string | null;
  due_date: string | null;
  content: Record<string, unknown> | null;
  payment_terms: string | null;
  color: string | null;
};

export type QuoteInsert = Omit<Quote, "id" | "created_at">;
export type QuoteUpdate = Partial<
  Omit<Quote, "id" | "created_at" | "company_id">
>;

export type InvoiceInsert = Omit<Invoice, "id" | "created_at">;
export type InvoiceUpdate = Partial<
  Omit<Invoice, "id" | "created_at" | "company_id">
>;
