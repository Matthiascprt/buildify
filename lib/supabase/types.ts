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
