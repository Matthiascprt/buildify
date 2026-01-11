import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/chat/completions";
import { documentTools, executeToolCall } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import type { DocumentData, DocumentCompany } from "@/lib/types/document";
import { createEmptyQuote, createEmptyInvoice } from "@/lib/types/document";
import type { Company, Client } from "@/lib/supabase/types";
import {
  updateQuote,
  updateInvoice,
  findOrCreateClient,
  createQuoteWithContent,
  createInvoiceWithContent,
  getCurrentUser,
} from "@/lib/supabase/api";
import { parseUserIntent } from "@/lib/ai/intent-parser";

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
  isFirstMessage?: boolean;
}

interface AutoCreationResult {
  document: DocumentData | null;
  actions: string[];
}

interface ChatResponse {
  message: string;
  document: DocumentData | null;
  accentColor?: string | null;
}

const MAX_TOOL_ITERATIONS = 10;

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ChatResponse | { error: string }>> {
  try {
    // Vérification de l'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body: ChatRequestBody = await req.json();
    const {
      messages,
      document: currentDocument,
      company,
      clients,
      nextQuoteNumber,
      nextInvoiceNumber,
      isFirstMessage,
    } = body;

    let workingDocument = currentDocument;
    const accentColorState: { value: string | null | undefined } = {
      value: undefined,
    };
    const autoActions: string[] = [];

    if (isFirstMessage && !currentDocument && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        const result = await handleAutoCreation(
          lastMessage.content,
          clients,
          company,
          nextQuoteNumber,
          nextInvoiceNumber,
        );
        workingDocument = result.document;
        autoActions.push(...result.actions);
      }
    }

    const systemPrompt = buildSystemPrompt({
      company,
      clients,
      currentDocument: workingDocument,
      autoActions,
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
          await saveDocumentToDatabase(workingDocument, accentColorState.value);
        }
        const response: ChatResponse = {
          message: assistantMessage.content || "",
          document: workingDocument,
        };
        if (accentColorState.value !== undefined) {
          response.accentColor = accentColorState.value;
        }
        return NextResponse.json(response);
      }

      const toolResults: ChatCompletionToolMessageParam[] = [];

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;

        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        const {
          document: updatedDocument,
          result,
          accentColor,
        } = executeToolCall(
          functionName,
          functionArgs,
          workingDocument,
          toolContext,
        );

        workingDocument = updatedDocument;

        // Track accent color changes
        if (accentColor !== undefined) {
          accentColorState.value = accentColor;
        }

        // Handle client creation when set_client is called
        if (functionName === "set_client" && workingDocument?.id) {
          const clientResult = await handleClientAssociation(
            workingDocument,
            functionArgs,
            clients,
          );
          // Update document with full client info from DB
          if (clientResult.client && workingDocument.client) {
            const clientName = [
              clientResult.client.first_name,
              clientResult.client.last_name,
            ]
              .filter(Boolean)
              .join(" ");
            workingDocument.client = {
              id: clientResult.client.id,
              name: clientName,
              address: workingDocument.client.address || "",
              city: workingDocument.client.city || "",
              phone: clientResult.client.phone || "",
              email: clientResult.client.email || "",
              siret: workingDocument.client.siret || "",
            };
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
      await saveDocumentToDatabase(workingDocument, accentColorState.value);
    }

    const response: ChatResponse = {
      message: "J'ai effectué les modifications demandées.",
      document: workingDocument,
    };
    if (accentColorState.value !== undefined) {
      response.accentColor = accentColorState.value;
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la génération de la réponse" },
      { status: 500 },
    );
  }
}

// Helper function to save document to database
async function saveDocumentToDatabase(
  document: DocumentData,
  color?: string | null,
): Promise<void> {
  if (!document.id) return;

  try {
    const content = document as unknown as Record<string, unknown>;

    if (document.type === "quote") {
      await updateQuote(document.id, {
        content,
        valid_until: parseValidityToDate(document.validity),
        payment_terms: document.paymentConditions || null,
        client_id: document.client?.id,
        ...(color !== undefined && { color }),
      });
    } else {
      await updateInvoice(document.id, {
        content,
        due_date: parseDateString(document.dueDate),
        payment_terms: document.paymentConditions || null,
        client_id: document.client?.id,
        ...(color !== undefined && { color }),
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
  clients: Client[],
): Promise<{ client?: Client }> {
  // If clientId is already provided, find the client in the list
  if (clientArgs.clientId) {
    const existingClient = clients.find((c) => c.id === clientArgs.clientId);
    if (existingClient) {
      // Update document in database with client association
      if (document.id) {
        if (document.type === "quote") {
          await updateQuote(document.id, { client_id: existingClient.id });
        } else {
          await updateInvoice(document.id, { client_id: existingClient.id });
        }
      }
      return { client: existingClient };
    }
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

  // First, check if we can find the client by name in the existing clients list
  if (name) {
    const normalizedName = name.toLowerCase().trim();
    const existingClient = clients.find((c) => {
      const clientFullName = [c.first_name, c.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        clientFullName === normalizedName ||
        clientFullName.includes(normalizedName) ||
        normalizedName.includes(clientFullName)
      );
    });

    if (existingClient) {
      // Update document in database with client association
      if (document.id) {
        if (document.type === "quote") {
          await updateQuote(document.id, { client_id: existingClient.id });
        } else {
          await updateInvoice(document.id, { client_id: existingClient.id });
        }
      }
      return { client: existingClient };
    }
  }

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
      return { client: result.client };
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

async function handleAutoCreation(
  message: string,
  clients: Client[],
  company: Company | null,
  nextQuoteNumber: string,
  nextInvoiceNumber: string,
): Promise<AutoCreationResult> {
  const intent = parseUserIntent(message, clients);
  const actions: string[] = [];
  let document: DocumentData | null = null;

  if (!intent.hasDocumentType) {
    return { document: null, actions: [] };
  }

  const companyInfo: DocumentCompany = {
    name: company?.name || "",
    address: company?.address || "",
    city: "",
    phone: company?.phone || "",
    email: company?.email || "",
    siret: company?.siret || "",
    logoUrl: company?.logo_url || undefined,
  };

  const defaultTvaRate = company?.vat_rate ?? 20;

  if (intent.documentType === "quote") {
    document = createEmptyQuote(companyInfo, nextQuoteNumber, defaultTvaRate);
    actions.push(`Devis n°${nextQuoteNumber} créé`);
  } else {
    document = createEmptyInvoice(
      companyInfo,
      nextInvoiceNumber,
      defaultTvaRate,
    );
    actions.push(`Facture n°${nextInvoiceNumber} créée`);
  }

  if (intent.projectTitle) {
    document.projectTitle = intent.projectTitle;
    actions.push(`Titre du projet: "${intent.projectTitle}"`);
  }

  try {
    if (intent.documentType === "quote") {
      const result = await createQuoteWithContent(
        nextQuoteNumber,
        document as unknown as Record<string, unknown>,
      );
      if (result.success && result.quote) {
        document.id = result.quote.id;
      }
    } else {
      const result = await createInvoiceWithContent(
        nextInvoiceNumber,
        document as unknown as Record<string, unknown>,
      );
      if (result.success && result.invoice) {
        document.id = result.invoice.id;
      }
    }
  } catch (error) {
    console.error("Error creating document in database:", error);
  }

  if (intent.clientMatch && document.id) {
    const clientName = [
      intent.clientMatch.first_name,
      intent.clientMatch.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    document.client = {
      id: intent.clientMatch.id,
      name: clientName,
      address: "",
      city: "",
      phone: intent.clientMatch.phone || "",
      email: intent.clientMatch.email || "",
    };

    try {
      if (document.type === "quote") {
        await updateQuote(document.id, { client_id: intent.clientMatch.id });
      } else {
        await updateInvoice(document.id, { client_id: intent.clientMatch.id });
      }
      actions.push(`Client lié: ${clientName}`);
    } catch (error) {
      console.error("Error linking client:", error);
    }
  }

  return { document, actions };
}
