import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { DocumentContent, DocumentLine } from "@/lib/supabase/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OnboardingChatRequest {
  message: string;
  companyName: string;
  activity: string;
}

const onboardingTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_document",
      description:
        "Create a quote (devis) or invoice (facture) with the specified lines. Use this to generate the document from the user's description.",
      parameters: {
        type: "object",
        properties: {
          document_type: {
            type: "string",
            enum: ["quote", "invoice"],
            description:
              "Type of document: 'quote' for devis, 'invoice' for facture. Default to 'quote' unless user explicitly mentions 'facture'.",
          },
          project_title: {
            type: "string",
            description:
              "A short professional title for the project (2-5 words)",
          },
          client_name: {
            type: "string",
            description: "The client's name if mentioned",
          },
          lines: {
            type: "array",
            description: "The document lines",
            items: {
              type: "object",
              properties: {
                designation: {
                  type: "string",
                  description: "The line item name",
                },
                description: {
                  type: "string",
                  description: "A brief description (3-8 words)",
                },
                quantity: { type: "number", description: "Quantity" },
                unit_price_ht: {
                  type: "number",
                  description: "Unit price HT in euros",
                },
                vat_rate: {
                  type: "number",
                  description: "VAT rate percentage (default 10)",
                },
              },
              required: ["designation", "quantity", "unit_price_ht"],
            },
          },
        },
        required: ["document_type", "project_title", "lines"],
      },
    },
  },
];

function buildOnboardingSystemPrompt(
  companyName: string,
  activity: string,
): string {
  return `Tu es Max, un assistant IA professionnel spécialisé dans la création de devis et factures.

# CONTEXTE ENTREPRISE
Nom: ${companyName}
Activité: ${activity}
TVA par défaut: 10%

# TON ROLE
1. Comprendre la demande en langage naturel (français)
2. Déterminer si l'utilisateur veut un DEVIS (quote) ou une FACTURE (invoice)
3. Extraire les informations: client, lignes (désignation, quantité, prix), etc.
4. Utiliser l'outil create_document pour générer le document immédiatement

# DETECTION DU TYPE DE DOCUMENT
- Par défaut, crée un DEVIS (document_type: "quote")
- Si l'utilisateur mentionne "facture", "facturer", "à facturer" → FACTURE (document_type: "invoice")
- "devis", "estimation", "chiffrer" → DEVIS (quote)

# REGLES DE COMPORTEMENT "MODIFICATION-FIRST"
- Si une action est possible → EXECUTE IMMEDIATEMENT
- Ne pose JAMAIS de question sauf ambiguïté bloquante
- Agis de façon déterministe et prévisible

# LOGIQUE FISCALE (CRITIQUE)
- Par défaut, tout est en HT (Hors Taxes)
- Si l'utilisateur dit "TTC" → convertis en HT: prix_ht = prix_ttc / (1 + tva/100)
- Le champ unit_price_ht stocke TOUJOURS le prix HT
- TVA 10% par défaut (taux standard pour les travaux du bâtiment)
- Si l'utilisateur spécifie un taux de TVA (ex: "20%", "TVA à 5.5%", "taux de 20") → applique ce taux via vat_rate
- Taux courants: 20% (standard), 10% (travaux), 5.5% (rénovation énergétique), 2.1% (presse)

# PRECISION DES MONTANTS (CRITIQUE)
- TOUJOURS utiliser le montant EXACT donné par l'utilisateur, à l'euro et centime près
- "50€" → unit_price_ht = 50.00
- "49.99€" → unit_price_ht = 49.99
- "125.50€" → unit_price_ht = 125.50
- Ne JAMAIS arrondir ou modifier les montants
- Si conversion TTC→HT, arrondir à 2 décimales: Math.round(x * 100) / 100

# GENERATION AUTOMATIQUE DES DESCRIPTIONS (OBLIGATOIRE)
- TOUJOURS remplir le champ "description" pour chaque ligne ajoutée
- La description doit être courte (3-8 mots) et professionnelle
- Exemples:
  → designation="Peinture murs" → description="Deux couches, finition satinée"
  → designation="Luminaires LED" → description="Fourniture et pose"
  → designation="Carrelage sol" → description="60x60 cm, pose droite"

# EXEMPLES DE CONVERSION
- "5 luminaires à 50€" → designation="Luminaires LED", description="Fourniture et pose", quantity=5, unit_price_ht=50
- "rénovation salle de bain" → project_title="Rénovation salle de bain"
- "pour M. Dupont" → client_name="M. Dupont"
- "facture pour M. Martin" → document_type="invoice", client_name="M. Martin"
- "3 prises à 25€" → designation="Prises électriques", description="Fourniture et pose", quantity=3, unit_price_ht=25
- "2 articles à 100€ avec TVA 20%" → designation="Articles divers", description="Fourniture", quantity=2, unit_price_ht=100, vat_rate=20
- "isolation à TVA 5.5%" → vat_rate=5.5 (taux réduit rénovation énergétique)

Génère le document immédiatement avec l'outil create_document.`;
}

export async function POST(req: NextRequest) {
  try {
    const body: OnboardingChatRequest = await req.json();
    const { message, companyName, activity } = body;

    if (!message || !companyName) {
      return NextResponse.json(
        { error: "Message et nom d'entreprise requis" },
        { status: 400 },
      );
    }

    const systemPrompt = buildOnboardingSystemPrompt(companyName, activity);

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools: onboardingTools,
      tool_choice: { type: "function", function: { name: "create_document" } },
    });

    const assistantMessage = completion.choices[0].message;

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];

      if (toolCall.type !== "function") {
        return NextResponse.json({
          document: null,
          aiResponse: "Une erreur est survenue lors de la génération.",
        });
      }

      if (toolCall.function.name === "create_document") {
        let args: {
          document_type?: "quote" | "invoice";
          project_title?: string;
          client_name?: string;
          lines?: Array<{
            designation: string;
            description?: string;
            quantity: number;
            unit_price_ht: number;
            vat_rate?: number;
          }>;
        } = {};

        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {
          args = {};
        }

        const documentType = args.document_type || "quote";
        const isInvoice = documentType === "invoice";
        const docLabel = isInvoice ? "facture" : "devis";

        const lines: DocumentLine[] = (args.lines || []).map((line, index) => {
          const vatRate = line.vat_rate || 10;
          const lineHT =
            Math.round(line.quantity * line.unit_price_ht * 100) / 100;
          const lineTTC = Math.round(lineHT * (1 + vatRate / 100) * 100) / 100;

          return {
            line_id: crypto.randomUUID(),
            line_number: index + 1,
            designation: line.designation,
            description: line.description || "",
            quantity: line.quantity,
            unit_price_ht: line.unit_price_ht,
            vat_rate: vatRate,
            total_ttc: lineTTC,
          };
        });

        // Calculate totals using same logic as editor (cents-based for precision)
        let totalHTCents = 0;
        let totalVATCents = 0;
        for (const line of lines) {
          const lineHTCents = Math.round(
            line.quantity * line.unit_price_ht * 100,
          );
          totalHTCents += lineHTCents;
          totalVATCents += Math.round((lineHTCents * line.vat_rate) / 100);
        }
        const totalTTCCents = totalHTCents + totalVATCents;

        const totalHT = totalHTCents / 100;
        const totalVAT = totalVATCents / 100;
        const totalTTC = totalTTCCents / 100;

        const uniqueVatRates = [...new Set(lines.map((l) => l.vat_rate))].sort(
          (a, b) => a - b,
        );
        let vatMessage = "";
        if (uniqueVatRates.length === 1) {
          const rate = uniqueVatRates[0];
          vatMessage =
            rate === 10
              ? "\nLe taux de TVA par défaut est de 10%."
              : `\nLe taux de TVA appliqué est de ${rate}%.`;
        } else if (uniqueVatRates.length > 1) {
          vatMessage = `\nTaux de TVA appliqués : ${uniqueVatRates.join("%, ")}%.`;
        }

        const document: DocumentContent = {
          project_title: args.project_title || "Nouveau projet",
          lines,
          totals: {
            total_ht: totalHT,
            total_vat: totalVAT,
            deposit: 0,
            total_ttc: totalTTC,
          },
        };

        const lineCount = lines.length;
        const clientPart = args.client_name ? ` pour ${args.client_name}` : "";
        const aiResponse =
          lineCount > 0
            ? `J'ai créé votre ${docLabel} "${args.project_title}"${clientPart} avec ${lineCount} ligne${lineCount > 1 ? "s" : ""} pour un total de ${totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € TTC.${vatMessage}`
            : `J'ai préparé votre ${docLabel}.`;

        return NextResponse.json({
          document,
          documentType,
          aiResponse,
          clientName: args.client_name,
        });
      }
    }

    return NextResponse.json({
      document: null,
      documentType: "quote",
      aiResponse:
        assistantMessage.content ||
        "Je n'ai pas pu générer le document. Veuillez réessayer.",
    });
  } catch (error) {
    console.error("Onboarding chat error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}
