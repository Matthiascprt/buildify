"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Section } from "@/lib/types/document";

// Fonction pour éclaircir une couleur hex
const lightenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(
    255,
    Math.floor((num >> 16) + (255 - (num >> 16)) * percent),
  );
  const g = Math.min(
    255,
    Math.floor(((num >> 8) & 0x00ff) + (255 - ((num >> 8) & 0x00ff)) * percent),
  );
  const b = Math.min(
    255,
    Math.floor((num & 0x0000ff) + (255 - (num & 0x0000ff)) * percent),
  );
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

const colors = {
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5e5e5",
  white: "#ffffff",
  background: "#f5f5f5",
};

const createStyles = (themeColor: string) => {
  const lighterColor = lightenColor(themeColor, 0.3);
  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      padding: 40,
      paddingBottom: 60,
      color: colors.text,
      backgroundColor: colors.white,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 30,
    },
    headerNoLogo: {
      marginBottom: 30,
    },
    logo: {
      height: 50,
    },
    logoPlaceholder: {
      width: 100,
      height: 50,
    },
    headerRight: {
      textAlign: "right",
    },
    title: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 9,
      color: colors.textMuted,
    },
    infoSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 25,
    },
    infoBlock: {
      width: "48%",
    },
    infoTitle: {
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 9,
      color: colors.textMuted,
      marginBottom: 4,
    },
    projectTitle: {
      fontSize: 14,
      fontWeight: 700,
      marginBottom: 15,
    },
    table: {
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: "row",
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableHeaderCell: {
      fontSize: 8,
      fontWeight: 700,
      color: "#000000",
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: "#e0e0e0",
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    tableSectionRow: {
      flexDirection: "row",
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderBottomWidth: 2,
      borderBottomColor: themeColor,
    },
    tableSubsectionRow: {
      flexDirection: "row",
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: lighterColor,
    },
    colId: { width: "8%" },
    colDesignation: { width: "38%" },
    colQuantity: { width: "12%", textAlign: "center" },
    colUnitPrice: { width: "14%", textAlign: "center" },
    colTva: { width: "10%", textAlign: "center" },
    colTotal: { width: "18%", textAlign: "right" },
    cellText: {
      fontSize: 9,
    },
    cellTextBold: {
      fontSize: 9,
      fontWeight: 700,
    },
    cellTextAccent: {
      fontSize: 9,
      fontWeight: 700,
      color: themeColor,
    },
    cellTextSubsection: {
      fontSize: 9,
      fontWeight: 600,
      color: lighterColor,
    },
    cellTextMuted: {
      fontSize: 8,
      color: colors.textMuted,
      marginTop: 2,
    },
    totalsSection: {
      alignItems: "flex-end",
      marginBottom: 30,
    },
    totalsBox: {
      width: 180,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    totalLabel: {
      fontSize: 9,
      color: colors.textMuted,
    },
    totalValue: {
      fontSize: 9,
    },
    totalRowFinal: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 6,
      marginTop: 4,
    },
    totalLabelBold: {
      fontSize: 10,
      fontWeight: 700,
    },
    totalValueBold: {
      fontSize: 10,
      fontWeight: 700,
    },
    footerSection: {
      marginTop: 30,
    },
    footerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    paymentConditions: {
      width: "55%",
    },
    signature: {
      width: "40%",
      textAlign: "right",
    },
    footerTitle: {
      fontSize: 10,
      fontWeight: 700,
      marginBottom: 6,
    },
    footerText: {
      fontSize: 8,
      color: colors.textMuted,
      lineHeight: 1.4,
    },
    signatureText: {
      fontSize: 9,
      marginBottom: 4,
    },
    signatureTextMuted: {
      fontSize: 9,
      color: colors.textMuted,
      marginBottom: 25,
    },
    signatureLine: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      width: 150,
      height: 60,
      marginLeft: "auto",
    },
    signatureImage: {
      width: 150,
      height: 70,
      marginLeft: "auto",
      objectFit: "contain" as const,
    },
    legalNotice: {
      textAlign: "center",
      fontSize: 8,
      color: colors.textMuted,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    pageNumber: {
      position: "absolute",
      bottom: 20,
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 8,
      color: colors.textMuted,
    },
  });
};

const formatPrice = (value: number | undefined): string => {
  if (value === undefined || value === null) return "0,00";
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

interface QuoteData {
  number: string;
  date: string;
  validity: string;
  company: {
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
  };
  client: {
    name?: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    siret?: string;
  };
  projectTitle: string;
  sections: Section[];
  totalHT: number;
  tvaRate: number;
  tvaAmount: number;
  deposit: number;
  totalTTC: number;
  paymentConditions: string;
  signature?: string;
}

interface QuotePDFTemplateProps {
  data: QuoteData;
  accentColor?: string | null;
  signature?: string;
}

export function QuotePDFTemplate({
  data,
  accentColor,
  signature,
}: QuotePDFTemplateProps) {
  const themeColor = accentColor || "#000000";
  const styles = createStyles(themeColor);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {data.company.logoUrl ? (
          <View style={styles.header}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={data.company.logoUrl} style={styles.logo} />
            <View style={styles.headerRight}>
              <Text style={styles.title}>Devis n° {data.number}</Text>
              <Text style={styles.subtitle}>Réalisé le {data.date}</Text>
              <Text style={styles.subtitle}>
                Valable jusqu&apos;au {data.validity}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.headerNoLogo}>
            <Text style={styles.title}>Devis n° {data.number}</Text>
            <Text style={styles.subtitle}>Réalisé le {data.date}</Text>
            <Text style={styles.subtitle}>
              Valable jusqu&apos;au {data.validity}
            </Text>
          </View>
        )}

        {/* Company and Client Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{data.company.name}</Text>
            <Text style={styles.infoText}>{data.company.address}</Text>
            <Text style={styles.infoText}>{data.company.city}</Text>
            <Text style={styles.infoText}>{data.company.phone}</Text>
            <Text style={styles.infoText}>{data.company.email}</Text>
            <Text style={styles.infoText}>SIRET: {data.company.siret}</Text>
            {data.company.rcs && (
              <Text style={styles.infoText}>RCS: {data.company.rcs}</Text>
            )}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{data.client.name || "Client"}</Text>
            <Text style={styles.infoText}>{data.client.address}</Text>
            <Text style={styles.infoText}>{data.client.city}</Text>
            <Text style={styles.infoText}>{data.client.phone}</Text>
            <Text style={styles.infoText}>{data.client.email}</Text>
            {data.client.siret && (
              <Text style={styles.infoText}>SIRET: {data.client.siret}</Text>
            )}
          </View>
        </View>

        {/* Project Title */}
        <Text style={styles.projectTitle}>{data.projectTitle}</Text>

        {/* Items Table - Hierarchical Structure */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeaderCell, styles.colId]}>N°</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesignation]}>
              Désignation
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>
              Qté
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colUnitPrice]}>
              Prix U.
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTva]}>TVA</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>
              Total HT
            </Text>
          </View>

          {data.sections.map((section) => (
            <View key={section.sectionId}>
              {/* Section Row */}
              <View style={styles.tableSectionRow} wrap={false}>
                <Text style={[styles.cellTextAccent, styles.colId]}>
                  {section.sectionNumber}
                </Text>
                <Text style={[styles.cellTextAccent, { width: "74%" }]}>
                  {section.sectionLabel}
                </Text>
                <Text style={[styles.cellTextAccent, styles.colTotal]}>
                  {formatPrice(section.totalHT)} €
                </Text>
              </View>

              {/* Subsections */}
              {section.subsections.map((subsection) => (
                <View key={subsection.subsectionId}>
                  {/* Subsection Row */}
                  <View style={styles.tableSubsectionRow} wrap={false}>
                    <Text style={[styles.cellTextSubsection, styles.colId]}>
                      {subsection.subsectionNumber}
                    </Text>
                    <Text style={[styles.cellTextSubsection, { width: "74%" }]}>
                      {subsection.subsectionLabel}
                    </Text>
                    <Text style={[styles.cellTextSubsection, styles.colTotal]}>
                      {formatPrice(subsection.totalHT)} €
                    </Text>
                  </View>

                  {/* Lines */}
                  {subsection.lines.map((line) => (
                    <View
                      key={line.lineId}
                      style={styles.tableRow}
                      wrap={false}
                    >
                      <Text style={[styles.cellText, styles.colId]}>
                        {line.lineNumber}
                      </Text>
                      <View style={styles.colDesignation}>
                        <Text style={styles.cellText}>{line.designation}</Text>
                        {line.description && (
                          <Text style={styles.cellTextMuted}>
                            {line.description}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.cellText, styles.colQuantity]}>
                        {line.quantity}
                        {line.unit ? ` ${line.unit}` : ""}
                      </Text>
                      <Text style={[styles.cellText, styles.colUnitPrice]}>
                        {formatPrice(line.unitPriceHT)} €
                      </Text>
                      <Text style={[styles.cellText, styles.colTva]}>
                        {line.vatRate}%
                      </Text>
                      <Text style={[styles.cellTextBold, styles.colTotal]}>
                        {formatPrice(line.totalHT)} €
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Totals - wrap={false} keeps all totals together on same page */}
        <View style={styles.totalsSection} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>
                {formatPrice(data.totalHT)} €
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total TVA</Text>
              <Text style={styles.totalValue}>
                {formatPrice(data.tvaAmount)} €
              </Text>
            </View>
            {data.deposit > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Acompte versé</Text>
                <Text style={styles.totalValue}>
                  -{formatPrice(data.deposit)} €
                </Text>
              </View>
            )}
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelBold}>Total TTC</Text>
              <Text style={styles.totalValueBold}>
                {formatPrice(data.totalTTC)} €
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <View style={styles.footerContent}>
            <View style={styles.paymentConditions}>
              <Text style={styles.footerTitle}>Conditions de paiement</Text>
              <Text style={styles.footerText}>
                {data.company.paymentTerms ||
                  data.paymentConditions ||
                  "Aucune"}
              </Text>
            </View>
            <View style={styles.signature}>
              <Text style={styles.signatureText}>Lu et approuvé</Text>
              <Text style={styles.signatureTextMuted}>Le : {data.date}</Text>
              <Text style={styles.signatureTextMuted}>Signature :</Text>
              {signature ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={signature} style={styles.signatureImage} />
              ) : (
                <View style={styles.signatureLine} />
              )}
            </View>
          </View>
          <Text style={styles.legalNotice}>
            {data.company.legalNotice || "Aucune mention légale"}
          </Text>
        </View>

        {/* Page number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
