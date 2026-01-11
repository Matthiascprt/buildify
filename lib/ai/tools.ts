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
            description:
              "Description détaillée OBLIGATOIRE - Tu dois TOUJOURS générer une description professionnelle et pertinente basée sur la désignation. Exemple: pour 'Pose carrelage', mettre 'Fourniture et pose de carrelage grès cérame, colle et joints compris'. NE JAMAIS laisser vide.",
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
            description:
              "Prix unitaire HT (Hors Taxes) en euros pour UNE unité. Le total HT de la ligne sera calculé: Quantité × Prix unitaire HT",
          },
          tva: {
            type: "number",
            description:
              "Taux de TVA en pourcentage (ex: 10, 20). Par défaut utilise le taux de l'entreprise. La TVA sera calculée sur le total HT de la ligne.",
          },
        },
        required: ["designation", "description", "quantity", "unitPrice"],
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
            description: "Nouvelle description détaillée de la prestation",
          },
          quantity: {
            type: "number",
            description: "Nouvelle quantité (nombre uniquement, sans unité)",
          },
          unit: {
            type: "string",
            description: "Nouvelle unité de mesure (m², ml, h, u, forfait)",
          },
          unitPrice: {
            type: "number",
            description:
              "Nouveau prix unitaire HT en euros. Le total HT sera recalculé: Quantité × Prix unitaire HT",
          },
          tva: {
            type: "number",
            description: "Nouveau taux de TVA en pourcentage (ex: 10, 20)",
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
      description:
        "Définit le montant de l'acompte. L'acompte sera déduit du Total TTC final. Formule: Total TTC = Total HT + TVA - Acompte",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Montant de l'acompte en euros à déduire du total TTC",
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
      description:
        "Définit le taux de TVA global et l'applique à TOUTES les lignes du document. Utiliser pour changer la TVA de tout le document d'un coup.",
      parameters: {
        type: "object",
        properties: {
          rate: {
            type: "number",
            description:
              "Taux de TVA en pourcentage (5.5, 10, ou 20). Sera appliqué à toutes les lignes.",
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
  {
    type: "function",
    function: {
      name: "find_and_update_line",
      description:
        "Trouve une ligne par son nom (désignation) et la met à jour. Utiliser quand l'utilisateur mentionne une ligne par son nom plutôt que par son numéro.",
      parameters: {
        type: "object",
        properties: {
          searchTerm: {
            type: "string",
            description:
              "Terme de recherche pour trouver la ligne (ex: 'peinture', 'carrelage', 'main d'oeuvre')",
          },
          designation: {
            type: "string",
            description: "Nouvelle désignation (optionnel)",
          },
          description: {
            type: "string",
            description:
              "Nouvelle description détaillée de la prestation (optionnel)",
          },
          quantity: {
            type: "number",
            description: "Nouvelle quantité en nombre (optionnel)",
          },
          unit: {
            type: "string",
            description:
              "Nouvelle unité de mesure: m², ml, h, u, forfait (optionnel)",
          },
          unitPrice: {
            type: "number",
            description:
              "Nouveau prix unitaire HT en euros. Le total HT sera recalculé (optionnel)",
          },
          tva: {
            type: "number",
            description:
              "Nouveau taux de TVA en pourcentage: 5.5, 10, 20 (optionnel)",
          },
        },
        required: ["searchTerm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recalculate_totals",
      description:
        "Recalcule tous les totaux du document (HT, TVA, TTC). Utiliser si l'utilisateur demande de 'refaire le total' ou si les calculs semblent incorrects.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_accent_color",
      description:
        "Change la couleur d'accent du document (couleur de l'en-tête du tableau). Utiliser quand l'utilisateur demande de changer la couleur du document, de le personnaliser avec une couleur, ou de modifier le style visuel.",
      parameters: {
        type: "object",
        properties: {
          color: {
            type: "string",
            description:
              "Couleur au format hexadécimal (ex: '#3b82f6' pour bleu, '#10b981' pour vert, '#ef4444' pour rouge, '#f59e0b' pour orange). Utilise null ou 'default' pour réinitialiser à la couleur par défaut grise.",
          },
        },
        required: ["color"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_total_ttc",
      description:
        "OBSOLÈTE - Utilise 'adjust_total_ttc' à la place. Cette fonction ajuste l'acompte pour atteindre le TTC, mais peut créer des incohérences.",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Le montant TTC final exact souhaité en euros",
          },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "adjust_total_ttc",
      description:
        "PRIORITAIRE - Ajuste le Total TTC de manière intelligente. Par défaut, ajuste les prix HT proportionnellement (méthode recommandée). Utilise cette fonction quand l'utilisateur demande un TTC précis. IMPORTANT: si l'acompte est actuellement à 0, utilise TOUJOURS method='adjust_ht'.",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Le montant TTC final exact souhaité en euros",
          },
          method: {
            type: "string",
            enum: ["adjust_ht", "adjust_deposit"],
            description:
              "Méthode d'ajustement: 'adjust_ht' (RECOMMANDÉ, par défaut) ajuste tous les prix HT proportionnellement pour atteindre le TTC. 'adjust_deposit' modifie l'acompte (À UTILISER SEULEMENT si un acompte existe déjà). Si l'acompte actuel est 0, utilise OBLIGATOIREMENT 'adjust_ht'.",
          },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_total_ht",
      description:
        "PRIORITAIRE - Définit le Total HT exact demandé par l'utilisateur. Ajuste proportionnellement tous les prix unitaires pour atteindre le HT désiré. Si l'utilisateur dit 'je veux un total HT de 1000€', utilise cet outil.",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Le montant HT total exact souhaité en euros",
          },
        },
        required: ["amount"],
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
): {
  document: DocumentData | null;
  result: string;
  accentColor?: string | null;
} {
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

      const defaultTvaRate = context.company.vat_rate || 20;
      if (docType === "quote") {
        const doc = createEmptyQuote(
          companyInfo,
          context.nextQuoteNumber,
          defaultTvaRate,
        );
        doc.projectTitle = projectTitle;
        return {
          document: doc,
          result: `Devis n°${doc.number} créé avec succès.`,
        };
      } else {
        const doc = createEmptyInvoice(
          companyInfo,
          context.nextInvoiceNumber,
          defaultTvaRate,
        );
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
      const updatedItems = currentDocument.items.map((item) => {
        if (item.isSection) return item;
        return { ...item, tva: rate };
      });
      const recalculatedItems = recalculateSectionTotals(updatedItems);
      const totals = calculateTotals(
        recalculatedItems,
        rate,
        currentDocument.deposit,
      );
      return {
        document: {
          ...currentDocument,
          items: recalculatedItems,
          tvaRate: rate,
          ...totals,
        },
        result: `Taux de TVA défini: ${rate}% (appliqué à toutes les lignes)`,
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

    case "find_and_update_line": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const searchTerm = (args.searchTerm as string).toLowerCase();
      const foundIndex = currentDocument.items.findIndex(
        (item) =>
          !item.isSection &&
          item.designation.toLowerCase().includes(searchTerm),
      );

      if (foundIndex === -1) {
        return {
          document: currentDocument,
          result: `Erreur: Aucune ligne trouvée contenant "${args.searchTerm}". Lignes disponibles: ${currentDocument.items
            .filter((i) => !i.isSection)
            .map((i) => i.designation)
            .join(", ")}`,
        };
      }

      const existingItem = currentDocument.items[foundIndex];
      const quantity =
        args.quantity !== undefined
          ? (args.quantity as number)
          : parseFloat(existingItem.quantity?.replace(/[^\d.]/g, "") || "0");
      const unit =
        args.unit !== undefined
          ? (args.unit as string)
          : existingItem.quantity?.replace(/[\d.\s]/g, "").trim() || "";
      const unitPrice =
        args.unitPrice !== undefined
          ? (args.unitPrice as number)
          : existingItem.unitPrice || 0;
      const total = calculateLineTotal(quantity, unitPrice);

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
      newItems[foundIndex] = updatedItem;
      const recalculatedItems = recalculateSectionTotals(newItems);
      const totals = calculateTotals(
        recalculatedItems,
        currentDocument.tvaRate,
        currentDocument.deposit,
      );

      return {
        document: { ...currentDocument, items: recalculatedItems, ...totals },
        result: `Ligne "${existingItem.designation}" mise à jour: ${total}€`,
      };
    }

    case "recalculate_totals": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const recalculatedItems = recalculateSectionTotals(currentDocument.items);
      const totals = calculateTotals(
        recalculatedItems,
        currentDocument.tvaRate,
        currentDocument.deposit,
      );
      return {
        document: { ...currentDocument, items: recalculatedItems, ...totals },
        result: `Totaux recalculés: HT ${totals.totalHT}€, TVA ${totals.tvaAmount}€, TTC ${totals.totalTTC}€`,
      };
    }

    case "set_total_ttc": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const desiredTTC = args.amount as number;

      // Si l'acompte est 0, on ajuste le HT au lieu de créer un acompte
      if (currentDocument.deposit === 0) {
        // Calculer le HT nécessaire pour atteindre le TTC désiré
        // TTC = HT + (HT * TVA%) donc HT = TTC / (1 + TVA%)
        const avgTvaRate = currentDocument.tvaRate / 100;
        const targetHT =
          Math.round((desiredTTC / (1 + avgTvaRate)) * 100) / 100;
        const currentHT = currentDocument.totalHT;

        if (currentHT === 0) {
          return {
            document: currentDocument,
            result:
              "Erreur: Impossible d'ajuster le TTC car il n'y a aucune ligne.",
          };
        }

        const ratio = targetHT / currentHT;

        const updatedItems = currentDocument.items.map((item) => {
          if (item.isSection) return item;
          const newUnitPrice =
            Math.round((item.unitPrice || 0) * ratio * 100) / 100;
          const quantity = parseFloat(
            item.quantity?.replace(/[^\d.]/g, "") || "0",
          );
          const newTotal = calculateLineTotal(quantity, newUnitPrice);
          return { ...item, unitPrice: newUnitPrice, total: newTotal };
        });

        const recalculatedItems = recalculateSectionTotals(updatedItems);
        const totals = calculateTotals(
          recalculatedItems,
          currentDocument.tvaRate,
          0,
        );

        return {
          document: { ...currentDocument, items: recalculatedItems, ...totals },
          result: `Total TTC ajusté à ${totals.totalTTC}€ (prix HT mis à l'échelle)`,
        };
      }

      // Si un acompte existe, on peut l'ajuster
      const currentHT = currentDocument.totalHT;
      const currentTVA = currentDocument.tvaAmount;
      const newDeposit =
        Math.round((currentHT + currentTVA - desiredTTC) * 100) / 100;

      return {
        document: {
          ...currentDocument,
          deposit: newDeposit,
          totalTTC: desiredTTC,
        },
        result: `Total TTC défini à ${desiredTTC}€ (acompte ajusté à ${newDeposit}€)`,
      };
    }

    case "adjust_total_ttc": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const desiredTTC = args.amount as number;
      const method = (args.method as string) || "adjust_ht";

      // Force adjust_ht si l'acompte est 0
      const effectiveMethod =
        currentDocument.deposit === 0 ? "adjust_ht" : method;

      if (effectiveMethod === "adjust_ht") {
        // Calculer le HT nécessaire pour atteindre le TTC désiré
        // On doit trouver HT tel que HT + TVA(HT) = TTC
        // Comme chaque ligne peut avoir un taux différent, on calcule un ratio global
        const currentHT = currentDocument.totalHT;
        const currentTVA = currentDocument.tvaAmount;

        if (currentHT === 0) {
          return {
            document: currentDocument,
            result:
              "Erreur: Impossible d'ajuster le TTC car il n'y a aucune ligne.",
          };
        }

        // Ratio pour atteindre le nouveau TTC (en gardant l'acompte actuel)
        const targetHTplusTVA = desiredTTC + currentDocument.deposit;
        const currentHTplusTVA = currentHT + currentTVA;
        const ratio = targetHTplusTVA / currentHTplusTVA;

        const updatedItems = currentDocument.items.map((item) => {
          if (item.isSection) return item;
          const newUnitPrice =
            Math.round((item.unitPrice || 0) * ratio * 100) / 100;
          const quantity = parseFloat(
            item.quantity?.replace(/[^\d.]/g, "") || "0",
          );
          const newTotal = calculateLineTotal(quantity, newUnitPrice);
          return { ...item, unitPrice: newUnitPrice, total: newTotal };
        });

        const recalculatedItems = recalculateSectionTotals(updatedItems);
        const totals = calculateTotals(
          recalculatedItems,
          currentDocument.tvaRate,
          currentDocument.deposit,
        );

        return {
          document: { ...currentDocument, items: recalculatedItems, ...totals },
          result: `Total TTC ajusté à ${totals.totalTTC}€ (prix HT mis à l'échelle, acompte inchangé: ${currentDocument.deposit}€)`,
        };
      } else {
        // adjust_deposit: ajuster l'acompte
        const currentHT = currentDocument.totalHT;
        const currentTVA = currentDocument.tvaAmount;
        const newDeposit =
          Math.round((currentHT + currentTVA - desiredTTC) * 100) / 100;

        if (newDeposit < 0) {
          return {
            document: currentDocument,
            result: `Erreur: Impossible d'atteindre ${desiredTTC}€ TTC avec un acompte. Le maximum possible est ${Math.round((currentHT + currentTVA) * 100) / 100}€. Utilisez adjust_ht pour ajuster les prix.`,
          };
        }

        return {
          document: {
            ...currentDocument,
            deposit: newDeposit,
            totalTTC: desiredTTC,
          },
          result: `Total TTC défini à ${desiredTTC}€ (acompte ajusté à ${newDeposit}€)`,
        };
      }
    }

    case "set_total_ht": {
      if (!currentDocument) {
        return {
          document: null,
          result: "Erreur: Aucun document en cours.",
        };
      }
      const desiredHT = args.amount as number;
      const currentHT = currentDocument.totalHT;

      if (currentHT === 0) {
        return {
          document: currentDocument,
          result:
            "Erreur: Impossible d'ajuster le HT car il n'y a aucune ligne avec un montant.",
        };
      }

      // Calculer le ratio pour ajuster tous les prix
      const ratio = desiredHT / currentHT;

      // Ajuster tous les prix unitaires proportionnellement
      const updatedItems = currentDocument.items.map((item) => {
        if (item.isSection) return item;
        const newUnitPrice =
          Math.round((item.unitPrice || 0) * ratio * 100) / 100;
        const quantity = parseFloat(
          item.quantity?.replace(/[^\d.]/g, "") || "0",
        );
        const newTotal = calculateLineTotal(quantity, newUnitPrice);
        return { ...item, unitPrice: newUnitPrice, total: newTotal };
      });

      const recalculatedItems = recalculateSectionTotals(updatedItems);
      const totals = calculateTotals(
        recalculatedItems,
        currentDocument.tvaRate,
        currentDocument.deposit,
      );

      return {
        document: { ...currentDocument, items: recalculatedItems, ...totals },
        result: `Total HT ajusté à ${totals.totalHT}€ (prix unitaires mis à l'échelle)`,
      };
    }

    case "set_accent_color": {
      const color = args.color as string;
      const isReset =
        !color || color === "default" || color === "null" || color === "reset";

      if (isReset) {
        return {
          document: currentDocument,
          result: "Couleur réinitialisée à la valeur par défaut.",
          accentColor: null,
        };
      }

      // Validate hex color format
      const hexPattern = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
      if (!hexPattern.test(color)) {
        return {
          document: currentDocument,
          result: `Erreur: Format de couleur invalide. Utilisez un format hexadécimal comme '#3b82f6'.`,
        };
      }

      return {
        document: currentDocument,
        result: `Couleur d'accent changée en ${color}.`,
        accentColor: color,
      };
    }

    default:
      return {
        document: currentDocument,
        result: `Outil inconnu: ${toolName}`,
      };
  }
}
