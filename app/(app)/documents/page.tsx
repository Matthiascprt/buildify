import {
  getQuotesWithClients,
  getInvoicesWithClients,
} from "@/lib/supabase/api";
import { DocumentsClient } from "./documents-client";

export type DocumentType = "devis" | "facture";

export interface DocumentItem {
  id: number;
  numero: string;
  type: DocumentType;
  clientNom: string;
  dateCreation: Date;
  totalTTC: number;
}

export default async function DocumentsPage() {
  const [quotes, invoices] = await Promise.all([
    getQuotesWithClients(),
    getInvoicesWithClients(),
  ]);

  const documents: DocumentItem[] = [
    ...quotes.map((quote) => {
      const content = quote.content as {
        totalTTC?: number;
        client?: { name?: string };
      } | null;
      const clientName = quote.clients
        ? `${quote.clients.first_name || ""} ${quote.clients.last_name || ""}`.trim()
        : content?.client?.name || "Client inconnu";

      return {
        id: quote.id,
        numero: quote.quote_number || `DEV-${quote.id}`,
        type: "devis" as DocumentType,
        clientNom: clientName,
        dateCreation: new Date(quote.created_at),
        totalTTC: content?.totalTTC || 0,
      };
    }),
    ...invoices.map((invoice) => {
      const content = invoice.content as {
        totalTTC?: number;
        client?: { name?: string };
      } | null;
      const clientName = invoice.clients
        ? `${invoice.clients.first_name || ""} ${invoice.clients.last_name || ""}`.trim()
        : content?.client?.name || "Client inconnu";

      return {
        id: invoice.id,
        numero: invoice.invoice_number || `FAC-${invoice.id}`,
        type: "facture" as DocumentType,
        clientNom: clientName,
        dateCreation: new Date(invoice.created_at),
        totalTTC: content?.totalTTC || 0,
      };
    }),
  ];

  return <DocumentsClient initialDocuments={documents} />;
}
