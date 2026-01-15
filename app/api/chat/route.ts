import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getCurrentUser } from "@/lib/supabase/api";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { documentTools, executeToolCall } from "@/lib/ai/tools";
import type { DocumentData } from "@/lib/types/document";
import type { Company, Client } from "@/lib/supabase/types";

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
  accentColor?: string | null;
  isFirstMessage?: boolean;
}

const MAX_TOOL_ITERATIONS = 10;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body: ChatRequestBody = await req.json();
    const {
      messages,
      document: initialDocument,
      company,
      clients,
      nextQuoteNumber,
      nextInvoiceNumber,
    } = body;

    const systemPrompt = buildSystemPrompt({
      company,
      clients,
      document: initialDocument,
      nextQuoteNumber,
      nextInvoiceNumber,
    });

    const openaiMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map(
        (msg) =>
          ({
            role: msg.role,
            content: msg.content,
          }) as ChatCompletionMessageParam,
      ),
    ];

    let currentDocument = initialDocument;
    let finalAccentColor: string | null | undefined = undefined;
    let newClient: Client | undefined = undefined;
    let validityUpdate: { validity: string; validUntil: string } | undefined;
    let dueDateUpdate: { dueDate: string; dueDateDb: string } | undefined;
    let downloadPdf = false;
    let convertToInvoice = false;
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

      if (
        !assistantMessage.tool_calls ||
        assistantMessage.tool_calls.length === 0
      ) {
        return NextResponse.json({
          message:
            assistantMessage.content ||
            "Je suis prêt à vous aider avec votre document.",
          document: currentDocument,
          accentColor: finalAccentColor,
          newClient,
          validityUpdate,
          dueDateUpdate,
          downloadPdf,
          convertToInvoice,
        });
      }

      openaiMessages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;

        const toolName = toolCall.function.name;
        let toolArgs: Record<string, unknown> = {};

        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          toolArgs = {};
        }

        const toolContext = {
          document: currentDocument,
          company: company
            ? { name: company.name || "", vat_rate: company.vat_rate }
            : null,
          clients,
          nextQuoteNumber,
          nextInvoiceNumber,
        };

        const result = await executeToolCall(toolName, toolArgs, toolContext);

        if (result.document !== undefined) {
          currentDocument = result.document;
        }
        if (result.accentColor !== undefined) {
          finalAccentColor = result.accentColor;
        }
        if (result.newClient) {
          newClient = result.newClient;
        }
        if (result.validityUpdate) {
          validityUpdate = result.validityUpdate;
        }
        if (result.dueDateUpdate) {
          dueDateUpdate = result.dueDateUpdate;
        }
        if (result.downloadPdf) {
          downloadPdf = true;
        }
        if (result.convertToInvoice) {
          convertToInvoice = true;
        }

        openaiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            success: result.success,
            message: result.message,
          }),
        });
      }
    }

    return NextResponse.json({
      message:
        "J'ai effectué les modifications demandées. Y a-t-il autre chose que je puisse faire pour vous ?",
      document: currentDocument,
      accentColor: finalAccentColor,
      newClient,
      validityUpdate,
      dueDateUpdate,
      downloadPdf,
      convertToInvoice,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue avec l'assistant IA." },
      { status: 500 },
    );
  }
}
