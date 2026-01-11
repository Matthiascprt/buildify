"use server";

import { createClient } from "./server";
import type {
  Profile,
  Company,
  ProfileUpdate,
  CompanyUpdate,
  Client,
  ClientInsert,
  ClientUpdate,
  Quote,
  QuoteInsert,
  QuoteUpdate,
  Invoice,
  InvoiceInsert,
  InvoiceUpdate,
} from "./types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function updateProfile(
  updates: ProfileUpdate,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getCompany(): Promise<Company | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching company:", error);
    return null;
  }

  return data;
}

export async function updateCompany(
  updates: CompanyUpdate,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const existingCompany = await getCompany();

  if (existingCompany) {
    const { error } = await supabase
      .from("companies")
      .update(updates)
      .eq("id", existingCompany.id);

    if (error) {
      console.error("Error updating company:", error);
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await supabase.from("companies").insert({
      ...updates,
      user_id: user.id,
    });

    if (error) {
      console.error("Error creating company:", error);
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

export async function getSettingsData(): Promise<{
  profile: Profile | null;
  company: Company | null;
}> {
  const [profile, company] = await Promise.all([getProfile(), getCompany()]);
  return { profile, company };
}

// ============ CLIENTS ============

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clients:", error);
    return [];
  }

  return data ?? [];
}

export async function addClient(
  clientData: Omit<ClientInsert, "company_id">,
): Promise<{ success: boolean; error?: string; client?: Client }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      ...clientData,
      company_id: company.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating client:", error);
    return { success: false, error: error.message };
  }

  return { success: true, client: data };
}

export async function updateClient(
  clientId: number,
  updates: ClientUpdate,
): Promise<{ success: boolean; error?: string; client?: Client }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", clientId)
    .eq("company_id", company.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating client:", error);
    return { success: false, error: error.message };
  }

  return { success: true, client: data };
}

export async function deleteClient(
  clientId: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("company_id", company.id);

  if (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============ QUOTES ============

export type QuoteWithClient = Quote & {
  clients: Pick<Client, "id" | "first_name" | "last_name"> | null;
};

export async function getQuotes(): Promise<Quote[]> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return [];

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }

  return data ?? [];
}

export async function getQuotesWithClients(): Promise<QuoteWithClient[]> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return [];

  const { data, error } = await supabase
    .from("quotes")
    .select("*, clients(id, first_name, last_name)")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching quotes with clients:", error);
    return [];
  }

  return data ?? [];
}

export async function getQuote(quoteId: number): Promise<Quote | null> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return null;

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("company_id", company.id)
    .single();

  if (error) {
    console.error("Error fetching quote:", error);
    return null;
  }

  return data;
}

export async function createQuote(
  quoteData: Omit<QuoteInsert, "company_id">,
): Promise<{ success: boolean; error?: string; quote?: Quote }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      ...quoteData,
      company_id: company.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating quote:", error);
    return { success: false, error: error.message };
  }

  return { success: true, quote: data };
}

export async function updateQuote(
  quoteId: number,
  updates: QuoteUpdate,
): Promise<{ success: boolean; error?: string; quote?: Quote }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  const { data, error } = await supabase
    .from("quotes")
    .update(updates)
    .eq("id", quoteId)
    .eq("company_id", company.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating quote:", error);
    return { success: false, error: error.message };
  }

  return { success: true, quote: data };
}

export async function deleteQuote(
  quoteId: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", quoteId)
    .eq("company_id", company.id);

  if (error) {
    console.error("Error deleting quote:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============ INVOICES ============

export type InvoiceWithClient = Invoice & {
  clients: Pick<Client, "id" | "first_name" | "last_name"> | null;
};

export async function getInvoices(): Promise<Invoice[]> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return [];

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }

  return data ?? [];
}

export async function getInvoicesWithClients(): Promise<InvoiceWithClient[]> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return [];

  const { data, error } = await supabase
    .from("invoices")
    .select("*, clients(id, first_name, last_name)")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invoices with clients:", error);
    return [];
  }

  return data ?? [];
}

export async function getInvoice(invoiceId: number): Promise<Invoice | null> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return null;

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("company_id", company.id)
    .single();

  if (error) {
    console.error("Error fetching invoice:", error);
    return null;
  }

  return data;
}

export async function createInvoice(
  invoiceData: Omit<InvoiceInsert, "company_id">,
): Promise<{ success: boolean; error?: string; invoice?: Invoice }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      ...invoiceData,
      company_id: company.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating invoice:", error);
    return { success: false, error: error.message };
  }

  return { success: true, invoice: data };
}

export async function updateInvoice(
  invoiceId: number,
  updates: InvoiceUpdate,
): Promise<{ success: boolean; error?: string; invoice?: Invoice }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", invoiceId)
    .eq("company_id", company.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating invoice:", error);
    return { success: false, error: error.message };
  }

  return { success: true, invoice: data };
}

export async function deleteInvoice(
  invoiceId: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("company_id", company.id);

  if (error) {
    console.error("Error deleting invoice:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============ DOCUMENT NUMBER GENERATION ============

export async function getNextQuoteNumber(): Promise<string> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    const year = new Date().getFullYear();
    return `DEV-${year}-0001`;
  }

  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;

  const { data, error } = await supabase
    .from("quotes")
    .select("quote_number")
    .eq("company_id", company.id)
    .like("quote_number", `${prefix}%`)
    .order("quote_number", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error getting next quote number:", error);
    return `${prefix}0001`;
  }

  if (!data || data.length === 0) {
    return `${prefix}0001`;
  }

  const lastNumber = data[0].quote_number;
  const lastSequence = parseInt(lastNumber.replace(prefix, ""), 10);
  const nextSequence = (lastSequence + 1).toString().padStart(4, "0");

  return `${prefix}${nextSequence}`;
}

export async function getNextInvoiceNumber(): Promise<string> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    const year = new Date().getFullYear();
    return `FAC-${year}-0001`;
  }

  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;

  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("company_id", company.id)
    .like("invoice_number", `${prefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error getting next invoice number:", error);
    return `${prefix}0001`;
  }

  if (!data || data.length === 0) {
    return `${prefix}0001`;
  }

  const lastNumber = data[0].invoice_number;
  const lastSequence = parseInt(lastNumber.replace(prefix, ""), 10);
  const nextSequence = (lastSequence + 1).toString().padStart(4, "0");

  return `${prefix}${nextSequence}`;
}

// ============ DOCUMENTS BY CLIENT ============

export async function getQuotesByClient(clientId: number): Promise<Quote[]> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return [];

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("company_id", company.id)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching quotes by client:", error);
    return [];
  }

  return data ?? [];
}

export async function getInvoicesByClient(
  clientId: number,
): Promise<Invoice[]> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return [];

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", company.id)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invoices by client:", error);
    return [];
  }

  return data ?? [];
}

export type ClientDocument = {
  id: number;
  type: "quote" | "invoice";
  number: string | null;
  date: string;
  totalTTC?: number;
};

export async function getDocumentsByClient(
  clientId: number,
): Promise<ClientDocument[]> {
  const [quotes, invoices] = await Promise.all([
    getQuotesByClient(clientId),
    getInvoicesByClient(clientId),
  ]);

  const documents: ClientDocument[] = [
    ...quotes.map((q) => ({
      id: q.id,
      type: "quote" as const,
      number: q.quote_number,
      date: q.created_at,
      totalTTC: (q.content as { totalTTC?: number } | null)?.totalTTC,
    })),
    ...invoices.map((i) => ({
      id: i.id,
      type: "invoice" as const,
      number: i.invoice_number,
      date: i.created_at,
      totalTTC: (i.content as { totalTTC?: number } | null)?.totalTTC,
    })),
  ];

  // Sort by date descending
  documents.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return documents;
}

// ============ CLIENT SEARCH/CREATE ============

export interface ClientSearchParams {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export async function findOrCreateClient(
  params: ClientSearchParams & { type?: string },
): Promise<{
  success: boolean;
  error?: string;
  client?: Client;
  isNew: boolean;
}> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return {
      success: false,
      error: "Aucune entreprise associée",
      isNew: false,
    };
  }

  // Build search query - look for existing client
  let query = supabase.from("clients").select("*").eq("company_id", company.id);

  const conditions: string[] = [];

  if (params.email && params.email.trim()) {
    conditions.push(`email.ilike.%${params.email.trim()}%`);
  }
  if (params.phone && params.phone.trim()) {
    const normalizedPhone = params.phone.replace(/\s/g, "");
    conditions.push(`phone.ilike.%${normalizedPhone}%`);
  }
  if (params.firstName && params.lastName) {
    conditions.push(
      `and(first_name.ilike.%${params.firstName.trim()}%,last_name.ilike.%${params.lastName.trim()}%)`,
    );
  } else if (params.lastName) {
    conditions.push(`last_name.ilike.%${params.lastName.trim()}%`);
  } else if (params.firstName) {
    conditions.push(`first_name.ilike.%${params.firstName.trim()}%`);
  }

  if (conditions.length > 0) {
    query = query.or(conditions.join(","));
  }

  const { data: existingClients, error: searchError } = await query.limit(1);

  if (searchError) {
    console.error("Error searching for client:", searchError);
    return { success: false, error: searchError.message, isNew: false };
  }

  // If client exists, return it
  if (existingClients && existingClients.length > 0) {
    return { success: true, client: existingClients[0], isNew: false };
  }

  // No existing client found, create a new one
  const newClientData: ClientInsert = {
    company_id: company.id,
    type: params.type || "particulier",
    first_name: params.firstName || null,
    last_name: params.lastName || null,
    email: params.email || null,
    phone: params.phone || null,
  };

  const { data: newClient, error: createError } = await supabase
    .from("clients")
    .insert(newClientData)
    .select()
    .single();

  if (createError) {
    console.error("Error creating client:", createError);
    return { success: false, error: createError.message, isNew: false };
  }

  return { success: true, client: newClient, isNew: true };
}

// ============ DOCUMENT CREATION WITH CONTENT ============

export async function createQuoteWithContent(
  quoteNumber: string,
  content: Record<string, unknown>,
  validUntil?: string,
  clientId?: number,
): Promise<{ success: boolean; error?: string; quote?: Quote }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  // Calculate valid_until date (default: 1 month from now)
  let validUntilDate = validUntil;
  if (!validUntilDate) {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    validUntilDate = date.toISOString().split("T")[0];
  }

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      company_id: company.id,
      client_id: clientId || null,
      quote_number: quoteNumber,
      valid_until: validUntilDate,
      content,
      payment_terms: null,
      pdf_url: null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating quote:", error);
    return { success: false, error: error.message };
  }

  return { success: true, quote: data };
}

export async function createInvoiceWithContent(
  invoiceNumber: string,
  content: Record<string, unknown>,
  dueDate?: string,
  clientId?: number,
): Promise<{ success: boolean; error?: string; invoice?: Invoice }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  let dueDateValue = dueDate;
  if (!dueDateValue) {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    dueDateValue = date.toISOString().split("T")[0];
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      company_id: company.id,
      client_id: clientId || null,
      invoice_number: invoiceNumber,
      due_date: dueDateValue,
      content,
      payment_terms: null,
      pdf_url: null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating invoice:", error);
    return { success: false, error: error.message };
  }

  return { success: true, invoice: data };
}

// ============ DASHBOARD ============

export interface DashboardStats {
  totalRevenue: number;
  totalClients: number;
  totalDocuments: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { totalRevenue: 0, totalClients: 0, totalDocuments: 0 };
  }

  // Get current month boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  // Get invoices for current month to calculate revenue
  const { data: invoices } = await supabase
    .from("invoices")
    .select("content")
    .eq("company_id", company.id)
    .gte("created_at", startOfMonth.toISOString())
    .lte("created_at", endOfMonth.toISOString());

  // Calculate total revenue from invoices
  const totalRevenue =
    invoices?.reduce((sum, invoice) => {
      const content = invoice.content as { totalTTC?: number } | null;
      return sum + (content?.totalTTC || 0);
    }, 0) || 0;

  // Get total clients
  const { count: clientsCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("company_id", company.id);

  // Get total quotes
  const { count: quotesCount } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .eq("company_id", company.id);

  // Get total invoices
  const { count: invoicesCount } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("company_id", company.id);

  return {
    totalRevenue,
    totalClients: clientsCount || 0,
    totalDocuments: (quotesCount || 0) + (invoicesCount || 0),
  };
}

export interface RecentActivity {
  id: number;
  type: "quote" | "invoice";
  number: string | null;
  clientName: string | null;
  totalTTC: number;
  createdAt: string;
}

export async function getTodayActivity(): Promise<RecentActivity[]> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return [];

  // Get today's boundaries
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );

  // Get today's quotes
  const { data: quotes } = await supabase
    .from("quotes")
    .select(
      "id, quote_number, content, created_at, clients(first_name, last_name)",
    )
    .eq("company_id", company.id)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString())
    .order("created_at", { ascending: false });

  // Get today's invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, content, created_at, clients(first_name, last_name)",
    )
    .eq("company_id", company.id)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString())
    .order("created_at", { ascending: false });

  const activities: RecentActivity[] = [];

  // Add quotes to activities
  quotes?.forEach((quote) => {
    const content = quote.content as { totalTTC?: number } | null;
    const client = quote.clients as unknown as {
      first_name: string | null;
      last_name: string | null;
    } | null;
    const clientName = client
      ? [client.first_name, client.last_name].filter(Boolean).join(" ") || null
      : null;

    activities.push({
      id: quote.id,
      type: "quote",
      number: quote.quote_number,
      clientName,
      totalTTC: content?.totalTTC || 0,
      createdAt: quote.created_at,
    });
  });

  // Add invoices to activities
  invoices?.forEach((invoice) => {
    const content = invoice.content as { totalTTC?: number } | null;
    const client = invoice.clients as unknown as {
      first_name: string | null;
      last_name: string | null;
    } | null;
    const clientName = client
      ? [client.first_name, client.last_name].filter(Boolean).join(" ") || null
      : null;

    activities.push({
      id: invoice.id,
      type: "invoice",
      number: invoice.invoice_number,
      clientName,
      totalTTC: content?.totalTTC || 0,
      createdAt: invoice.created_at,
    });
  });

  // Sort by created_at descending
  activities.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return activities;
}
