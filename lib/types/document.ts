// Générateur UUID simple et performant
export function generateId(): string {
  return crypto.randomUUID();
}

// ============================================
// FRONTEND TYPES - Format hiérarchique
// ============================================

export type LineType = "service" | "material";

export interface LineItem {
  lineId: string;
  lineNumber: string; // "1.1.1", "1.2.1", etc.
  designation: string;
  description?: string;
  lineType?: LineType; // "service" (main-d'œuvre) or "material" (fourniture)
  quantity: number;
  unit?: string; // "m²", "m", "h", "u", "kg", "L", etc.
  unitPriceHT: number;
  vatRate: number;
  totalHT: number;
}

export interface Subsection {
  subsectionId: string;
  subsectionNumber: string; // "1.1", "1.2", etc.
  subsectionLabel: string;
  totalHT: number;
  lines: LineItem[];
}

export interface Section {
  sectionId: string;
  sectionNumber: string; // "1", "2", etc.
  sectionLabel: string;
  totalHT: number;
  subsections: Subsection[];
}

export interface DocumentCompany {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  siret: string;
  rcs?: string;
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
  id?: string;
  number: string;
  date: string;
  validity: string;
  company: DocumentCompany;
  client: DocumentClient;
  projectTitle: string;
  sections: Section[];
  totalHT: number;
  tvaRate: number;
  tvaAmount: number;
  deposit: number;
  totalTTC: number;
  paymentConditions: string;
  legalNotice?: string;
  signature?: string;
}

export interface InvoiceData {
  type: "invoice";
  id?: string;
  number: string;
  date: string;
  dueDate: string;
  company: DocumentCompany;
  client: DocumentClient;
  projectTitle: string;
  sections: Section[];
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

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createEmptyQuote(
  company: DocumentCompany,
  quoteNumber: string,
  defaultTvaRate: number = 10,
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
    sections: [],
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
  defaultTvaRate: number = 10,
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
    sections: [],
    totalHT: 0,
    tvaRate: defaultTvaRate,
    tvaAmount: 0,
    deposit: 0,
    totalTTC: 0,
    paymentConditions: "",
  };
}

// ============================================
// CALCULATION FUNCTIONS
// ============================================

export function calculateLineTotal(
  quantity: number,
  unitPriceHT: number,
): number {
  return Math.round(quantity * unitPriceHT * 100) / 100;
}

export function calculateSubsectionTotal(lines: LineItem[]): number {
  return (
    Math.round(lines.reduce((sum, line) => sum + line.totalHT, 0) * 100) / 100
  );
}

export function calculateSectionTotal(subsections: Subsection[]): number {
  return (
    Math.round(subsections.reduce((sum, sub) => sum + sub.totalHT, 0) * 100) /
    100
  );
}

export function calculateTotals(
  sections: Section[],
  globalTvaRate: number,
  deposit: number = 0,
): { totalHT: number; tvaAmount: number; totalTTC: number } {
  let totalHTCents = 0;
  let tvaTotalCents = 0;

  for (const section of sections) {
    for (const subsection of section.subsections) {
      for (const line of subsection.lines) {
        const lineTotalCents = Math.round(line.totalHT * 100);
        const lineVatRate = line.vatRate ?? globalTvaRate;
        totalHTCents += lineTotalCents;
        tvaTotalCents += Math.round(lineTotalCents * lineVatRate) / 100;
      }
    }
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

export function recalculateAllTotals(sections: Section[]): Section[] {
  return sections.map((section) => {
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
}

// ============================================
// CONVERSION FUNCTIONS
// ============================================

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
    sections: quote.sections,
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
  DocumentSection,
  DocumentSubsection,
  DocumentLine,
  Company,
  Client,
} from "@/lib/supabase/types";

/**
 * Convert frontend DocumentData to backend DocumentContent (JSONB)
 */
export function documentDataToContent(doc: DocumentData): DocumentContent {
  const sections: DocumentSection[] = doc.sections.map((section) => ({
    section_id: section.sectionId,
    section_number: section.sectionNumber,
    section_label: section.sectionLabel,
    total_ht: section.totalHT,
    subsections: section.subsections.map(
      (subsection): DocumentSubsection => ({
        subsection_id: subsection.subsectionId,
        subsection_number: subsection.subsectionNumber,
        subsection_label: subsection.subsectionLabel,
        total_ht: subsection.totalHT,
        lines: subsection.lines.map(
          (line): DocumentLine => ({
            line_id: line.lineId,
            line_number: line.lineNumber,
            designation: line.designation,
            description: line.description,
            line_type: line.lineType,
            quantity: line.quantity,
            unit: line.unit,
            unit_price_ht: line.unitPriceHT,
            vat_rate: line.vatRate,
            total_ht: line.totalHT,
          }),
        ),
      }),
    ),
  }));

  return {
    project_title: doc.projectTitle,
    sections,
    totals: {
      total_ht: doc.totalHT,
      total_vat: doc.tvaAmount,
      total_ttc: doc.totalTTC,
      deposit: doc.deposit,
    },
    signature: doc.type === "quote" ? doc.signature : undefined,
  };
}

/**
 * Convert backend Quote to frontend QuoteData
 */
export function quoteToDocumentData(
  quote: Quote,
  company: Company,
  client?: Client | null,
): QuoteData {
  const rawSections = quote.content?.sections;
  const sectionsArray = Array.isArray(rawSections) ? rawSections : [];

  const sections: Section[] = sectionsArray.map((section) => {
    const rawSubsections = section?.subsections;
    const subsectionsArray = Array.isArray(rawSubsections)
      ? rawSubsections
      : [];

    return {
      sectionId:
        section?.section_id ||
        (section as unknown as Section)?.sectionId ||
        generateId(),
      sectionNumber:
        section?.section_number ||
        (section as unknown as Section)?.sectionNumber ||
        "",
      sectionLabel:
        section?.section_label ||
        (section as unknown as Section)?.sectionLabel ||
        "",
      totalHT:
        section?.total_ht ?? (section as unknown as Section)?.totalHT ?? 0,
      subsections: subsectionsArray.map((subsection) => {
        const rawLines = subsection?.lines;
        const linesArray = Array.isArray(rawLines) ? rawLines : [];

        return {
          subsectionId:
            subsection?.subsection_id ||
            (subsection as unknown as Subsection)?.subsectionId ||
            generateId(),
          subsectionNumber:
            subsection?.subsection_number ||
            (subsection as unknown as Subsection)?.subsectionNumber ||
            "",
          subsectionLabel:
            subsection?.subsection_label ||
            (subsection as unknown as Subsection)?.subsectionLabel ||
            "",
          totalHT:
            subsection?.total_ht ??
            (subsection as unknown as Subsection)?.totalHT ??
            0,
          lines: linesArray.map((line) => ({
            lineId:
              line?.line_id ||
              (line as unknown as LineItem)?.lineId ||
              generateId(),
            lineNumber:
              line?.line_number ||
              (line as unknown as LineItem)?.lineNumber ||
              "",
            designation:
              line?.designation ||
              (line as unknown as LineItem)?.designation ||
              "",
            description:
              line?.description || (line as unknown as LineItem)?.description,
            lineType:
              line?.line_type || (line as unknown as LineItem)?.lineType,
            quantity:
              line?.quantity ?? (line as unknown as LineItem)?.quantity ?? 0,
            unit: line?.unit || (line as unknown as LineItem)?.unit,
            unitPriceHT:
              line?.unit_price_ht ??
              (line as unknown as LineItem)?.unitPriceHT ??
              0,
            vatRate:
              line?.vat_rate ?? (line as unknown as LineItem)?.vatRate ?? 10,
            totalHT:
              line?.total_ht ?? (line as unknown as LineItem)?.totalHT ?? 0,
          })),
        };
      }),
    };
  });

  const clientName = client
    ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
    : undefined;

  const firstLine = sections[0]?.subsections[0]?.lines[0];
  const tvaRate = firstLine?.vatRate || company.vat_rate || 10;

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
      rcs: company.rcs || undefined,
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
    sections,
    totalHT: quote.content?.totals?.total_ht || 0,
    tvaRate,
    tvaAmount: quote.content?.totals?.total_vat || 0,
    deposit: quote.content?.totals?.deposit || 0,
    totalTTC: quote.content?.totals?.total_ttc || 0,
    paymentConditions: company.payment_terms || "",
    legalNotice: company.legal_notice || undefined,
    signature: quote.content?.signature,
  };
}

/**
 * Convert backend Invoice to frontend InvoiceData
 */
export function invoiceToDocumentData(
  invoice: Invoice,
  company: Company,
  client?: Client | null,
): InvoiceData {
  const rawSections = invoice.content?.sections;
  const sectionsArray = Array.isArray(rawSections) ? rawSections : [];

  const sections: Section[] = sectionsArray.map((section) => {
    const rawSubsections = section?.subsections;
    const subsectionsArray = Array.isArray(rawSubsections)
      ? rawSubsections
      : [];

    return {
      sectionId:
        section?.section_id ||
        (section as unknown as Section)?.sectionId ||
        generateId(),
      sectionNumber:
        section?.section_number ||
        (section as unknown as Section)?.sectionNumber ||
        "",
      sectionLabel:
        section?.section_label ||
        (section as unknown as Section)?.sectionLabel ||
        "",
      totalHT:
        section?.total_ht ?? (section as unknown as Section)?.totalHT ?? 0,
      subsections: subsectionsArray.map((subsection) => {
        const rawLines = subsection?.lines;
        const linesArray = Array.isArray(rawLines) ? rawLines : [];

        return {
          subsectionId:
            subsection?.subsection_id ||
            (subsection as unknown as Subsection)?.subsectionId ||
            generateId(),
          subsectionNumber:
            subsection?.subsection_number ||
            (subsection as unknown as Subsection)?.subsectionNumber ||
            "",
          subsectionLabel:
            subsection?.subsection_label ||
            (subsection as unknown as Subsection)?.subsectionLabel ||
            "",
          totalHT:
            subsection?.total_ht ??
            (subsection as unknown as Subsection)?.totalHT ??
            0,
          lines: linesArray.map((line) => ({
            lineId:
              line?.line_id ||
              (line as unknown as LineItem)?.lineId ||
              generateId(),
            lineNumber:
              line?.line_number ||
              (line as unknown as LineItem)?.lineNumber ||
              "",
            designation:
              line?.designation ||
              (line as unknown as LineItem)?.designation ||
              "",
            description:
              line?.description || (line as unknown as LineItem)?.description,
            lineType:
              line?.line_type || (line as unknown as LineItem)?.lineType,
            quantity:
              line?.quantity ?? (line as unknown as LineItem)?.quantity ?? 0,
            unit: line?.unit || (line as unknown as LineItem)?.unit,
            unitPriceHT:
              line?.unit_price_ht ??
              (line as unknown as LineItem)?.unitPriceHT ??
              0,
            vatRate:
              line?.vat_rate ?? (line as unknown as LineItem)?.vatRate ?? 10,
            totalHT:
              line?.total_ht ?? (line as unknown as LineItem)?.totalHT ?? 0,
          })),
        };
      }),
    };
  });

  const clientName = client
    ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
    : undefined;

  const firstLine = sections[0]?.subsections[0]?.lines[0];
  const tvaRate = firstLine?.vatRate || company.vat_rate || 10;

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
      rcs: company.rcs || undefined,
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
    sections,
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
