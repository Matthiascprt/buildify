import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type {
  DocumentData,
  Section,
  Subsection,
  LineItem,
} from "@/lib/types/document";
import {
  calculateTotals,
  calculateLineTotal,
  calculateSubsectionTotal,
  calculateSectionTotal,
} from "@/lib/types/document";
import type { Client } from "@/lib/supabase/types";
import {
  findOrCreateClient,
  updateClient as updateClientDb,
} from "@/lib/supabase/api";

export const documentTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "update_document_content",
      description:
        "Outil principal pour modifier le contenu du document. Permet d'ajouter, modifier ou supprimer des sections, sous-sections et lignes. Structure obligatoire: Section → Sous-section → Ligne. Prioriser la réutilisation des éléments vides ou génériques avant d'en créer de nouveaux. Chaque ligne doit avoir designation, description (6-12 mots) et line_type (service/material).",
      parameters: {
        type: "object",
        properties: {
          sections_to_add: {
            type: "array",
            description:
              "Nouvelles sections à ajouter. Chaque section doit contenir au moins une sous-section avec une ligne.",
            items: {
              type: "object",
              properties: {
                section_id: {
                  type: "string",
                  description:
                    "UUID unique pour la section. Générer un nouveau UUID.",
                },
                section_number: {
                  type: "string",
                  description: 'Numéro de section (ex: "1", "2")',
                },
                section_label: {
                  type: "string",
                  description:
                    'Nom de la section (ex: "Électricité", "Plomberie")',
                },
                subsections: {
                  type: "array",
                  description:
                    "Sous-sections de cette section. Au moins une obligatoire.",
                  items: {
                    type: "object",
                    properties: {
                      subsection_id: { type: "string" },
                      subsection_number: {
                        type: "string",
                        description: 'e.g., "1.1", "1.2"',
                      },
                      subsection_label: { type: "string" },
                      lines: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            line_id: { type: "string" },
                            line_number: {
                              type: "string",
                              description: 'e.g., "1.1.1"',
                            },
                            designation: { type: "string" },
                            description: { type: "string" },
                            line_type: {
                              type: "string",
                              enum: ["service", "material"],
                              description:
                                '"service" = main-d\'œuvre/pose/installation, "material" = fourniture/matériel/équipement',
                            },
                            quantity: {
                              type: "string",
                              description: "Quantité (nombre). Ex: '5', '10.5'",
                            },
                            unit: {
                              type: "string",
                              description:
                                "Unité UNIQUEMENT pour valeurs mesurables: m², m³, m, kg, g, L, mL, pack, h, t, m²/h. JAMAIS pour nombre simple d'articles.",
                            },
                            unit_price_ht: {
                              type: "string",
                              description:
                                "Prix unitaire HT en euros (nombre). Ex: '50', '15550', '99.99'",
                            },
                            vat_rate: {
                              type: "string",
                              description:
                                "Taux TVA en % (nombre). Ex: '10', '20', '5.5'",
                            },
                          },
                          required: ["line_id", "line_number", "designation"],
                        },
                      },
                    },
                    required: [
                      "subsection_id",
                      "subsection_number",
                      "subsection_label",
                    ],
                  },
                },
              },
              required: ["section_id", "section_number", "section_label"],
            },
          },
          sections_to_update: {
            type: "array",
            description:
              "Sections existantes à mettre à jour via leur section_id.",
            items: {
              type: "object",
              properties: {
                section_id: {
                  type: "string",
                  description: "ID of the section",
                },
                section_label: { type: "string" },
              },
              required: ["section_id"],
            },
          },
          subsections_to_add: {
            type: "array",
            description:
              "Nouvelles sous-sections à ajouter à des sections existantes.",
            items: {
              type: "object",
              properties: {
                target_section_id: {
                  type: "string",
                  description: "ID de la section parente",
                },
                subsection_id: { type: "string" },
                subsection_number: { type: "string" },
                subsection_label: { type: "string" },
                lines: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      line_id: { type: "string" },
                      line_number: { type: "string" },
                      designation: { type: "string" },
                      description: { type: "string" },
                      line_type: {
                        type: "string",
                        enum: ["service", "material"],
                        description:
                          '"service" = main-d\'œuvre/pose/installation, "material" = fourniture/matériel/équipement',
                      },
                      quantity: {
                        type: "string",
                        description: "Quantité (nombre). Ex: '5', '10.5'",
                      },
                      unit: {
                        type: "string",
                        description:
                          "Unité UNIQUEMENT pour valeurs mesurables: m², m³, m, kg, g, L, mL, pack, h, t, m²/h. JAMAIS pour nombre simple d'articles.",
                      },
                      unit_price_ht: {
                        type: "string",
                        description:
                          "Prix unitaire HT en euros (nombre). Ex: '50', '15550', '99.99'",
                      },
                      vat_rate: {
                        type: "string",
                        description:
                          "Taux TVA en % (nombre). Ex: '10', '20', '5.5'",
                      },
                    },
                    required: ["line_id", "line_number", "designation"],
                  },
                },
              },
              required: [
                "target_section_id",
                "subsection_id",
                "subsection_number",
                "subsection_label",
              ],
            },
          },
          subsections_to_update: {
            type: "array",
            description:
              "Sous-sections existantes à mettre à jour via leur subsection_id.",
            items: {
              type: "object",
              properties: {
                subsection_id: { type: "string" },
                subsection_label: { type: "string" },
              },
              required: ["subsection_id"],
            },
          },
          lines_to_add: {
            type: "array",
            description:
              "Nouvelles lignes à ajouter. Chaque ligne doit avoir designation, description (6-12 mots) et line_type.",
            items: {
              type: "object",
              properties: {
                target_subsection_id: {
                  type: "string",
                  description: "ID de la sous-section parente",
                },
                line_id: { type: "string" },
                line_number: { type: "string" },
                designation: { type: "string" },
                description: { type: "string" },
                line_type: {
                  type: "string",
                  enum: ["service", "material"],
                  description:
                    '"service" = main-d\'œuvre/pose/installation, "material" = fourniture/matériel/équipement',
                },
                quantity: {
                  type: "string",
                  description: "Quantité (nombre). Ex: '5', '10.5'",
                },
                unit: {
                  type: "string",
                  description:
                    "Unité UNIQUEMENT pour valeurs mesurables: m², m³, m, kg, g, L, mL, pack, h, t, m²/h. JAMAIS pour nombre simple d'articles.",
                },
                unit_price_ht: {
                  type: "string",
                  description:
                    "Prix unitaire HT en euros (nombre). Ex: '50', '15550', '99.99'",
                },
                vat_rate: {
                  type: "string",
                  description: "Taux TVA en % (nombre). Ex: '10', '20', '5.5'",
                },
              },
              required: [
                "target_subsection_id",
                "line_id",
                "line_number",
                "designation",
              ],
            },
          },
          lines_to_update: {
            type: "array",
            description:
              "Lignes existantes à mettre à jour via leur line_id. Permet de modifier designation, description, quantity, unit, unit_price_ht, vat_rate.",
            items: {
              type: "object",
              properties: {
                line_id: { type: "string" },
                designation: { type: "string" },
                description: { type: "string" },
                line_type: {
                  type: "string",
                  enum: ["service", "material"],
                  description:
                    '"service" = main-d\'œuvre/pose/installation, "material" = fourniture/matériel/équipement',
                },
                quantity: {
                  type: "string",
                  description: "Quantité (nombre). Ex: '5', '10.5'",
                },
                unit: {
                  type: "string",
                  description:
                    "Unité UNIQUEMENT pour valeurs mesurables: m², m³, m, kg, g, L, mL, pack, h, t, m²/h. JAMAIS pour nombre simple d'articles.",
                },
                unit_price_ht: {
                  type: "string",
                  description:
                    "Prix unitaire HT en euros (nombre). Ex: '50', '15550', '99.99'",
                },
                vat_rate: {
                  type: "string",
                  description: "Taux TVA en % (nombre). Ex: '10', '20', '5.5'",
                },
              },
              required: ["line_id"],
            },
          },
          sections_to_remove: {
            type: "array",
            description: "IDs des sections à supprimer",
            items: { type: "string" },
          },
          subsections_to_remove: {
            type: "array",
            description: "IDs des sous-sections à supprimer",
            items: { type: "string" },
          },
          lines_to_remove: {
            type: "array",
            description: "IDs des lignes à supprimer",
            items: { type: "string" },
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_project_title",
      description:
        "Définir ou mettre à jour le titre du projet. OBLIGATOIRE après ajout de contenu si le titre est vide. Générer un titre professionnel et concis (2-4 mots) basé sur le contenu: 'Rénovation cuisine', 'Installation électrique', 'Travaux peinture'.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Titre du projet (2-4 mots, ex: 'Rénovation cuisine')",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_deposit",
      description:
        "Définir le montant de l'acompte en euros. Utilisé pour les paiements partiels à la commande. Le montant sera déduit du total TTC final.",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Montant de l'acompte en euros",
          },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_accent_color",
      description:
        "Changer la couleur d'accent du document pour personnalisation. Format hexadécimal (#f97316, #3b82f6). Utiliser null pour réinitialiser à la couleur par défaut.",
      parameters: {
        type: "object",
        properties: {
          color: {
            type: "string",
            description:
              "Code couleur hexadécimal (ex: #f97316, #3b82f6). Utiliser null pour réinitialiser.",
          },
        },
        required: ["color"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_validity_date",
      description:
        "Définir la date de validité d'un devis. UNIQUEMENT pour les devis (pas les factures). Accepte formats: '1 mois', '15 jours', '30/06/2025'. Le devis expire après cette date.",
      parameters: {
        type: "object",
        properties: {
          validity: {
            type: "string",
            description:
              "Période de validité (ex: '1 mois', '15 jours', '30/06/2025')",
          },
          valid_until: {
            type: "string",
            description: "Date ISO pour la base de données (YYYY-MM-DD)",
          },
        },
        required: ["validity", "valid_until"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_due_date",
      description:
        "Définir la date d'échéance de paiement d'une facture. UNIQUEMENT pour les factures (pas les devis). Indique la date limite de règlement.",
      parameters: {
        type: "object",
        properties: {
          due_date: {
            type: "string",
            description: "Date d'échéance format affichage (ex: '15/02/2025')",
          },
          due_date_db: {
            type: "string",
            description: "Date ISO pour la base de données (YYYY-MM-DD)",
          },
        },
        required: ["due_date", "due_date_db"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_and_associate_client",
      description:
        "Créer un nouveau client et l'associer au document en cours. Utiliser quand le client n'existe pas dans la liste. Éviter les doublons en vérifiant d'abord la liste des clients existants. Recherche floue disponible.",
      parameters: {
        type: "object",
        properties: {
          first_name: { type: "string", description: "Prénom du client" },
          last_name: { type: "string", description: "Nom du client" },
          email: { type: "string", description: "Email du client" },
          phone: { type: "string", description: "Téléphone du client" },
          type: {
            type: "string",
            enum: ["particulier", "professionnel"],
            description: "Type de client",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "associate_existing_client",
      description:
        "Associer un client existant au document en cours. Utiliser l'ID du client depuis la liste des clients disponibles. Prioriser cette fonction si le client existe déjà pour éviter les doublons.",
      parameters: {
        type: "object",
        properties: {
          client_id: {
            type: "string",
            description: "UUID du client existant à associer",
          },
        },
        required: ["client_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_client_info",
      description:
        "Mettre à jour les informations du client actuellement associé au document. Permet de modifier nom, prénom, email, téléphone ou type. Nécessite qu'un client soit déjà associé.",
      parameters: {
        type: "object",
        properties: {
          first_name: { type: "string" },
          last_name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          type: { type: "string", enum: ["particulier", "professionnel"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "download_pdf",
      description:
        "Télécharger le document actuel au format PDF. Utiliser quand l'utilisateur demande: télécharger, exporter, PDF, imprimer, envoyer le document. Génère un fichier PDF professionnel prêt à l'envoi.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "convert_quote_to_invoice",
      description:
        "Convertir le devis actuel en facture. UNIQUEMENT si le document est un devis. Utiliser quand l'utilisateur demande: transformer en facture, facturer, convertir, passer en facture. Conserve tout le contenu et génère un nouveau numéro de facture.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

interface ToolContext {
  document: DocumentData | null;
  company: { name: string; vat_rate: number | null } | null;
  clients: Client[];
  nextQuoteNumber: string;
  nextInvoiceNumber: string;
}

interface ToolResult {
  success: boolean;
  message: string;
  document?: DocumentData | null;
  accentColor?: string | null;
  newClient?: Client;
  updatedClient?: { id: string; updates: Record<string, string | undefined> };
  validityUpdate?: { validity: string; validUntil: string };
  dueDateUpdate?: { dueDate: string; dueDateDb: string };
  downloadPdf?: boolean;
  convertToInvoice?: boolean;
}

function recalculateDocumentTotals(document: DocumentData): DocumentData {
  const updatedSections = document.sections.map((section) => {
    const updatedSubsections = section.subsections.map((subsection) => {
      const updatedLines = subsection.lines.map((line) => ({
        ...line,
        totalHT: calculateLineTotal(line.quantity, line.unitPriceHT),
      }));
      return {
        ...subsection,
        lines: updatedLines,
        totalHT: calculateSubsectionTotal(updatedLines),
      };
    });
    return {
      ...section,
      subsections: updatedSubsections,
      totalHT: calculateSectionTotal(updatedSubsections),
    };
  });

  const totals = calculateTotals(
    updatedSections,
    document.tvaRate,
    document.deposit,
  );

  return {
    ...document,
    sections: updatedSections,
    totalHT: totals.totalHT,
    tvaAmount: totals.tvaAmount,
    totalTTC: totals.totalTTC,
  };
}

interface RawLine {
  line_id: string;
  line_number: string;
  designation: string;
  description?: string;
  line_type?: "service" | "material";
  quantity?: string | number;
  unit?: string;
  unit_price_ht?: string | number;
  vat_rate?: string | number;
}

function parseNumber(
  value: string | number | undefined,
  fallback: number,
): number {
  if (value === undefined || value === null || value === "") return fallback;
  const num =
    typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;
  return isNaN(num) ? fallback : num;
}

interface RawSubsection {
  subsection_id: string;
  subsection_number: string;
  subsection_label: string;
  lines?: RawLine[];
}

interface RawSection {
  section_id: string;
  section_number: string;
  section_label: string;
  subsections?: RawSubsection[];
}

function convertRawLineToLineItem(
  raw: RawLine,
  defaultVatRate: number,
): LineItem {
  const quantity = parseNumber(raw.quantity, 0);
  const unitPriceHT = parseNumber(raw.unit_price_ht, 0);
  const vatRate = parseNumber(raw.vat_rate, defaultVatRate);
  return {
    lineId: raw.line_id,
    lineNumber: raw.line_number,
    designation: raw.designation,
    description: raw.description,
    lineType: raw.line_type,
    quantity,
    unit: raw.unit,
    unitPriceHT,
    vatRate,
    totalHT: calculateLineTotal(quantity, unitPriceHT),
  };
}

function convertRawSubsection(
  raw: RawSubsection,
  defaultVatRate: number,
): Subsection {
  const lines = (raw.lines || []).map((l) =>
    convertRawLineToLineItem(l, defaultVatRate),
  );
  return {
    subsectionId: raw.subsection_id,
    subsectionNumber: raw.subsection_number,
    subsectionLabel: raw.subsection_label,
    lines,
    totalHT: calculateSubsectionTotal(lines),
  };
}

function convertRawSection(raw: RawSection, defaultVatRate: number): Section {
  const subsections = (raw.subsections || []).map((s) =>
    convertRawSubsection(s, defaultVatRate),
  );
  return {
    sectionId: raw.section_id,
    sectionNumber: raw.section_number,
    sectionLabel: raw.section_label,
    subsections,
    totalHT: calculateSectionTotal(subsections),
  };
}

export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolResult> {
  const { document, clients } = context;

  if (!document) {
    return {
      success: false,
      message:
        "Aucun document en cours. Créez d'abord un devis ou une facture.",
    };
  }

  switch (toolName) {
    case "update_document_content": {
      const sectionsToAdd = (args.sections_to_add as RawSection[]) || [];
      const sectionsToUpdate =
        (args.sections_to_update as Array<{
          section_id: string;
          section_label?: string;
        }>) || [];
      const subsectionsToAdd =
        (args.subsections_to_add as Array<
          RawSubsection & { target_section_id: string }
        >) || [];
      const subsectionsToUpdate =
        (args.subsections_to_update as Array<{
          subsection_id: string;
          subsection_label?: string;
        }>) || [];
      const linesToAdd =
        (args.lines_to_add as Array<
          RawLine & { target_subsection_id: string }
        >) || [];
      const linesToUpdate =
        (args.lines_to_update as Array<{
          line_id: string;
          designation?: string;
          description?: string;
          line_type?: "service" | "material";
          quantity?: string | number;
          unit?: string;
          unit_price_ht?: string | number;
          vat_rate?: string | number;
        }>) || [];
      const sectionsToRemove = (args.sections_to_remove as string[]) || [];
      const subsectionsToRemove =
        (args.subsections_to_remove as string[]) || [];
      const linesToRemove = (args.lines_to_remove as string[]) || [];

      let updatedSections = [...document.sections];

      // Remove sections
      updatedSections = updatedSections.filter(
        (s) => !sectionsToRemove.includes(s.sectionId),
      );

      // Remove subsections
      updatedSections = updatedSections.map((section) => ({
        ...section,
        subsections: section.subsections.filter(
          (sub) => !subsectionsToRemove.includes(sub.subsectionId),
        ),
      }));

      // Remove lines
      updatedSections = updatedSections.map((section) => ({
        ...section,
        subsections: section.subsections.map((sub) => ({
          ...sub,
          lines: sub.lines.filter((l) => !linesToRemove.includes(l.lineId)),
        })),
      }));

      // Update sections
      for (const update of sectionsToUpdate) {
        const sectionIdx = updatedSections.findIndex(
          (s) => s.sectionId === update.section_id,
        );
        if (sectionIdx >= 0 && update.section_label !== undefined) {
          updatedSections[sectionIdx] = {
            ...updatedSections[sectionIdx],
            sectionLabel: update.section_label,
          };
        }
      }

      // Update subsections
      for (const update of subsectionsToUpdate) {
        for (let i = 0; i < updatedSections.length; i++) {
          const subIdx = updatedSections[i].subsections.findIndex(
            (sub) => sub.subsectionId === update.subsection_id,
          );
          if (subIdx >= 0 && update.subsection_label !== undefined) {
            updatedSections[i].subsections[subIdx] = {
              ...updatedSections[i].subsections[subIdx],
              subsectionLabel: update.subsection_label,
            };
          }
        }
      }

      // Update lines
      for (const update of linesToUpdate) {
        for (let i = 0; i < updatedSections.length; i++) {
          for (let j = 0; j < updatedSections[i].subsections.length; j++) {
            const lineIdx = updatedSections[i].subsections[j].lines.findIndex(
              (l) => l.lineId === update.line_id,
            );
            if (lineIdx >= 0) {
              const existingLine =
                updatedSections[i].subsections[j].lines[lineIdx];
              const quantity =
                update.quantity !== undefined
                  ? parseNumber(update.quantity, existingLine.quantity)
                  : existingLine.quantity;
              const unitPriceHT =
                update.unit_price_ht !== undefined
                  ? parseNumber(update.unit_price_ht, existingLine.unitPriceHT)
                  : existingLine.unitPriceHT;

              updatedSections[i].subsections[j].lines[lineIdx] = {
                ...existingLine,
                designation:
                  update.designation !== undefined
                    ? update.designation
                    : existingLine.designation,
                description:
                  update.description !== undefined
                    ? update.description
                    : existingLine.description,
                lineType:
                  update.line_type !== undefined
                    ? update.line_type
                    : existingLine.lineType,
                quantity,
                unit:
                  update.unit !== undefined ? update.unit : existingLine.unit,
                unitPriceHT,
                vatRate:
                  update.vat_rate !== undefined
                    ? parseNumber(update.vat_rate, existingLine.vatRate)
                    : existingLine.vatRate,
                totalHT: calculateLineTotal(quantity, unitPriceHT),
              };
            }
          }
        }
      }

      // Add new sections
      for (const rawSection of sectionsToAdd) {
        updatedSections.push(convertRawSection(rawSection, document.tvaRate));
      }

      // Add subsections to existing sections
      for (const rawSub of subsectionsToAdd) {
        const sectionIdx = updatedSections.findIndex(
          (s) => s.sectionId === rawSub.target_section_id,
        );
        if (sectionIdx >= 0) {
          updatedSections[sectionIdx].subsections.push(
            convertRawSubsection(rawSub, document.tvaRate),
          );
        }
      }

      // Add lines to existing subsections
      for (const rawLine of linesToAdd) {
        for (let i = 0; i < updatedSections.length; i++) {
          const subIdx = updatedSections[i].subsections.findIndex(
            (sub) => sub.subsectionId === rawLine.target_subsection_id,
          );
          if (subIdx >= 0) {
            updatedSections[i].subsections[subIdx].lines.push(
              convertRawLineToLineItem(rawLine, document.tvaRate),
            );
          }
        }
      }

      const updatedDocument = recalculateDocumentTotals({
        ...document,
        sections: updatedSections,
      });

      return {
        success: true,
        message: "Contenu mis à jour.",
        document: updatedDocument,
      };
    }

    case "set_project_title": {
      const title = args.title as string;
      return {
        success: true,
        message: `Titre du projet défini: "${title}"`,
        document: { ...document, projectTitle: title },
      };
    }

    case "set_deposit": {
      const amount = args.amount as number;
      const updatedDocument = recalculateDocumentTotals({
        ...document,
        deposit: amount,
      });
      return {
        success: true,
        message: `Acompte défini: ${amount}€`,
        document: updatedDocument,
      };
    }

    case "set_accent_color": {
      const color = args.color as string | null;
      return {
        success: true,
        message: color ? `Couleur changée: ${color}` : "Couleur réinitialisée.",
        accentColor: color,
      };
    }

    case "set_validity_date": {
      if (document.type !== "quote") {
        return {
          success: false,
          message: "La date de validité ne s'applique qu'aux devis.",
        };
      }
      const validity = args.validity as string;
      const validUntil = args.valid_until as string;
      return {
        success: true,
        message: `Validité définie: ${validity}`,
        document: { ...document, validity },
        validityUpdate: { validity, validUntil },
      };
    }

    case "set_due_date": {
      if (document.type !== "invoice") {
        return {
          success: false,
          message: "La date d'échéance ne s'applique qu'aux factures.",
        };
      }
      const dueDate = args.due_date as string;
      const dueDateDb = args.due_date_db as string;
      return {
        success: true,
        message: `Échéance définie: ${dueDate}`,
        document: { ...document, dueDate },
        dueDateUpdate: { dueDate, dueDateDb },
      };
    }

    case "create_and_associate_client": {
      const firstName = (args.first_name as string) || "";
      const lastName = (args.last_name as string) || "";
      const email = (args.email as string) || undefined;
      const phone = (args.phone as string) || undefined;
      const clientType = (args.type as "particulier" | "professionnel") || null;

      const result = await findOrCreateClient({
        first_name: firstName || null,
        last_name: lastName || null,
        email: email || null,
        phone: phone || null,
        type: clientType,
      });

      if (!result.success || !result.client) {
        return {
          success: false,
          message: result.error || "Erreur lors de la création du client.",
        };
      }

      const clientName =
        `${result.client.first_name || ""} ${result.client.last_name || ""}`.trim();
      const updatedDocument: DocumentData = {
        ...document,
        client: {
          id: result.client.id,
          name: clientName,
          address: "",
          city: "",
          phone: result.client.phone || "",
          email: result.client.email || "",
        },
      };

      return {
        success: true,
        message: result.isNew
          ? `Client "${clientName}" créé et associé.`
          : `Client "${clientName}" trouvé et associé.`,
        document: updatedDocument,
        newClient: result.isNew ? result.client : undefined,
      };
    }

    case "associate_existing_client": {
      const clientId = args.client_id as string;
      const client = clients.find((c) => c.id === clientId);

      if (!client) {
        return {
          success: false,
          message: "Client non trouvé.",
        };
      }

      const clientName =
        `${client.first_name || ""} ${client.last_name || ""}`.trim();
      const updatedDocument: DocumentData = {
        ...document,
        client: {
          id: client.id,
          name: clientName,
          address: "",
          city: "",
          phone: client.phone || "",
          email: client.email || "",
        },
      };

      return {
        success: true,
        message: `Client "${clientName}" associé.`,
        document: updatedDocument,
      };
    }

    case "update_client_info": {
      if (!document.client?.id) {
        return {
          success: false,
          message: "Aucun client associé au document.",
        };
      }

      const updates: Record<string, string | undefined> = {};
      if (args.first_name !== undefined)
        updates.first_name = args.first_name as string;
      if (args.last_name !== undefined)
        updates.last_name = args.last_name as string;
      if (args.email !== undefined) updates.email = args.email as string;
      if (args.phone !== undefined) updates.phone = args.phone as string;
      if (args.type !== undefined) updates.type = args.type as string;

      const result = await updateClientDb(document.client.id, updates);

      if (!result.success) {
        return {
          success: false,
          message: result.error || "Erreur lors de la mise à jour du client.",
        };
      }

      const updatedClient = result.client!;
      const clientName =
        `${updatedClient.first_name || ""} ${updatedClient.last_name || ""}`.trim();

      const updatedDocument: DocumentData = {
        ...document,
        client: {
          ...document.client,
          name: clientName,
          phone: updatedClient.phone || "",
          email: updatedClient.email || "",
        },
      };

      return {
        success: true,
        message: `Client mis à jour.`,
        document: updatedDocument,
        updatedClient: { id: document.client.id, updates },
      };
    }

    case "download_pdf": {
      if (!document) {
        return {
          success: false,
          message: "Aucun document à télécharger.",
        };
      }
      return {
        success: true,
        message: "Téléchargement du PDF en cours...",
        downloadPdf: true,
      };
    }

    case "convert_quote_to_invoice": {
      if (!document) {
        return {
          success: false,
          message: "Aucun document à convertir.",
        };
      }
      if (document.type !== "quote") {
        return {
          success: false,
          message: "Seuls les devis peuvent être convertis en facture.",
        };
      }
      return {
        success: true,
        message: "Conversion du devis en facture...",
        convertToInvoice: true,
      };
    }

    default:
      return {
        success: false,
        message: `Outil inconnu: ${toolName}`,
      };
  }
}
