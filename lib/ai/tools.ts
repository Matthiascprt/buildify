import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type {
  DocumentData,
  QuoteData,
  InvoiceData,
  LineItem,
  DocumentClient,
} from "@/lib/types/document";
import {
  createEmptyQuote,
  createEmptyInvoice,
  calculateTotals,
  calculateLineTotal,
  convertQuoteToInvoice,
} from "@/lib/types/document";
import type { Company } from "@/lib/supabase/types";

export const documentTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_document",
      description:
        "Crée un nouveau document (devis ou facture). Utiliser cette fonction quand l'utilisateur veut créer un nouveau devis ou une nouvelle facture.",
      parameters: {
        type: "object",
        properties: {
          documentType: {
            type: "string",
            enum: ["quote", "invoice"],
            description:
              "Type de document: 'quote' pour devis, 'invoice' pour facture",
          },
          projectTitle: {
            type: "string",
            description: "Titre du projet ou objet du document",
          },
        },
        required: ["documentType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_client",
      description:
        "Définit ou met à jour les informations du client sur le document.",
      parameters: {
        type: "object",
        properties: {
          clientId: {
            type: "number",
            description:
              "ID du client existant dans la base de données (optionnel)",
          },
          name: {
            type: "string",
            description: "Nom complet du client",
          },
          address: {
            type: "string",
            description: "Adresse du client",
          },
          city: {
            type: "string",
            description: "Code postal et ville du client",
          },
          phone: {
            type: "string",
            description: "Numéro de téléphone du client",
          },
          email: {
            type: "string",
            description: "Adresse email du client",
          },
          siret: {
            type: "string",
            description: "Numéro SIRET du client (pour les professionnels)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_project_title",
      description: "Définit ou met à jour le titre/objet du projet.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Titre du projet",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_section",
      description:
        "Ajoute une section (en-tête de catégorie) au document pour regrouper des lignes.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description:
              "Titre de la section (ex: 'Démolition et préparation', 'Plomberie', 'Électricité')",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_line_item",
      description: "Ajoute une ligne de prestation ou de produit au document.",
      parameters: {
        type: "object",
        properties: {
          designation: {
            type: "string",
            description: "Nom de la prestation ou du produit",
          },
          description: {
            type: "string",
            description: "Description détaillée (optionnel)",
          },
          quantity: {
            type: "number",
            description: "Quantité",
          },
          unit: {
            type: "string",
            description: "Unité de mesure (ex: m², ml, h, u, forfait)",
          },
          unitPrice: {
            type: "number",
            description: "Prix unitaire HT en euros",
          },
          tva: {
            type: "number",
            description: "Taux de TVA en pourcentage (par défaut 20)",
          },
        },
        required: ["designation", "quantity", "unitPrice"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_line_item",
      description:
        "Modifie une ligne existante du document. Identifier la ligne par son numéro (index 0-based) ou sa désignation.",
      parameters: {
        type: "object",
        properties: {
          lineIndex: {
            type: "number",
            description: "Index de la ligne à modifier (commence à 0)",
          },
          designation: {
            type: "string",
            description: "Nouvelle désignation",
          },
          description: {
            type: "string",
            description: "Nouvelle description",
          },
          quantity: {
            type: "number",
            description: "Nouvelle quantité",
          },
          unit: {
            type: "string",
            description: "Nouvelle unité",
          },
          unitPrice: {
            type: "number",
            description: "Nouveau prix unitaire HT",
          },
          tva: {
            type: "number",
            description: "Nouveau taux de TVA",
          },
        },
        required: ["lineIndex"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_line_item",
      description: "Supprime une ligne du document.",
      parameters: {
        type: "object",
        properties: {
          lineIndex: {
            type: "number",
            description: "Index de la ligne à supprimer (commence à 0)",
          },
        },
        required: ["lineIndex"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_payment_conditions",
      description: "Définit les conditions de paiement du document.",
      parameters: {
        type: "object",
        properties: {
          conditions: {
            type: "string",
            description: "Texte des conditions de paiement",
          },
        },
        required: ["conditions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_deposit",
      description: "Définit le montant de l'acompte déjà versé.",
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
      name: "set_tva_rate",
      description: "Définit le taux de TVA global du document.",
      parameters: {
        type: "object",
        properties: {
          rate: {
            type: "number",
            description: "Taux de TVA en pourcentage (ex: 10, 20)",
          },
        },
        required: ["rate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_validity",
      description: "Définit la durée de validité du devis.",
      parameters: {
        type: "object",
        properties: {
          validity: {
            type: "string",
            description:
              "Durée de validité (ex: '1 mois', '3 mois', '30 jours')",
          },
        },
        required: ["validity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_due_date",
      description: "Définit la date d'échéance de la facture.",
      parameters: {
        type: "object",
        properties: {
          dueDate: {
            type: "string",
            description:
              "Date d'échéance ou délai (ex: '30 jours', '15/02/2026')",
          },
        },
        required: ["dueDate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "convert_to_invoice",
      description:
        "Convertit le devis actuel en facture. Uniquement disponible si le document actuel est un devis.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

function generateLineId(items: LineItem[]): string {
  const nonSectionItems = items.filter((item) => !item.isSection);
  const sections = items.filter((item) => item.isSection);
  const lastSection = sections[sections.length - 1];

  if (lastSection) {
    const sectionNumber = lastSection.id;
    const sectionItems = items.filter(
      (item) => !item.isSection && item.id.startsWith(`${sectionNumber}.`),
    );
    return `${sectionNumber}.${sectionItems.length + 1}`;
  }

  return `${nonSectionItems.length + 1}`;
}

function generateSectionId(items: LineItem[]): string {
  const sections = items.filter((item) => item.isSection);
  return `${sections.length + 1}`;
}

function recalculateSectionTotals(items: LineItem[]): LineItem[] {
  const result: LineItem[] = [];
  let currentSectionIndex = -1;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.isSection) {
      if (currentSectionIndex >= 0) {
        let sectionTotal = 0;
        for (let j = currentSectionIndex + 1; j < i; j++) {
          if (!items[j].isSection) {
            sectionTotal += items[j].total || 0;
          }
        }
        result[currentSectionIndex] = {
          ...result[currentSectionIndex],
          sectionTotal,
        };
      }
      result.push({ ...item });
      currentSectionIndex = result.length - 1;
    } else {
      result.push({ ...item });
    }
  }

  if (currentSectionIndex >= 0) {
    let sectionTotal = 0;
    for (let j = currentSectionIndex + 1; j < result.length; j++) {
      if (!result[j].isSection) {
        sectionTotal += result[j].total || 0;
      }
    }
    result[currentSectionIndex] = {
      ...result[currentSectionIndex],
      sectionTotal,
    };
  }

  return result;
}

interface ToolContext {
  company: Company;
  nextQuoteNumber: string;
  nextInvoiceNumber: string;
}

export function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  currentDocument: DocumentData | null,
  context: ToolContext,
): { document: DocumentData | null; result: string } {
  const companyInfo = {
    name: context.company.name || "",
    address: context.company.address || "",
    city: "",
    phone: context.company.phone || "",
    email: context.company.email || "",
    siret: context.company.siret || "",
    logoUrl: context.company.logo_url || undefined,
  };

  switch (toolName) {
    case "create_document": {
      const docType = args.documentType as "quote" | "invoice";
      const projectTitle = (args.projectTitle as string) || "";

      if (docType === "quote") {
        const doc = createEmptyQuote(companyInfo, context.nextQuoteNumber);
        doc.projectTitle = projectTitle;
        return {
          document: doc,
          result: `Devis n°${doc.number} créé avec succès.`,
        };
      } else {
        const doc = createEmptyInvoice(companyInfo, context.nextInvoiceNumber);
        doc.projectTitle = projectTitle;
        return {
          document: doc,
          result: `Facture n°${doc.number} créée avec succès.`,
        };
      }
    }

    case "set_client": {
      if (!currentDocument) {
        return {
          document: null,
          result:
            "Erreur: Aucun document en cours. Créez d'abord un devis ou une facture.",
        };
      }
      const clientUpdate: Partial<DocumentClient> = {};
      if (args.clientId) clientUpdate.id = args.clientId as number;
      if (args.name) clientUpdate.name = args.name as string;
      if (args.address) clientUpdate.address = args.address as string;
      if (args.city) clientUpdate.city = args.city as string;
      if (args.phone) clientUpdate.phone = args.phone as string;
      if (args.email) clientUpdate.email = args.email as string;
      if (args.siret) clientUpdate.siret = args.siret as string;

      const updatedDoc = {
        ...currentDocument,
        client: { ...currentDocument.client, ...clientUpdate },
      };
      return {
        document: updatedDoc,
        result: `Client mis à jour: ${clientUpdate.name || currentDocument.client.name || "Client"}`,
      };
    }

    case "set_project_title": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const title = args.title as string;
      return {
        document: { ...currentDocument, projectTitle: title },
        result: `Titre du projet défini: "${title}"`,
      };
    }

    case "add_section": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const sectionTitle = args.title as string;
      const newSection: LineItem = {
        id: generateSectionId(currentDocument.items),
        designation: sectionTitle,
        isSection: true,
        sectionTotal: 0,
      };
      const newItems = [...currentDocument.items, newSection];
      return {
        document: { ...currentDocument, items: newItems },
        result: `Section "${sectionTitle}" ajoutée.`,
      };
    }

    case "add_line_item": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const quantity = args.quantity as number;
      const unitPrice = args.unitPrice as number;
      const unit = (args.unit as string) || "";
      const tva = (args.tva as number) || currentDocument.tvaRate;
      const total = calculateLineTotal(quantity, unitPrice);

      // Format quantity: don't show "forfait" or "u", add space for others
      const hiddenUnits = ["forfait", "u", "unité", "unités"];
      const formattedQuantity = hiddenUnits.includes(unit.toLowerCase())
        ? `${quantity}`
        : unit
          ? `${quantity} ${unit}`
          : `${quantity}`;

      const newItem: LineItem = {
        id: generateLineId(currentDocument.items),
        designation: args.designation as string,
        description: args.description as string | undefined,
        quantity: formattedQuantity,
        unitPrice,
        tva,
        total,
        isSection: false,
      };

      const newItems = recalculateSectionTotals([
        ...currentDocument.items,
        newItem,
      ]);
      const totals = calculateTotals(
        newItems,
        currentDocument.tvaRate,
        currentDocument.deposit,
      );

      return {
        document: { ...currentDocument, items: newItems, ...totals },
        result: `Ligne ajoutée: "${newItem.designation}" - ${total}€`,
      };
    }

    case "update_line_item": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const lineIndex = args.lineIndex as number;
      if (lineIndex < 0 || lineIndex >= currentDocument.items.length) {
        return {
          document: currentDocument,
          result: `Erreur: Index de ligne invalide (${lineIndex}).`,
        };
      }

      const existingItem = currentDocument.items[lineIndex];
      if (existingItem.isSection) {
        const updatedItem = {
          ...existingItem,
          designation: (args.designation as string) || existingItem.designation,
        };
        const newItems = [...currentDocument.items];
        newItems[lineIndex] = updatedItem;
        return {
          document: { ...currentDocument, items: newItems },
          result: `Section mise à jour: "${updatedItem.designation}"`,
        };
      }

      const quantity =
        args.quantity !== undefined
          ? (args.quantity as number)
          : parseFloat(existingItem.quantity || "0");
      const unit =
        args.unit !== undefined
          ? (args.unit as string)
          : existingItem.quantity?.replace(/[\d.\s]/g, "").trim() || "";
      const unitPrice =
        args.unitPrice !== undefined
          ? (args.unitPrice as number)
          : existingItem.unitPrice || 0;
      const total = calculateLineTotal(quantity, unitPrice);

      // Format quantity: don't show "forfait" or "u", add space for others
      const hiddenUnits = ["forfait", "u", "unité", "unités"];
      const formattedQuantity = hiddenUnits.includes(unit.toLowerCase())
        ? `${quantity}`
        : unit
          ? `${quantity} ${unit}`
          : `${quantity}`;

      const updatedItem: LineItem = {
        ...existingItem,
        designation: (args.designation as string) || existingItem.designation,
        description:
          args.description !== undefined
            ? (args.description as string)
            : existingItem.description,
        quantity: formattedQuantity,
        unitPrice,
        tva: args.tva !== undefined ? (args.tva as number) : existingItem.tva,
        total,
      };

      const newItems = [...currentDocument.items];
      newItems[lineIndex] = updatedItem;
      const recalculatedItems = recalculateSectionTotals(newItems);
      const totals = calculateTotals(
        recalculatedItems,
        currentDocument.tvaRate,
        currentDocument.deposit,
      );

      return {
        document: { ...currentDocument, items: recalculatedItems, ...totals },
        result: `Ligne ${lineIndex + 1} mise à jour: "${updatedItem.designation}" - ${total}€`,
      };
    }

    case "remove_line_item": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const removeIndex = args.lineIndex as number;
      if (removeIndex < 0 || removeIndex >= currentDocument.items.length) {
        return {
          document: currentDocument,
          result: `Erreur: Index de ligne invalide (${removeIndex}).`,
        };
      }

      const removedItem = currentDocument.items[removeIndex];
      const newItems = currentDocument.items.filter(
        (_, i) => i !== removeIndex,
      );
      const recalculatedItems = recalculateSectionTotals(newItems);
      const totals = calculateTotals(
        recalculatedItems,
        currentDocument.tvaRate,
        currentDocument.deposit,
      );

      return {
        document: { ...currentDocument, items: recalculatedItems, ...totals },
        result: `Ligne supprimée: "${removedItem.designation}"`,
      };
    }

    case "set_payment_conditions": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const conditions = args.conditions as string;
      return {
        document: { ...currentDocument, paymentConditions: conditions },
        result: `Conditions de paiement définies.`,
      };
    }

    case "set_deposit": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const amount = args.amount as number;
      const totals = calculateTotals(
        currentDocument.items,
        currentDocument.tvaRate,
        amount,
      );
      return {
        document: { ...currentDocument, deposit: amount, ...totals },
        result: `Acompte défini: ${amount}€`,
      };
    }

    case "set_tva_rate": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const rate = args.rate as number;
      const totals = calculateTotals(
        currentDocument.items,
        rate,
        currentDocument.deposit,
      );
      return {
        document: { ...currentDocument, tvaRate: rate, ...totals },
        result: `Taux de TVA défini: ${rate}%`,
      };
    }

    case "set_validity": {
      if (!currentDocument || currentDocument.type !== "quote") {
        return {
          document: currentDocument,
          result: "Erreur: Cette action n'est disponible que pour les devis.",
        };
      }
      const validity = args.validity as string;
      return {
        document: { ...currentDocument, validity } as QuoteData,
        result: `Validité du devis définie: ${validity}`,
      };
    }

    case "set_due_date": {
      if (!currentDocument || currentDocument.type !== "invoice") {
        return {
          document: currentDocument,
          result:
            "Erreur: Cette action n'est disponible que pour les factures.",
        };
      }
      const dueDate = args.dueDate as string;
      return {
        document: { ...currentDocument, dueDate } as InvoiceData,
        result: `Échéance définie: ${dueDate}`,
      };
    }

    case "convert_to_invoice": {
      if (!currentDocument || currentDocument.type !== "quote") {
        return {
          document: currentDocument,
          result: "Erreur: Seuls les devis peuvent être convertis en facture.",
        };
      }
      const invoice = convertQuoteToInvoice(
        currentDocument,
        context.nextInvoiceNumber,
      );
      return {
        document: invoice,
        result: `Devis converti en facture n°${invoice.number}`,
      };
    }

    default:
      return {
        document: currentDocument,
        result: `Outil inconnu: ${toolName}`,
      };
  }
}
