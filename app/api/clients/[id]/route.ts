import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: "ID client invalide" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
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
