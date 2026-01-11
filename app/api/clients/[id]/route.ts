import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    // Vérification de l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer la company de l'utilisateur
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!company) {
      return NextResponse.json(
        { error: "Aucune entreprise associée" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: "ID client invalide" },
        { status: 400 },
      );
    }

    // Vérifier que le client appartient à la company de l'utilisateur
    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .eq("company_id", company.id)
      .single();

    if (error) {
      console.error("Error fetching client:", error);
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error in GET /api/clients/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
