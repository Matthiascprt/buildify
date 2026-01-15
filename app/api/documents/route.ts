import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUser,
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from "@/lib/supabase/api";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    // Get single document by ID
    if (id && type) {
      if (type === "quote") {
        const quote = await getQuote(id);
        if (!quote) {
          return NextResponse.json(
            { error: "Devis non trouvé" },
            { status: 404 },
          );
        }
        return NextResponse.json({ document: quote, type: "quote" });
      } else if (type === "invoice") {
        const invoice = await getInvoice(id);
        if (!invoice) {
          return NextResponse.json(
            { error: "Facture non trouvée" },
            { status: 404 },
          );
        }
        return NextResponse.json({ document: invoice, type: "invoice" });
      }
    }

    // Get all documents
    const [quotes, invoices] = await Promise.all([getQuotes(), getInvoices()]);

    return NextResponse.json({
      quotes,
      invoices,
    });
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    console.log("[DEBUG] POST /api/documents - User:", user?.id);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { type, ...data } = body;
    console.log(
      "[DEBUG] POST /api/documents - Type:",
      type,
      "Data:",
      JSON.stringify(data, null, 2),
    );

    if (type === "quote") {
      console.log("[DEBUG] Creating quote...");
      const result = await createQuote(data);
      console.log("[DEBUG] createQuote result:", result);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ document: result.quote, type: "quote" });
    } else if (type === "invoice") {
      console.log("[DEBUG] Creating invoice...");
      const result = await createInvoice(data);
      console.log("[DEBUG] createInvoice result:", result);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ document: result.invoice, type: "invoice" });
    }

    return NextResponse.json(
      { error: "Type de document invalide" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[DEBUG] Documents POST error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json({ error: "ID et type requis" }, { status: 400 });
    }

    const body = await req.json();

    if (type === "quote") {
      const result = await updateQuote(id, body);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ document: result.quote, type: "quote" });
    } else if (type === "invoice") {
      const result = await updateInvoice(id, body);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ document: result.invoice, type: "invoice" });
    }

    return NextResponse.json(
      { error: "Type de document invalide" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Documents PATCH error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json({ error: "ID et type requis" }, { status: 400 });
    }

    if (type === "quote") {
      const result = await deleteQuote(id);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    } else if (type === "invoice") {
      const result = await deleteInvoice(id);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Type de document invalide" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Documents DELETE error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}
