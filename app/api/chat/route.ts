import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/chat/completions";
import { documentTools, executeToolCall } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import type { DocumentData } from "@/lib/types/document";
import type { Company, Client } from "@/lib/supabase/types";
import {
  updateQuote,
  updateInvoice,
  findOrCreateClient,
} from "@/lib/supabase/api";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatRequestBody {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  document: DocumentData | null;
  company: Company | null;
  clients: Client[];
  nextQuoteNumber: string;
  nextInvoiceNumber: string;
}

interface ChatResponse {
  message: string;
  document: DocumentData | null;
}

const MAX_TOOL_ITERATIONS = 10;

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ChatResponse | { error: string }>> {
  try {
    const body: ChatRequestBody = await req.json();
    const {
      messages,
      document: currentDocument,
      company,
      clients,
      nextQuoteNumber,
      nextInvoiceNumber,
    } = body;

    const systemPrompt = buildSystemPrompt({
      company,
      clients,
      currentDocument,
    });

    const toolContext = {
      company: company || {
        id: "",
        created_at: "",
        user_id: null,
        name: "Mon Entreprise",
        legal_status: null,
        address: null,
        email: null,
        phone: null,
        siret: null,
        vat_rate: 20,
        logo_url: null,
      },
      nextQuoteNumber,
      nextInvoiceNumber,
    };

    let workingDocument = currentDocument;
    const openaiMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: openaiMessages,
        tools: documentTools,
        tool_choice: "auto",
      });

      const assistantMessage = completion.choices[0].message;
      openaiMessages.push(assistantMessage);

      if (
        !assistantMessage.tool_calls ||
        assistantMessage.tool_calls.length === 0
      ) {
        // Save document to database before returning
        if (workingDocument?.id) {
          await saveDocumentToDatabase(workingDocument);
        }
        return NextResponse.json({
          message: assistantMessage.content || "",
          document: workingDocument,
        });
      }

      const toolResults: ChatCompletionToolMessageParam[] = [];

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;

        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        const { document: updatedDocument, result } = executeToolCall(
          functionName,
          functionArgs,
          workingDocument,
          toolContext,
        );

        workingDocument = updatedDocument;

        // Handle client creation when set_client is called
        if (functionName === "set_client" && workingDocument?.id) {
          const clientResult = await handleClientAssociation(
            workingDocument,
            functionArgs,
          );
          if (clientResult.clientId && workingDocument.client) {
            workingDocument.client.id = clientResult.clientId;
          }
        }

        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      openaiMessages.push(...toolResults);
    }

    // Save document to database before returning
    if (workingDocument?.id) {
      await saveDocumentToDatabase(workingDocument);
    }

    return NextResponse.json({
      message: "J'ai effectué les modifications demandées.",
      document: workingDocument,
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la génération de la réponse" },
      { status: 500 },
    );
  }
}

// Helper function to save document to database
async function saveDocumentToDatabase(document: DocumentData): Promise<void> {
  if (!document.id) return;

  try {
    const content = document as unknown as Record<string, unknown>;

    if (document.type === "quote") {
      await updateQuote(document.id, {
        content,
        valid_until: parseValidityToDate(document.validity),
        payment_terms: document.paymentConditions || null,
        client_id: document.client?.id,
      });
    } else {
      await updateInvoice(document.id, {
        content,
        due_date: parseDateString(document.dueDate),
        payment_terms: document.paymentConditions || null,
        client_id: document.client?.id,
      });
    }
  } catch (error) {
    console.error("Error saving document to database:", error);
  }
}

// Helper function to handle client association
async function handleClientAssociation(
  document: DocumentData,
  clientArgs: Record<string, unknown>,
): Promise<{ clientId?: number }> {
  // If clientId is already provided, use it directly
  if (clientArgs.clientId) {
    return { clientId: clientArgs.clientId as number };
  }

  // Extract client info from args
  const name = clientArgs.name as string | undefined;
  let firstName: string | undefined;
  let lastName: string | undefined;

  if (name) {
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(" ");
    } else {
      lastName = name;
    }
  }

  const email = clientArgs.email as string | undefined;
  const phone = clientArgs.phone as string | undefined;

  // Only search/create if we have identifying information
  if (!firstName && !lastName && !email && !phone) {
    return {};
  }

  try {
    const result = await findOrCreateClient({
      firstName,
      lastName,
      email,
      phone,
    });

    if (result.success && result.client) {
      // Update document in database with client association
      if (document.id) {
        if (document.type === "quote") {
          await updateQuote(document.id, { client_id: result.client.id });
        } else {
          await updateInvoice(document.id, { client_id: result.client.id });
        }
      }
      return { clientId: result.client.id };
    }
  } catch (error) {
    console.error("Error handling client association:", error);
  }

  return {};
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
    today.setMonth(today.getMonth() + 1);
  }

  return today.toISOString().split("T")[0];
}

function parseDateString(dateStr: string): string {
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

  return dateStr;
}
