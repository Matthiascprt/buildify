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

        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      openaiMessages.push(...toolResults);
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
