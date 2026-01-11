import { getProfile, getCompany, getClients } from "@/lib/supabase/api";
import { EditionClient } from "./edition-client";

export default async function EditionPage() {
  const [profile, company, clients] = await Promise.all([
    getProfile(),
    getCompany(),
    getClients(),
  ]);

  const userInitial = profile?.last_name?.charAt(0).toUpperCase() || "U";

  return (
    <EditionClient
      userInitial={userInitial}
      company={company}
      clients={clients}
    />
  );
}
