// Générateur UUID simple et performant
export function generateLineId(): string {
  return crypto.randomUUID();
}

export interface LineItem {
  lineId: string; // UUID stable - identifiant unique de la ligne
  id: string; // Numéro d'affichage (ex: "1", "2", "1.1")
  designation: string;
  description?: string;
  quantity?: string;
  unitPrice?: number;
  tva?: number;
  total?: number;
  isSection?: boolean;
  sectionTotal?: number;
  sectionTotalTTC?: number;
}

export interface DocumentCompany {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  siret: string;
  logoUrl?: string;
  paymentTerms?: string;
  legalNotice?: string;
}

export interface DocumentClient {
  id?: string;
  name?: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  siret?: string;
}

export interface QuoteData {
  type: "quote";
  id?: string; // Database ID
  number: string;
  date: string;
  validity: string;
  company: DocumentCompany;
  client: DocumentClient;
  projectTitle: string;
  items: LineItem[];
  totalHT: number;
  tvaRate: number;
  tvaAmount: number;
  deposit: number;
  totalTTC: number;
  paymentConditions: string;
  legalNotice?: string;
}

export interface InvoiceData {
  type: "invoice";
  id?: string; // Database ID
  number: string;
  date: string;
  dueDate: string;
  company: DocumentCompany;
  client: DocumentClient;
  projectTitle: string;
  items: LineItem[];
  totalHT: number;
  tvaRate: number;
  tvaAmount: number;
  deposit: number;
  totalTTC: number;
  paymentConditions: string;
  legalNotice?: string;
  quoteNumber?: string;
}

export type DocumentData = QuoteData | InvoiceData;

export function createEmptyQuote(
  company: DocumentCompany,
  quoteNumber: string,
  defaultTvaRate: number = 20,
): QuoteData {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("fr-FR");

  return {
    type: "quote",
    number: quoteNumber,
    date: formattedDate,
    validity: "1 mois",
    company,
    client: {
      address: "",
      city: "",
      phone: "",
      email: "",
    },
    projectTitle: "",
    items: [],
    totalHT: 0,
    tvaRate: defaultTvaRate,
    tvaAmount: 0,
    deposit: 0,
    totalTTC: 0,
    paymentConditions: "",
  };
}

export function createEmptyInvoice(
  company: DocumentCompany,
  invoiceNumber: string,
  defaultTvaRate: number = 20,
): InvoiceData {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("fr-FR");
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    type: "invoice",
    number: invoiceNumber,
    date: formattedDate,
    dueDate: dueDate.toLocaleDateString("fr-FR"),
    company,
    client: {
      address: "",
      city: "",
      phone: "",
      email: "",
    },
    projectTitle: "",
    items: [],
    totalHT: 0,
    tvaRate: defaultTvaRate,
    tvaAmount: 0,
    deposit: 0,
    totalTTC: 0,
    paymentConditions: "",
  };
}

export function calculateTotals(
  items: LineItem[],
  globalTvaRate: number,
  deposit: number = 0,
): { totalHT: number; tvaAmount: number; totalTTC: number } {
  let totalHTCents = 0;
  let tvaTotalCents = 0;

  for (const item of items) {
    if (item.isSection) continue;
    const lineTotal = item.total || 0;
    const lineTvaRate = item.tva ?? globalTvaRate;
    const lineTotalCents = Math.round(lineTotal * 100);
    totalHTCents += lineTotalCents;
    tvaTotalCents += Math.round(lineTotalCents * lineTvaRate) / 100;
  }

  tvaTotalCents = Math.round(tvaTotalCents);
  const depositCents = Math.round(deposit * 100);
  const totalTTCCents = totalHTCents + tvaTotalCents - depositCents;

  return {
    totalHT: totalHTCents / 100,
    tvaAmount: tvaTotalCents / 100,
    totalTTC: totalTTCCents / 100,
  };
}

export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function recalculateSectionTotals(items: LineItem[]): LineItem[] {
  const result: LineItem[] = [];
  let currentSectionIndex = -1;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.isSection) {
      if (currentSectionIndex >= 0) {
        let sectionTotal = 0;
        let sectionTotalTTC = 0;
        for (let j = currentSectionIndex + 1; j < i; j++) {
          if (!items[j].isSection) {
            const lineTotal = items[j].total || 0;
            const lineTva = items[j].tva || 0;
            sectionTotal += lineTotal;
            sectionTotalTTC +=
              Math.round(lineTotal * (1 + lineTva / 100) * 100) / 100;
          }
        }
        result[currentSectionIndex] = {
          ...result[currentSectionIndex],
          sectionTotal: Math.round(sectionTotal * 100) / 100,
          sectionTotalTTC: Math.round(sectionTotalTTC * 100) / 100,
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
    let sectionTotalTTC = 0;
    for (let j = currentSectionIndex + 1; j < result.length; j++) {
      if (!result[j].isSection) {
        const lineTotal = result[j].total || 0;
        const lineTva = result[j].tva || 0;
        sectionTotal += lineTotal;
        sectionTotalTTC +=
          Math.round(lineTotal * (1 + lineTva / 100) * 100) / 100;
      }
    }
    result[currentSectionIndex] = {
      ...result[currentSectionIndex],
      sectionTotal: Math.round(sectionTotal * 100) / 100,
      sectionTotalTTC: Math.round(sectionTotalTTC * 100) / 100,
    };
  }

  return result;
}

export function convertQuoteToInvoice(
  quote: QuoteData,
  invoiceNumber: string,
): InvoiceData {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    type: "invoice",
    number: invoiceNumber,
    date: today.toLocaleDateString("fr-FR"),
    dueDate: dueDate.toLocaleDateString("fr-FR"),
    company: quote.company,
    client: quote.client,
    projectTitle: quote.projectTitle,
    items: quote.items,
    totalHT: quote.totalHT,
    tvaRate: quote.tvaRate,
    tvaAmount: quote.tvaAmount,
    deposit: quote.deposit,
    totalTTC: quote.totalTTC,
    paymentConditions: quote.paymentConditions,
    legalNotice: quote.legalNotice,
    quoteNumber: quote.number,
  };
}

// ============================================
// MAPPING FUNCTIONS (Frontend <-> Backend)
// ============================================

import type {
  Quote,
  Invoice,
  DocumentContent,
  DocumentLine,
  Company,
  Client,
} from "@/lib/supabase/types";

/**
 * Convert frontend DocumentData to backend DocumentContent (JSONB)
 * IMPORTANT: Cette fonction préserve les line_id et NE TOUCHE JAMAIS project_title
 */
export function documentDataToContent(doc: DocumentData): DocumentContent {
  const lines: DocumentLine[] = doc.items.map((item, index) => {
    const quantity =
      parseFloat(String(item.quantity || "0").replace(/[^\d.]/g, "")) || 0;
    const unitPriceHT = item.unitPrice || 0;
    const vatRate = item.tva || doc.tvaRate;
    // Calculate total_ttc per line: quantity × unit_price_ht × (1 + vat_rate/100)
    const totalHT = quantity * unitPriceHT;
    const totalTTC = item.isSection
      ? 0
      : Math.round(totalHT * (1 + vatRate / 100) * 100) / 100;

    return {
      line_id: item.lineId, // CRITIQUE: Préserver l'UUID stable
      line_number: index + 1, // Numéro d'affichage uniquement
      designation: item.designation,
      description: item.description,
      quantity,
      unit_price_ht: unitPriceHT,
      vat_rate: vatRate,
      total_ttc: totalTTC,
      is_section: item.isSection,
    };
  });

  // IMPORTANT: project_title est préservé tel quel - AUCUNE modification automatique
  // La génération du titre est uniquement faite par l'outil set_project_title de l'IA
  return {
    project_title: doc.projectTitle, // Préservation stricte
    lines,
    totals: {
      deposit: doc.deposit,
      total_ht: doc.totalHT,
      total_vat: doc.tvaAmount,
      total_ttc: doc.totalTTC,
    },
  };
}

/**
 * Convert backend Quote to frontend QuoteData
 * IMPORTANT: Préserve les line_id UUID existants ou en génère de nouveaux
 */
export function quoteToDocumentData(
  quote: Quote,
  company: Company,
  client?: Client | null,
): QuoteData {
  const items: LineItem[] = (quote.content?.lines || []).map((line, index) => {
    const vatRate = line.vat_rate || 20;
    // Convert total_ttc back to total_ht for frontend
    const totalHT = line.is_section
      ? 0
      : Math.round((line.total_ttc / (1 + vatRate / 100)) * 100) / 100;

    return {
      lineId: line.line_id || generateLineId(), // Préserver UUID ou générer si absent
      id: String(line.line_number || index + 1),
      designation: line.designation || "",
      description: line.description,
      quantity: String(line.quantity || 0),
      unitPrice: line.unit_price_ht || 0,
      tva: vatRate,
      total: totalHT,
      isSection: line.is_section,
    };
  });

  const clientName = client
    ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
    : undefined;

  // Derive TVA rate from first non-section line or use company default
  const firstLineWithVat = (quote.content?.lines || []).find(
    (line) => !line.is_section && line.vat_rate,
  );
  const tvaRate = firstLineWithVat?.vat_rate || company.vat_rate || 20;

  return {
    type: "quote",
    id: quote.id,
    number: quote.number,
    date: new Date(quote.created_at).toLocaleDateString("fr-FR"),
    validity: quote.valid_until
      ? new Date(quote.valid_until).toLocaleDateString("fr-FR")
      : "1 mois",
    company: {
      name: company.name || "",
      address: company.address || "",
      city: "",
      phone: company.phone || "",
      email: company.email || "",
      siret: company.siret || "",
      logoUrl: company.logo_url || undefined,
      paymentTerms: company.payment_terms || undefined,
      legalNotice: company.legal_notice || undefined,
    },
    client: {
      id: client?.id,
      name: clientName,
      address: "",
      city: "",
      phone: client?.phone || "",
      email: client?.email || "",
    },
    projectTitle: quote.content?.project_title || "",
    items,
    totalHT: quote.content?.totals?.total_ht || 0,
    tvaRate,
    tvaAmount: quote.content?.totals?.total_vat || 0,
    deposit: quote.content?.totals?.deposit || 0,
    totalTTC: quote.content?.totals?.total_ttc || 0,
    paymentConditions: company.payment_terms || "",
    legalNotice: company.legal_notice || undefined,
  };
}

/**
 * Convert backend Invoice to frontend InvoiceData
 * IMPORTANT: Préserve les line_id UUID existants ou en génère de nouveaux
 */
export function invoiceToDocumentData(
  invoice: Invoice,
  company: Company,
  client?: Client | null,
): InvoiceData {
  const items: LineItem[] = (invoice.content?.lines || []).map(
    (line, index) => {
      const vatRate = line.vat_rate || 20;
      // Convert total_ttc back to total_ht for frontend
      const totalHT = line.is_section
        ? 0
        : Math.round((line.total_ttc / (1 + vatRate / 100)) * 100) / 100;

      return {
        lineId: line.line_id || generateLineId(), // Préserver UUID ou générer si absent
        id: String(line.line_number || index + 1),
        designation: line.designation || "",
        description: line.description,
        quantity: String(line.quantity || 0),
        unitPrice: line.unit_price_ht || 0,
        tva: vatRate,
        total: totalHT,
        isSection: line.is_section,
      };
    },
  );

  const clientName = client
    ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
    : undefined;

  // Derive TVA rate from first non-section line or use company default
  const firstLineWithVat = (invoice.content?.lines || []).find(
    (line) => !line.is_section && line.vat_rate,
  );
  const tvaRate = firstLineWithVat?.vat_rate || company.vat_rate || 20;

  return {
    type: "invoice",
    id: invoice.id,
    number: invoice.number,
    date: new Date(invoice.created_at).toLocaleDateString("fr-FR"),
    dueDate: invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString("fr-FR")
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
          "fr-FR",
        ),
    company: {
      name: company.name || "",
      address: company.address || "",
      city: "",
      phone: company.phone || "",
      email: company.email || "",
      siret: company.siret || "",
      logoUrl: company.logo_url || undefined,
      paymentTerms: company.payment_terms || undefined,
      legalNotice: company.legal_notice || undefined,
    },
    client: {
      id: client?.id,
      name: clientName,
      address: "",
      city: "",
      phone: client?.phone || "",
      email: client?.email || "",
    },
    projectTitle: invoice.content?.project_title || "",
    items,
    totalHT: invoice.content?.totals?.total_ht || 0,
    tvaRate,
    tvaAmount: invoice.content?.totals?.total_vat || 0,
    deposit: invoice.content?.totals?.deposit || 0,
    totalTTC: invoice.content?.totals?.total_ttc || 0,
    paymentConditions: company.payment_terms || "",
    legalNotice: company.legal_notice || undefined,
    quoteNumber: undefined,
  };
}
