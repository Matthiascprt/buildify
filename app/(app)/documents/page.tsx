import { DocumentsClient } from "./documents-client";
import {
  getQuotes,
  getInvoices,
  getClients,
  getCompany,
} from "@/lib/supabase/api";

export type DocumentType = "devis" | "facture";

export interface DocumentItem {
  id: string;
  numero: string;
  type: DocumentType;
  clientNom: string;
  dateCreation: Date;
  totalTTC: number;
  projectTitle?: string;
  companyName?: string;
  companyLogo?: string;
  accentColor?: string;
}

export default async function DocumentsPage() {
  const [quotes, invoices, clients, company] = await Promise.all([
    getQuotes(),
    getInvoices(),
    getClients(),
    getCompany(),
  ]);

  // Build a map of client IDs to names for quick lookup
  const clientMap = new Map(
    clients.map((c) => [
      c.id,
      `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Client sans nom",
    ]),
  );

  // Transform quotes to DocumentItem
  const quoteItems: DocumentItem[] = quotes.map((q) => ({
    id: q.id,
    numero: q.number,
    type: "devis" as DocumentType,
    clientNom: q.client_id
      ? clientMap.get(q.client_id) || "Client non défini"
      : "Client non défini",
    dateCreation: new Date(q.created_at),
    totalTTC: q.content?.totals?.total_ttc || 0,
    projectTitle: q.content?.project_title,
    companyName: company?.name || undefined,
    companyLogo: company?.logo_url || undefined,
    accentColor: q.color || undefined,
  }));

  // Transform invoices to DocumentItem
  const invoiceItems: DocumentItem[] = invoices.map((i) => ({
    id: i.id,
    numero: i.number,
    type: "facture" as DocumentType,
    clientNom: i.client_id
      ? clientMap.get(i.client_id) || "Client non défini"
      : "Client non défini",
    dateCreation: new Date(i.created_at),
    totalTTC: i.content?.totals?.total_ttc || 0,
    projectTitle: i.content?.project_title,
    companyName: company?.name || undefined,
    companyLogo: company?.logo_url || undefined,
    accentColor: i.color || undefined,
  }));

  // Combine and sort by date (most recent first)
  const documents = [...quoteItems, ...invoiceItems].sort(
    (a, b) => b.dateCreation.getTime() - a.dateCreation.getTime(),
  );

  return <DocumentsClient initialDocuments={documents} />;
}
