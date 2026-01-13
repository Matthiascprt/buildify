import { NextRequest, NextResponse } from "next/server";
import {
  getNextQuoteNumber,
  getNextInvoiceNumber,
  createQuoteWithContent,
  createInvoiceWithContent,
  findOrCreateClient,
  updateQuote,
  updateInvoice,
  getCurrentUser,
} from "@/lib/supabase/api";
import type { DocumentData } from "@/lib/types/document";

interface CreateDocumentRequest {
  type: "quote" | "invoice";
  content: DocumentData;
}

interface UpdateDocumentRequest {
  documentId: number;
  type: "quote" | "invoice";
  content: DocumentData;
  clientInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Vérification de l'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body: CreateDocumentRequest = await req.json();
    const { type, content } = body;

    if (type === "quote") {
      const quoteNumber = await getNextQuoteNumber();
      const result = await createQuoteWithContent(
        quoteNumber,
        content as unknown as Record<string, unknown>,
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        document: result.quote,
        documentNumber: quoteNumber,
      });
    } else {
      const invoiceNumber = await getNextInvoiceNumber();
      const result = await createInvoiceWithContent(
        invoiceNumber,
        content as unknown as Record<string, unknown>,
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        document: result.invoice,
        documentNumber: invoiceNumber,
      });
    }
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création du document" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Vérification de l'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body: UpdateDocumentRequest = await req.json();
    const { documentId, type, content, clientInfo } = body;

    let clientId: number | undefined;

    // Handle client creation/association if client info is provided
    if (
      clientInfo &&
      (clientInfo.firstName ||
        clientInfo.lastName ||
        clientInfo.email ||
        clientInfo.phone)
    ) {
      const clientResult = await findOrCreateClient({
        firstName: clientInfo.firstName,
        lastName: clientInfo.lastName,
        email: clientInfo.email,
        phone: clientInfo.phone,
      });

      if (clientResult.success && clientResult.client) {
        clientId = clientResult.client.id;
      }
    }

    if (type === "quote") {
      const quoteContent = content as unknown as Record<string, unknown>;
      const result = await updateQuote(documentId, {
        content: quoteContent,
        client_id: clientId,
        valid_until: quoteContent.validity
          ? parseValidityToDate(quoteContent.validity as string)
          : undefined,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        document: result.quote,
        clientId,
      });
    } else {
      const invoiceContent = content as unknown as Record<string, unknown>;
      const result = await updateInvoice(documentId, {
        content: invoiceContent,
        client_id: clientId,
        due_date: invoiceContent.dueDate
          ? parseDateString(invoiceContent.dueDate as string)
          : undefined,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        document: result.invoice,
        clientId,
      });
    }
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour du document" },
      { status: 500 },
    );
  }
}

function parseValidityToDate(validity: string): string {
  const today = new Date();
  const lowerValidity = validity.toLowerCase();

  if (lowerValidity.includes("mois")) {
    const months = parseInt(lowerValidity) || 1;
    today.setMonth(today.getMonth() + months);
  } else if (lowerValidity.includes("jour")) {
    const days = parseInt(lowerValidity) || 30;
    today.setDate(today.getDate() + days);
  } else if (lowerValidity.includes("semaine")) {
    const weeks = parseInt(lowerValidity) || 1;
    today.setDate(today.getDate() + weeks * 7);
  } else {
    // Default to 1 month
    today.setMonth(today.getMonth() + 1);
  }

  return today.toISOString().split("T")[0];
}

function parseDateString(dateStr: string): string {
  // Handle formats like "15/02/2026" or "30 jours"
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }

  if (dateStr.toLowerCase().includes("jour")) {
    const days = parseInt(dateStr) || 30;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  }

  // Return as-is if already in ISO format
  return dateStr;
}

interface LinkClientRequest {
  documentId: number;
  type: "quote" | "invoice";
  clientId: number;
}

export async function PATCH(req: NextRequest) {
  try {
    // Vérification de l'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body: LinkClientRequest = await req.json();
    const { documentId, type, clientId } = body;

    if (type === "quote") {
      const result = await updateQuote(documentId, {
        client_id: clientId,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        document: result.quote,
      });
    } else {
      const result = await updateInvoice(documentId, {
        client_id: clientId,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        document: result.invoice,
      });
    }
  } catch (error) {
    console.error("Error linking client to document:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la liaison du client" },
      { status: 500 },
    );
  }
}
