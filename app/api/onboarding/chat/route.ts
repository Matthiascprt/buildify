import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type {
  DocumentContent,
  DocumentSection,
  DocumentSubsection,
  DocumentLine,
} from "@/lib/supabase/types";

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
        "Créer un devis ou une facture avec les lignes spécifiées. Utiliser immédiatement pour générer le document à partir de la description de l'utilisateur.",
      parameters: {
        type: "object",
        properties: {
          document_type: {
            type: "string",
            enum: ["quote", "invoice"],
            description:
              "Type de document: 'quote' = devis (défaut), 'invoice' = facture (si mentionné explicitement)",
          },
          project_title: {
            type: "string",
            description:
              "Titre professionnel du projet (2-4 mots). Ex: 'Rénovation cuisine', 'Installation électrique'",
          },
          client_name: {
            type: "string",
            description: "Nom du client si mentionné",
          },
          lines: {
            type: "array",
            description:
              "Lignes du document. Chaque ligne doit avoir designation, description (6-12 mots), line_type, quantity, unit_price_ht.",
            items: {
              type: "object",
              properties: {
                designation: {
                  type: "string",
                  description: "Nom court de la prestation/matériel",
                },
                description: {
                  type: "string",
                  description:
                    "Description professionnelle (6-12 mots) précisant le contexte",
                },
                line_type: {
                  type: "string",
                  enum: ["service", "material"],
                  description:
                    "'service' = main-d'œuvre/pose/installation, 'material' = fourniture/matériel",
                },
                quantity: { type: "number", description: "Quantité" },
                unit: {
                  type: "string",
                  enum: [
                    "m²",
                    "m³",
                    "m",
                    "kg",
                    "g",
                    "L",
                    "mL",
                    "pack",
                    "h",
                    "t",
                    "m²/h",
                  ],
                  description:
                    "Unité de mesure (optionnel). UNIQUEMENT pour valeurs mesurables: m², m³, m, kg, L, h, etc. JAMAIS pour nombre simple d'articles.",
                },
                unit_price_ht: {
                  type: "number",
                  description:
                    "Prix unitaire HT en euros (montant EXACT donné par l'utilisateur)",
                },
                vat_rate: {
                  type: "number",
                  description: "Taux de TVA en % (défaut 10)",
                },
              },
              required: [
                "designation",
                "description",
                "line_type",
                "quantity",
                "unit_price_ht",
              ],
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
  return `Tu es Max, assistant IA pour la création de devis et factures pour une application SaaS française. Tu exécutes immédiatement la création du document via l'outil create_document.

# 1. CONTEXTE
Entreprise: ${companyName} (${activity})
TVA par défaut: 10% (modifiable par l'utilisateur)

# 2. COMPORTEMENT "CREATION IMMEDIATE"
- Action demandée → EXECUTE IMMEDIATEMENT via create_document → puis réponds brièvement
- Ne pose JAMAIS de question sauf ambiguïté bloquante
- Ne demande JAMAIS de confirmation avant d'agir
- Agis de façon déterministe et prévisible
- Par défaut → DEVIS (quote)
- "facture", "facturer", "à facturer" → FACTURE (invoice)

# 3. LIGNES ET DESCRIPTIONS
Chaque ligne DOIT avoir:
- designation: nom court de la prestation/matériel
- description: 6-12 mots précisant le contexte (OBLIGATOIRE)
- line_type: "service" ou "material" (OBLIGATOIRE)

UNITES DE MESURE (optionnel - UNIQUEMENT pour valeurs mesurables et pertinentes):
Unités autorisées: m², m³, m, kg, g, L, mL, pack, h, t, m²/h
- Surfaces → "m²" (carrelage 15 m², peinture 20 m², parquet 30 m²)
- Volumes → "m³" ou "L" ou "mL" (béton 2 m³, peinture 10 L)
- Longueurs → "m" (câbles 50 m, plinthes 12 m)
- Poids → "kg" ou "g" ou "t" (enduit 25 kg, sable 1 t)
- Temps → "h" (main-d'œuvre 8 h, intervention 2 h)
- Rendement → "m²/h" (pose carrelage 5 m²/h)
- Lots → "pack" (pack de 10)
JAMAIS d'unité pour: nombre simple d'articles (5 luminaires, 3 prises, 2 robinets → juste le chiffre).

CLASSIFICATION line_type:
- "service" → travail humain: pose, installation, main-d'œuvre, intervention, maintenance, dépose
- "material" → produit physique: carrelage, peinture, luminaires, câbles, équipements, fournitures

REGLES:
- Travail humain seul → service
- Produit/matériau seul → material
- Combinaison (ex: "Fourniture et pose") → séparer en 2 lignes OU service si travail prédominant

EXEMPLES descriptions:
- "Peinture murs" → "Deux couches, finition satinée blanc mat"
- "Luminaires LED" → "Spots encastrés, fourniture et installation complète"
- "Carrelage sol" → "Grès cérame 60x60, pose droite avec joints"
- "Main d'œuvre électrique" → "Installation tableau et circuit cuisine"

# 4. LOGIQUE FISCALE
- TOUT est en HT (Hors Taxes) par défaut
- total_ht = quantity × unit_price_ht (calculé auto)
- TVA et TTC calculés automatiquement par l'application
- Précision EXACTE des montants: 49.99€ → 49.99 (jamais arrondir)
- Si utilisateur donne TTC → convertir: 60€ TTC à 20% = 50€ HT
- TVA personnalisable via vat_rate (10% défaut, 20% standard, 5.5% rénovation énergétique)

# 5. GENERATION AUTOMATIQUE
project_title (OBLIGATOIRE):
- Générer titre pro 2-4 mots basé sur le contenu
- Exemples: "Rénovation cuisine", "Installation électrique", "Travaux peinture"

# 6. COMMANDES FREQUENTES
- "Ajoute 5 luminaires à 50€" → ligne material, quantity=5 (pas d'unité car articles)
- "pose des luminaires 200€" → ligne service, quantity=1, unit_price_ht=200
- "pour M. Dupont" → client_name="M. Dupont"
- "facture pour M. Martin" → document_type="invoice"
- "Ajoute 10m² carrelage et pose" → 2 lignes: material (quantity=10, unit="m²") + service (quantity=10, unit="m²")
- "3h de main d'œuvre à 45€" → ligne service, quantity=3, unit="h"
- "20m de câble" → ligne material, quantity=20, unit="m"
- "TVA 20%" → vat_rate=20
- "En fait TTC" → convertir en HT selon TVA applicable

# 7. ERREURS INTERDITES
- Inventer des données
- Oublier description ou line_type sur une ligne
- Oublier project_title
- Arrondir les montants
- Utiliser total_ttc (uniquement total_ht)

Sois efficace, autonome et professionnel. Génère le document immédiatement.`;
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
      model: "gpt-4o-mini",
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
            line_type?: "service" | "material";
            quantity: number;
            unit?: string;
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

        // Create lines for the hierarchical structure
        const lines: DocumentLine[] = (args.lines || []).map(
          (
            line: {
              designation: string;
              description?: string;
              line_type?: "service" | "material";
              quantity: number;
              unit?: string;
              unit_price_ht: number;
              vat_rate?: number;
            },
            index: number,
          ) => {
            const vatRate = line.vat_rate || 10;
            const lineHT =
              Math.round(line.quantity * line.unit_price_ht * 100) / 100;

            return {
              line_id: crypto.randomUUID(),
              line_number: `1.1.${index + 1}`,
              designation: line.designation,
              description: line.description || "",
              line_type: line.line_type || "service",
              quantity: line.quantity,
              unit: line.unit,
              unit_price_ht: line.unit_price_ht,
              vat_rate: vatRate,
              total_ht: lineHT,
            };
          },
        );

        // Calculate totals using same logic as editor (cents-based for precision)
        let totalHTCents = 0;
        let totalVATCents = 0;
        for (const line of lines) {
          const lineHTCents = Math.round(line.total_ht * 100);
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

        // Create hierarchical structure with a single section and subsection
        const subsection: DocumentSubsection = {
          subsection_id: crypto.randomUUID(),
          subsection_number: "1.1",
          subsection_label: "Prestations",
          total_ht: totalHT,
          lines,
        };

        const section: DocumentSection = {
          section_id: crypto.randomUUID(),
          section_number: "1",
          section_label: args.project_title || "Nouveau projet",
          total_ht: totalHT,
          subsections: [subsection],
        };

        const document: DocumentContent = {
          project_title: args.project_title || "Nouveau projet",
          sections: [section],
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
