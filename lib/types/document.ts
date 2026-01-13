export interface LineItem {
  id: string;
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
  id?: number;
  name?: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  siret?: string;
}

export interface QuoteData {
  type: "quote";
  id?: number; // Database ID
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
  id?: number; // Database ID
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
