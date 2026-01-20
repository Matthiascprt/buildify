/**
 * Excel Export Utility - Professional ERP Format
 * Generates structured Excel files for quotes/invoices with proper data separation
 */

import * as XLSX from "xlsx";
import type {
  DocumentData,
  InvoiceData,
  QuoteData,
  Section,
  Subsection,
  LineItem,
} from "@/lib/types/document";

type CellValue = string | number | null | undefined;

interface VatSummary {
  rate: number;
  baseHT: number;
  vatAmount: number;
}

function calculateLineVat(line: LineItem): number {
  return Math.round(line.totalHT * (line.vatRate / 100) * 100) / 100;
}

function calculateLineTTC(line: LineItem): number {
  return Math.round((line.totalHT + calculateLineVat(line)) * 100) / 100;
}

function calculateSubsectionVat(subsection: Subsection): number {
  return (subsection.lines || []).reduce(
    (sum, line) => sum + calculateLineVat(line),
    0,
  );
}

function calculateSectionVat(section: Section): number {
  return (section.subsections || []).reduce(
    (sum, sub) => sum + calculateSubsectionVat(sub),
    0,
  );
}

function buildVatSummary(sections: Section[]): VatSummary[] {
  const vatMap = new Map<number, VatSummary>();

  for (const section of sections) {
    for (const subsection of section.subsections || []) {
      for (const line of subsection.lines || []) {
        const rate = line.vatRate || 0;
        const existing = vatMap.get(rate) || { rate, baseHT: 0, vatAmount: 0 };
        existing.baseHT += line.totalHT || 0;
        existing.vatAmount += calculateLineVat(line);
        vatMap.set(rate, existing);
      }
    }
  }

  return Array.from(vatMap.values()).sort((a, b) => a.rate - b.rate);
}

export function generateExcel(document: DocumentData): Blob {
  const isInvoice = document.type === "invoice";
  const data = document as InvoiceData | QuoteData;
  const sections = Array.isArray(data.sections) ? data.sections : [];

  const workbook = XLSX.utils.book_new();

  // ============================================
  // SHEET 1: Document Metadata
  // ============================================
  const metaRows: CellValue[][] = [
    ["MÉTADONNÉES DOCUMENT"],
    [],
    ["Champ", "Valeur"],
    ["ID Document", data.id || ""],
    ["Type", isInvoice ? "Facture" : "Devis"],
    ["Numéro", data.number],
    ["Date émission", data.date],
    [
      isInvoice ? "Date échéance" : "Valable jusqu'au",
      isInvoice ? (data as InvoiceData).dueDate : (data as QuoteData).validity,
    ],
    ["Titre du projet", data.projectTitle],
    [],
    ["Statistiques"],
    ["Nombre de sections", sections.length],
    [
      "Nombre de sous-sections",
      sections.reduce((acc, s) => acc + (s.subsections || []).length, 0),
    ],
    [
      "Nombre de lignes",
      sections.reduce(
        (acc, s) =>
          acc +
          (s.subsections || []).reduce(
            (acc2, sub) => acc2 + (sub.lines || []).length,
            0,
          ),
        0,
      ),
    ],
    [],
    ["Export"],
    ["Date export", new Date().toISOString()],
    ["Version format", "2.0"],
  ];

  const metaSheet = XLSX.utils.aoa_to_sheet(metaRows);
  metaSheet["!cols"] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(workbook, metaSheet, "Métadonnées");

  // ============================================
  // SHEET 2: Company
  // ============================================
  const companyRows: CellValue[][] = [
    ["ENTREPRISE"],
    [],
    ["Champ", "Valeur"],
    ["Nom", data.company.name],
    ["Adresse", data.company.address],
    ["Ville", data.company.city],
    ["Téléphone", data.company.phone],
    ["Email", data.company.email],
    ["SIRET", data.company.siret],
    ["RCS", data.company.rcs || ""],
    ["Conditions de paiement", data.company.paymentTerms || ""],
    ["Mentions légales", data.company.legalNotice || ""],
  ];

  const companySheet = XLSX.utils.aoa_to_sheet(companyRows);
  companySheet["!cols"] = [{ wch: 25 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, companySheet, "Entreprise");

  // ============================================
  // SHEET 3: Client
  // ============================================
  const clientRows: CellValue[][] = [
    ["CLIENT"],
    [],
    ["Champ", "Valeur"],
    ["ID Client", data.client.id || ""],
    ["Nom", data.client.name || ""],
    ["Adresse", data.client.address || ""],
    ["Ville", data.client.city || ""],
    ["Téléphone", data.client.phone || ""],
    ["Email", data.client.email || ""],
    ["SIRET", data.client.siret || ""],
  ];

  const clientSheet = XLSX.utils.aoa_to_sheet(clientRows);
  clientSheet["!cols"] = [{ wch: 15 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(workbook, clientSheet, "Client");

  // ============================================
  // SHEET 4: Detailed Lines (Main data - flat)
  // ============================================
  const linesHeader: CellValue[] = [
    "Section N°",
    "Section",
    "Sous-section N°",
    "Sous-section",
    "Ligne N°",
    "Type",
    "Désignation",
    "Description",
    "Quantité",
    "Unité",
    "Prix Unit. HT",
    "Taux TVA %",
    "Montant TVA",
    "Total HT",
    "Total TTC",
  ];

  const linesRows: CellValue[][] = [linesHeader];

  for (const section of sections) {
    for (const subsection of section.subsections || []) {
      for (const line of subsection.lines || []) {
        const vatAmount = calculateLineVat(line);
        const totalTTC = calculateLineTTC(line);

        linesRows.push([
          section.sectionNumber || "",
          section.sectionLabel || "",
          subsection.subsectionNumber || "",
          subsection.subsectionLabel || "",
          line.lineNumber || "",
          line.lineType || "service",
          line.designation || "",
          line.description || "",
          line.quantity || 0,
          line.unit || "",
          line.unitPriceHT || 0,
          line.vatRate || 0,
          Math.round(vatAmount * 100) / 100,
          Math.round((line.totalHT || 0) * 100) / 100,
          Math.round(totalTTC * 100) / 100,
        ]);
      }
    }
  }

  const linesSheet = XLSX.utils.aoa_to_sheet(linesRows);
  linesSheet["!cols"] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 12 },
    { wch: 25 },
    { wch: 10 },
    { wch: 10 },
    { wch: 35 },
    { wch: 40 },
    { wch: 10 },
    { wch: 8 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, linesSheet, "Lignes");

  // ============================================
  // SHEET 5: Sections Summary
  // ============================================
  const sectionsHeader: CellValue[] = [
    "N°",
    "Libellé",
    "Nb Sous-sections",
    "Nb Lignes",
    "Total HT",
    "Total TVA",
    "Total TTC",
  ];

  const sectionsRows: CellValue[][] = [sectionsHeader];

  for (const section of sections) {
    const sectionVat = calculateSectionVat(section);
    const nbSubsections = (section.subsections || []).length;
    const nbLines = (section.subsections || []).reduce(
      (acc, sub) => acc + (sub.lines || []).length,
      0,
    );

    sectionsRows.push([
      section.sectionNumber || "",
      section.sectionLabel || "",
      nbSubsections,
      nbLines,
      Math.round((section.totalHT || 0) * 100) / 100,
      Math.round(sectionVat * 100) / 100,
      Math.round(((section.totalHT || 0) + sectionVat) * 100) / 100,
    ]);
  }

  const sectionsSheet = XLSX.utils.aoa_to_sheet(sectionsRows);
  sectionsSheet["!cols"] = [
    { wch: 8 },
    { wch: 35 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, sectionsSheet, "Sections");

  // ============================================
  // SHEET 6: Subsections Summary
  // ============================================
  const subsectionsHeader: CellValue[] = [
    "Section N°",
    "Section",
    "Sous-section N°",
    "Sous-section",
    "Nb Lignes",
    "Total HT",
    "Total TVA",
    "Total TTC",
  ];

  const subsectionsRows: CellValue[][] = [subsectionsHeader];

  for (const section of sections) {
    for (const subsection of section.subsections || []) {
      const subVat = calculateSubsectionVat(subsection);
      const nbLines = (subsection.lines || []).length;

      subsectionsRows.push([
        section.sectionNumber || "",
        section.sectionLabel || "",
        subsection.subsectionNumber || "",
        subsection.subsectionLabel || "",
        nbLines,
        Math.round((subsection.totalHT || 0) * 100) / 100,
        Math.round(subVat * 100) / 100,
        Math.round(((subsection.totalHT || 0) + subVat) * 100) / 100,
      ]);
    }
  }

  const subsectionsSheet = XLSX.utils.aoa_to_sheet(subsectionsRows);
  subsectionsSheet["!cols"] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 14 },
    { wch: 30 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, subsectionsSheet, "Sous-sections");

  // ============================================
  // SHEET 7: VAT Summary
  // ============================================
  const vatSummary = buildVatSummary(sections);

  const vatRows: CellValue[][] = [
    ["RÉCAPITULATIF TVA"],
    [],
    ["Taux TVA %", "Base HT", "Montant TVA"],
  ];

  let totalBaseHT = 0;
  let totalVatAmount = 0;

  for (const vat of vatSummary) {
    vatRows.push([
      vat.rate,
      Math.round(vat.baseHT * 100) / 100,
      Math.round(vat.vatAmount * 100) / 100,
    ]);
    totalBaseHT += vat.baseHT;
    totalVatAmount += vat.vatAmount;
  }

  vatRows.push([]);
  vatRows.push([
    "TOTAL",
    Math.round(totalBaseHT * 100) / 100,
    Math.round(totalVatAmount * 100) / 100,
  ]);

  const vatSheet = XLSX.utils.aoa_to_sheet(vatRows);
  vatSheet["!cols"] = [{ wch: 12 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, vatSheet, "TVA");

  // ============================================
  // SHEET 8: Totals
  // ============================================
  const totalsRows: CellValue[][] = [
    ["TOTAUX"],
    [],
    ["Libellé", "Montant"],
    ["Total HT", Math.round(data.totalHT * 100) / 100],
    ["Total TVA", Math.round(data.tvaAmount * 100) / 100],
    ["Sous-total TTC", Math.round((data.totalHT + data.tvaAmount) * 100) / 100],
  ];

  if (data.deposit > 0) {
    totalsRows.push(["Acompte versé", -Math.round(data.deposit * 100) / 100]);
  }

  totalsRows.push([]);
  totalsRows.push(["TOTAL TTC À PAYER", Math.round(data.totalTTC * 100) / 100]);

  totalsRows.push([]);
  totalsRows.push(["DÉTAIL PAR TYPE"]);
  totalsRows.push(["Type", "Total HT"]);

  const typeMap = new Map<string, number>();
  for (const section of sections) {
    for (const subsection of section.subsections || []) {
      for (const line of subsection.lines || []) {
        const type = line.lineType || "service";
        typeMap.set(type, (typeMap.get(type) || 0) + (line.totalHT || 0));
      }
    }
  }

  Array.from(typeMap.entries()).forEach(([type, amount]) => {
    const label = type === "service" ? "Main d'œuvre" : "Fournitures";
    totalsRows.push([label, Math.round(amount * 100) / 100]);
  });

  const totalsSheet = XLSX.utils.aoa_to_sheet(totalsRows);
  totalsSheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, totalsSheet, "Totaux");

  // Generate binary
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadExcel(document: DocumentData, filename?: string): void {
  const blob = generateExcel(document);
  const url = URL.createObjectURL(blob);

  const isInvoice = document.type === "invoice";
  const defaultFilename = isInvoice
    ? `Facture_${document.number}.xlsx`
    : `Devis_${document.number}.xlsx`;

  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename || defaultFilename;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
