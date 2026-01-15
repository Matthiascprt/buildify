import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { DocumentData, LineItem } from "@/lib/types/document";
import { generateLineId, calculateTotals } from "@/lib/types/document";
import type { Client } from "@/lib/supabase/types";
import {
  findOrCreateClient,
  updateClient as updateClientDb,
} from "@/lib/supabase/api";

export const documentTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "update_document_lines",
      description:
        "Add, modify, or update lines in the document. Use this to add new items, fill empty lines, or modify existing lines. Always fill empty lines first before creating new ones.",
      parameters: {
        type: "object",
        properties: {
          lines_to_add: {
            type: "array",
            description:
              "New lines to add to the document. Generate a UUID for each line_id.",
            items: {
              type: "object",
              properties: {
                line_id: {
                  type: "string",
                  description: "UUID for the line. Generate a new UUID.",
                },
                designation: { type: "string", description: "Line title" },
                description: {
                  type: "string",
                  description: "Optional description",
                },
                quantity: { type: "number", description: "Quantity" },
                unit_price_ht: {
                  type: "number",
                  description: "Unit price HT (excluding tax)",
                },
                vat_rate: {
                  type: "number",
                  description: "VAT rate percentage (default 20)",
                },
                is_section: {
                  type: "boolean",
                  description: "True if this is a section header",
                },
              },
              required: ["line_id", "designation"],
            },
          },
          lines_to_update: {
            type: "array",
            description:
              "Existing lines to update. Use index (0-based) to identify the line.",
            items: {
              type: "object",
              properties: {
                index: {
                  type: "number",
                  description: "0-based index of the line to update",
                },
                designation: { type: "string" },
                description: { type: "string" },
                quantity: { type: "number" },
                unit_price_ht: { type: "number" },
                vat_rate: { type: "number" },
                is_section: { type: "boolean" },
              },
              required: ["index"],
            },
          },
          lines_to_remove: {
            type: "array",
            description: "Indices (0-based) of lines to remove",
            items: { type: "number" },
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
        "Set or update the project title. Use this to set a descriptive title for the document.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The project title" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_deposit",
      description: "Set the deposit amount (acompte) for the document.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Deposit amount in euros" },
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
        "Change the accent color of the document. Use hex color format.",
      parameters: {
        type: "object",
        properties: {
          color: {
            type: "string",
            description:
              "Hex color code (e.g., #f97316, #3b82f6). Use null to reset to default.",
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
        "Set the validity date for a quote. Only works for quotes, not invoices.",
      parameters: {
        type: "object",
        properties: {
          validity: {
            type: "string",
            description:
              "Validity period (e.g., '1 mois', '15 jours', '30/06/2025')",
          },
          valid_until: {
            type: "string",
            description: "ISO date for database (YYYY-MM-DD)",
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
        "Set the due date for an invoice. Only works for invoices, not quotes.",
      parameters: {
        type: "object",
        properties: {
          due_date: {
            type: "string",
            description: "Due date display format (e.g., '15/02/2025')",
          },
          due_date_db: {
            type: "string",
            description: "ISO date for database (YYYY-MM-DD)",
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
        "Create a new client and associate it with the current document. Use this when the client does not exist yet.",
      parameters: {
        type: "object",
        properties: {
          first_name: { type: "string", description: "Client first name" },
          last_name: { type: "string", description: "Client last name" },
          email: { type: "string", description: "Client email" },
          phone: { type: "string", description: "Client phone number" },
          type: {
            type: "string",
            enum: ["particulier", "professionnel"],
            description: "Client type",
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
        "Associate an existing client with the current document. Use the client ID from the clients list.",
      parameters: {
        type: "object",
        properties: {
          client_id: {
            type: "string",
            description: "The UUID of the existing client to associate",
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
        "Update information of the currently associated client. Only works if a client is already associated.",
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
}

function recalculateDocumentTotals(document: DocumentData): DocumentData {
  const totals = calculateTotals(
    document.items,
    document.tvaRate,
    document.deposit,
  );
  return {
    ...document,
    totalHT: totals.totalHT,
    tvaAmount: totals.tvaAmount,
    totalTTC: totals.totalTTC,
  };
}

function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
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
    case "update_document_lines": {
      const linesToAdd =
        (args.lines_to_add as Array<{
          line_id: string;
          designation: string;
          description?: string;
          quantity?: number;
          unit_price_ht?: number;
          vat_rate?: number;
          is_section?: boolean;
        }>) || [];
      const linesToUpdate =
        (args.lines_to_update as Array<{
          index: number;
          designation?: string;
          description?: string;
          quantity?: number;
          unit_price_ht?: number;
          vat_rate?: number;
          is_section?: boolean;
        }>) || [];
      const linesToRemove = (args.lines_to_remove as number[]) || [];

      let updatedItems = [...document.items];

      // Remove lines first (in reverse order to maintain indices)
      const sortedRemoveIndices = [...linesToRemove].sort((a, b) => b - a);
      for (const idx of sortedRemoveIndices) {
        if (idx >= 0 && idx < updatedItems.length) {
          updatedItems.splice(idx, 1);
        }
      }

      // Update existing lines
      for (const update of linesToUpdate) {
        const idx = update.index;
        if (idx >= 0 && idx < updatedItems.length) {
          const existingItem = updatedItems[idx];
          const quantity =
            update.quantity !== undefined
              ? update.quantity
              : parseFloat(String(existingItem.quantity || "0")) || 0;
          const unitPrice =
            update.unit_price_ht !== undefined
              ? update.unit_price_ht
              : existingItem.unitPrice || 0;
          const tva =
            update.vat_rate !== undefined
              ? update.vat_rate
              : existingItem.tva || document.tvaRate;

          updatedItems[idx] = {
            ...existingItem,
            designation:
              update.designation !== undefined
                ? update.designation
                : existingItem.designation,
            description:
              update.description !== undefined
                ? update.description
                : existingItem.description,
            quantity: String(quantity),
            unitPrice,
            tva,
            total: calculateLineTotal(quantity, unitPrice),
            isSection:
              update.is_section !== undefined
                ? update.is_section
                : existingItem.isSection,
          };
        }
      }

      // Add new lines
      for (const newLine of linesToAdd) {
        const quantity = newLine.quantity || 0;
        const unitPrice = newLine.unit_price_ht || 0;
        const tva = newLine.vat_rate || document.tvaRate;

        const lineItem: LineItem = {
          lineId: newLine.line_id || generateLineId(),
          id: String(updatedItems.length + 1),
          designation: newLine.designation,
          description: newLine.description,
          quantity: String(quantity),
          unitPrice,
          tva,
          total: calculateLineTotal(quantity, unitPrice),
          isSection: newLine.is_section || false,
        };
        updatedItems.push(lineItem);
      }

      // Re-number lines
      updatedItems = updatedItems.map((item, idx) => ({
        ...item,
        id: String(idx + 1),
      }));

      const updatedDocument = recalculateDocumentTotals({
        ...document,
        items: updatedItems,
      });

      return {
        success: true,
        message: "Lignes mises à jour.",
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

    default:
      return {
        success: false,
        message: `Outil inconnu: ${toolName}`,
      };
  }
}
