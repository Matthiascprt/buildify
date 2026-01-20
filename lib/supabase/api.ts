"use server";

import { createClient } from "./server";
import { incrementDocumentUsage } from "./subscription";
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
  DocumentContent,
  DashboardStats,
  RecentActivity,
  AdvancedDashboardStats,
  RevenueDataPoint,
  DocumentDistribution,
  TodayClient,
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

// ============ THEME ============

export async function getUserTheme(): Promise<"light" | "dark"> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return "light";

  const { data, error } = await supabase
    .from("profiles")
    .select("theme")
    .eq("id", user.id)
    .single();

  if (error || !data?.theme) {
    return "light";
  }

  return data.theme as "light" | "dark";
}

export async function updateUserTheme(
  theme: "light" | "dark",
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ theme })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating theme:", error);
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

export async function getClient(clientId: string): Promise<Client | null> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return null;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("company_id", company.id)
    .single();

  if (error) {
    console.error("Error fetching client:", error);
    return null;
  }

  return data;
}

export async function addClient(
  clientData: Omit<ClientInsert, "company_id">,
): Promise<{ success: boolean; error?: string; client?: Client }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  const existingClients = await getClients();
  const duplicates: string[] = [];

  const newFirst = (clientData.first_name || "").toLowerCase().trim();
  const newLast = (clientData.last_name || "").toLowerCase().trim();
  const newEmail = (clientData.email || "").toLowerCase().trim();
  const newPhone = (clientData.phone || "").replace(/\s/g, "").trim();

  for (const client of existingClients) {
    const existFirst = (client.first_name || "").toLowerCase().trim();
    const existLast = (client.last_name || "").toLowerCase().trim();
    const existEmail = (client.email || "").toLowerCase().trim();
    const existPhone = (client.phone || "").replace(/\s/g, "").trim();

    if (
      newFirst &&
      newLast &&
      existFirst === newFirst &&
      existLast === newLast
    ) {
      duplicates.push(
        `Le client "${client.first_name} ${client.last_name}" existe déjà`,
      );
    }

    if (newEmail && existEmail && existEmail === newEmail) {
      duplicates.push(`L'email "${clientData.email}" est déjà utilisé`);
    }

    if (newPhone && existPhone && existPhone === newPhone) {
      duplicates.push(`Le téléphone "${clientData.phone}" est déjà utilisé`);
    }
  }

  if (duplicates.length > 0) {
    return { success: false, error: duplicates[0] };
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
  clientId: string,
  updates: ClientUpdate,
): Promise<{ success: boolean; error?: string; client?: Client }> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  const existingClients = await getClients();
  const duplicates: string[] = [];

  const newFirst = (updates.first_name || "").toLowerCase().trim();
  const newLast = (updates.last_name || "").toLowerCase().trim();
  const newEmail = (updates.email || "").toLowerCase().trim();
  const newPhone = (updates.phone || "").replace(/\s/g, "").trim();

  for (const client of existingClients) {
    if (client.id === clientId) continue;

    const existFirst = (client.first_name || "").toLowerCase().trim();
    const existLast = (client.last_name || "").toLowerCase().trim();
    const existEmail = (client.email || "").toLowerCase().trim();
    const existPhone = (client.phone || "").replace(/\s/g, "").trim();

    if (
      newFirst &&
      newLast &&
      existFirst === newFirst &&
      existLast === newLast
    ) {
      duplicates.push(
        `Le client "${client.first_name} ${client.last_name}" existe déjà`,
      );
    }

    if (newEmail && existEmail && existEmail === newEmail) {
      duplicates.push(`L'email "${updates.email}" est déjà utilisé`);
    }

    if (newPhone && existPhone && existPhone === newPhone) {
      duplicates.push(`Le téléphone "${updates.phone}" est déjà utilisé`);
    }
  }

  if (duplicates.length > 0) {
    return { success: false, error: duplicates[0] };
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
  clientId: string,
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

export async function searchClientsByName(
  searchTerm: string,
): Promise<Client[]> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company || !searchTerm.trim()) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", company.id)
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
    .limit(5);

  if (error) {
    console.error("Error searching clients:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Find an existing client by name/email/phone OR create a new one
 * Returns the existing client if found, otherwise creates and returns the new client
 */
export async function findOrCreateClient(
  clientData: Omit<ClientInsert, "company_id">,
): Promise<{
  success: boolean;
  error?: string;
  client?: Client;
  isNew: boolean;
}> {
  const company = await getCompany();

  if (!company) {
    return {
      success: false,
      error: "Aucune entreprise associée",
      isNew: false,
    };
  }

  const existingClients = await getClients();

  const newFirst = (clientData.first_name || "").toLowerCase().trim();
  const newLast = (clientData.last_name || "").toLowerCase().trim();
  const newEmail = (clientData.email || "").toLowerCase().trim();
  const newPhone = (clientData.phone || "").replace(/\s/g, "").trim();

  // Check for existing client by exact match
  for (const client of existingClients) {
    const existFirst = (client.first_name || "").toLowerCase().trim();
    const existLast = (client.last_name || "").toLowerCase().trim();
    const existEmail = (client.email || "").toLowerCase().trim();
    const existPhone = (client.phone || "").replace(/\s/g, "").trim();

    // Match by full name
    if (
      newFirst &&
      newLast &&
      existFirst === newFirst &&
      existLast === newLast
    ) {
      return { success: true, client, isNew: false };
    }

    // Match by last name only (if no first name provided)
    if (!newFirst && newLast && existLast === newLast) {
      return { success: true, client, isNew: false };
    }

    // Match by email
    if (newEmail && existEmail && existEmail === newEmail) {
      return { success: true, client, isNew: false };
    }

    // Match by phone
    if (newPhone && existPhone && existPhone === newPhone) {
      return { success: true, client, isNew: false };
    }
  }

  // No existing client found, create new one
  const supabase = await createClient();
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
    return { success: false, error: error.message, isNew: false };
  }

  return { success: true, client: data, isNew: true };
}

// ============ LOGO UPLOAD ============

export async function updateCompanyLogoUrl(
  logoUrl: string | null,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const company = await getCompany();
  if (!company) {
    return { success: false, error: "Aucune entreprise associée" };
  }

  if (logoUrl === null && company.logo_url) {
    try {
      const url = new URL(company.logo_url);
      const pathMatch = url.pathname.match(
        /\/storage\/v1\/object\/public\/client-uploads\/(.+)$/,
      );
      if (pathMatch && pathMatch[1]) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const { error: deleteError } = await supabase.storage
          .from("client-uploads")
          .remove([filePath]);
        if (deleteError) {
          console.error("Error deleting logo from storage:", deleteError);
        }
      }
    } catch (err) {
      console.error("Error parsing logo URL for deletion:", err);
    }
  }

  const { error: updateError } = await supabase
    .from("companies")
    .update({ logo_url: logoUrl })
    .eq("id", company.id);

  if (updateError) {
    console.error("Error updating company logo URL:", updateError);
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function getLogoUploadInfo(): Promise<{
  success: boolean;
  error?: string;
  userId?: string;
}> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Note: We only need userId for the file path
  // Company may not exist yet during initial setup
  return { success: true, userId: user.id };
}

// ============ QUOTES (DEVIS) ============

function createEmptyContent(): DocumentContent {
  return {
    project_title: "",
    sections: [],
    totals: {
      total_ht: 0,
      total_vat: 0,
      deposit: 0,
      total_ttc: 0,
    },
  };
}

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

export async function getQuote(quoteId: string): Promise<Quote | null> {
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

export async function getLastQuote(): Promise<Quote | null> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return null;

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getNextQuoteNumber(): Promise<string> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-0001`;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `${year}-${month}-`;

  const { data } = await supabase
    .from("quotes")
    .select("number")
    .eq("company_id", company.id)
    .like("number", `${prefix}%`)
    .order("number", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const lastNumber = data[0].number;
    const seq = parseInt(lastNumber.split("-")[2], 10) + 1;
    return `${prefix}${String(seq).padStart(4, "0")}`;
  }

  return `${prefix}0001`;
}

export async function createQuote(
  quoteData: Omit<QuoteInsert, "company_id">,
): Promise<{ success: boolean; error?: string; quote?: Quote }> {
  const supabase = await createClient();
  const company = await getCompany();

  console.log("[DEBUG] createQuote - company:", company?.id);
  console.log(
    "[DEBUG] createQuote - quoteData:",
    JSON.stringify(quoteData, null, 2),
  );

  if (!company) {
    console.log("[DEBUG] createQuote - No company found!");
    return { success: false, error: "Aucune entreprise associée" };
  }

  const insertData = {
    ...quoteData,
    company_id: company.id,
    content: quoteData.content || createEmptyContent(),
  };
  console.log(
    "[DEBUG] createQuote - insertData:",
    JSON.stringify(insertData, null, 2),
  );

  const { data, error } = await supabase
    .from("quotes")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("[DEBUG] Error creating quote:", error);
    return { success: false, error: error.message };
  }

  await incrementDocumentUsage();

  console.log("[DEBUG] createQuote - Success! Quote ID:", data?.id);
  return { success: true, quote: data };
}

export async function updateQuote(
  quoteId: string,
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
  quoteId: string,
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

// ============ INVOICES (FACTURES) ============

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

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
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

export async function getNextInvoiceNumber(): Promise<string> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-0001`;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `${year}-${month}-`;

  const { data } = await supabase
    .from("invoices")
    .select("number")
    .eq("company_id", company.id)
    .like("number", `${prefix}%`)
    .order("number", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const lastNumber = data[0].number;
    const seq = parseInt(lastNumber.split("-")[2], 10) + 1;
    return `${prefix}${String(seq).padStart(4, "0")}`;
  }

  return `${prefix}0001`;
}

export async function createInvoice(
  invoiceData: Omit<InvoiceInsert, "company_id">,
): Promise<{ success: boolean; error?: string; invoice?: Invoice }> {
  const supabase = await createClient();
  const company = await getCompany();

  console.log("[DEBUG] createInvoice - company:", company?.id);
  console.log(
    "[DEBUG] createInvoice - invoiceData:",
    JSON.stringify(invoiceData, null, 2),
  );

  if (!company) {
    console.log("[DEBUG] createInvoice - No company found!");
    return { success: false, error: "Aucune entreprise associée" };
  }

  const insertData = {
    ...invoiceData,
    company_id: company.id,
    content: invoiceData.content || createEmptyContent(),
  };
  console.log(
    "[DEBUG] createInvoice - insertData:",
    JSON.stringify(insertData, null, 2),
  );

  const { data, error } = await supabase
    .from("invoices")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("[DEBUG] Error creating invoice:", error);
    return { success: false, error: error.message };
  }

  await incrementDocumentUsage();

  console.log("[DEBUG] createInvoice - Success! Invoice ID:", data?.id);
  return { success: true, invoice: data };
}

export async function updateInvoice(
  invoiceId: string,
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
  invoiceId: string,
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

// ============ DOCUMENTS BY CLIENT ============

export async function getClientDocuments(clientId: string): Promise<{
  quotes: Quote[];
  invoices: Invoice[];
  companyName?: string;
  companyLogo?: string;
}> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return { quotes: [], invoices: [] };

  const [quotesResult, invoicesResult] = await Promise.all([
    supabase
      .from("quotes")
      .select("*")
      .eq("company_id", company.id)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("*")
      .eq("company_id", company.id)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    quotes: quotesResult.data ?? [],
    invoices: invoicesResult.data ?? [],
    companyName: company.name || undefined,
    companyLogo: company.logo_url || undefined,
  };
}

// ============ DASHBOARD ============

export async function getDashboardStats(): Promise<DashboardStats> {
  const company = await getCompany();

  if (!company) {
    return { totalDocuments: 0, totalClients: 0, totalRevenue: 0 };
  }

  const [quotes, invoices, clients] = await Promise.all([
    getQuotes(),
    getInvoices(),
    getClients(),
  ]);

  // Calculate revenue from invoices this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyRevenue = invoices
    .filter((inv) => new Date(inv.created_at) >= startOfMonth)
    .reduce((sum, inv) => sum + (inv.content?.totals?.total_ttc || 0), 0);

  return {
    totalDocuments: quotes.length + invoices.length,
    totalClients: clients.length,
    totalRevenue: monthlyRevenue,
  };
}

export async function getTodayActivity(): Promise<RecentActivity[]> {
  const supabase = await createClient();
  const company = await getCompany();

  if (!company) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [quotesResult, invoicesResult] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, number, client_id, content, created_at")
      .eq("company_id", company.id)
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, number, client_id, content, created_at")
      .eq("company_id", company.id)
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const clients = await getClients();
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  const activities: RecentActivity[] = [];

  for (const quote of quotesResult.data ?? []) {
    const client = quote.client_id ? clientMap.get(quote.client_id) : null;
    activities.push({
      id: quote.id,
      type: "quote",
      number: quote.number,
      clientName: client
        ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
        : null,
      totalTTC: quote.content?.totals?.total_ttc || 0,
      createdAt: quote.created_at,
    });
  }

  for (const invoice of invoicesResult.data ?? []) {
    const client = invoice.client_id ? clientMap.get(invoice.client_id) : null;
    activities.push({
      id: invoice.id,
      type: "invoice",
      number: invoice.number,
      clientName: client
        ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
        : null,
      totalTTC: invoice.content?.totals?.total_ttc || 0,
      createdAt: invoice.created_at,
    });
  }

  // Sort by created_at descending
  activities.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return activities;
}

export async function getAdvancedDashboardStats(): Promise<AdvancedDashboardStats> {
  const company = await getCompany();

  const emptyStats: AdvancedDashboardStats = {
    totalDocuments: 0,
    totalClients: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    pendingQuotes: 0,
    pendingQuotesAmount: 0,
    revenueData: [],
    documentDistribution: [],
    todayClients: [],
    todayDocuments: [],
  };

  if (!company) return emptyStats;

  const [quotes, invoices, clients] = await Promise.all([
    getQuotes(),
    getInvoices(),
    getClients(),
  ]);

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate revenue for last 6 months
  const revenueData: RevenueDataPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthName = monthDate.toLocaleDateString("fr-FR", { month: "short" });

    const monthInvoices = invoices.filter((inv) => {
      const invDate = new Date(inv.created_at);
      return invDate >= monthDate && invDate <= monthEnd;
    });

    const monthRevenue = monthInvoices.reduce(
      (sum, inv) => sum + (inv.content?.totals?.total_ttc || 0),
      0,
    );

    revenueData.push({
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      revenue: monthRevenue,
      invoices: monthInvoices.length,
    });
  }

  // Current month revenue
  const currentMonthRevenue = revenueData[revenueData.length - 1]?.revenue || 0;
  const previousMonthRevenue =
    revenueData[revenueData.length - 2]?.revenue || 0;

  // Calculate monthly growth percentage
  let monthlyGrowth = 0;
  if (previousMonthRevenue > 0) {
    // Normal case: calculate percentage change
    monthlyGrowth =
      ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
      100;
  } else if (currentMonthRevenue > 0) {
    // Previous month was 0, current month has revenue = 100% growth
    monthlyGrowth = 100;
  }
  // If both are 0, monthlyGrowth stays at 0

  // Document distribution
  const documentDistribution: DocumentDistribution[] = [
    { name: "Devis", value: quotes.length, color: "#f97316" },
    { name: "Factures", value: invoices.length, color: "#f59e0b" },
  ];

  // Pending quotes (not converted to invoices)
  const pendingQuotes = quotes.length;
  const pendingQuotesAmount = quotes.reduce(
    (sum, q) => sum + (q.content?.totals?.total_ttc || 0),
    0,
  );

  // Today's clients
  const todayClients: TodayClient[] = clients
    .filter((c) => new Date(c.created_at) >= today)
    .map((c) => ({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email,
      phone: c.phone,
      type: c.type,
      createdAt: c.created_at,
    }));

  // Today's documents
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const todayDocuments: RecentActivity[] = [];

  for (const quote of quotes) {
    if (new Date(quote.created_at) >= today) {
      const client = quote.client_id ? clientMap.get(quote.client_id) : null;
      todayDocuments.push({
        id: quote.id,
        type: "quote",
        number: quote.number,
        clientName: client
          ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
          : null,
        totalTTC: quote.content?.totals?.total_ttc || 0,
        createdAt: quote.created_at,
        companyName: company.name || undefined,
        companyLogo: company.logo_url || undefined,
        accentColor: quote.color || undefined,
        projectTitle: quote.content?.project_title || undefined,
      });
    }
  }

  for (const invoice of invoices) {
    if (new Date(invoice.created_at) >= today) {
      const client = invoice.client_id
        ? clientMap.get(invoice.client_id)
        : null;
      todayDocuments.push({
        id: invoice.id,
        type: "invoice",
        number: invoice.number,
        clientName: client
          ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
          : null,
        totalTTC: invoice.content?.totals?.total_ttc || 0,
        createdAt: invoice.created_at,
        companyName: company.name || undefined,
        companyLogo: company.logo_url || undefined,
        accentColor: invoice.color || undefined,
        projectTitle: invoice.content?.project_title || undefined,
      });
    }
  }

  todayDocuments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    totalDocuments: quotes.length + invoices.length,
    totalClients: clients.length,
    totalRevenue: currentMonthRevenue,
    monthlyGrowth,
    pendingQuotes,
    pendingQuotesAmount,
    revenueData,
    documentDistribution,
    todayClients,
    todayDocuments,
  };
}
