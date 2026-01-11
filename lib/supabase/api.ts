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
