"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const colors = {
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5e5e5",
  white: "#ffffff",
  background: "#f5f5f5",
};

// Calcule la luminosité relative d'une couleur (WCAG)
function getLuminance(hex: string): number {
  const rgb = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((x) => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }) || [0, 0, 0];
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

// Détermine si le texte doit être blanc ou noir pour un bon contraste
function getContrastColor(bgColor: string): string {
  const luminance = getLuminance(bgColor);
  return luminance > 0.4 ? "#1f2937" : "#ffffff";
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    paddingBottom: 100,
    color: colors.text,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
  },
  logo: {
    height: 50,
  },
  logoPlaceholder: {
    width: 100,
    height: 50,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textMuted,
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
    marginBottom: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
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
    backgroundColor: colors.background,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.textMuted,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableSectionRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#fafafa",
  },
  colId: { width: "6%" },
  colDesignation: { width: "40%" },
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
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
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
    width: 120,
    marginLeft: "auto",
  },
  signatureImage: {
    width: 120,
    height: 50,
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
});

const formatPrice = (value: number | undefined): string => {
  if (value === undefined || value === null) return "0.00";
  return value.toFixed(2);
};

interface LineItem {
  lineId: string;
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
  items: LineItem[];
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
  const hasCustomColor = accentColor !== null && accentColor !== undefined;
  const bgColor = hasCustomColor ? accentColor : "#f5f5f5";
  const textColor = hasCustomColor ? getContrastColor(accentColor) : "#666666";
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.company.logoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={data.company.logoUrl} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>LOGO</Text>
            </View>
          )}
          <View style={styles.headerRight}>
            <Text style={styles.title}>Devis n° {data.number}</Text>
            <Text style={styles.subtitle}>Réalisé le {data.date}</Text>
            <Text style={styles.subtitle}>Valable {data.validity}</Text>
          </View>
        </View>

        {/* Company and Client Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{data.company.name}</Text>
            <Text style={styles.infoText}>{data.company.address}</Text>
            <Text style={styles.infoText}>{data.company.city}</Text>
            <Text style={styles.infoText}>{data.company.phone}</Text>
            <Text style={styles.infoText}>{data.company.email}</Text>
            <Text style={styles.infoText}>SIRET: {data.company.siret}</Text>
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

        {/* Items Table */}
        <View style={styles.table}>
          <View style={[styles.tableHeader, { backgroundColor: bgColor }]}>
            <Text
              style={[
                styles.tableHeaderCell,
                styles.colId,
                { color: textColor },
              ]}
            >
              #
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                styles.colDesignation,
                { color: textColor },
              ]}
            >
              Désignation
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                styles.colQuantity,
                { color: textColor },
              ]}
            >
              Quantité
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                styles.colUnitPrice,
                { color: textColor },
              ]}
            >
              Prix unit. HT
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                styles.colTva,
                { color: textColor },
              ]}
            >
              TVA
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                styles.colTotal,
                { color: textColor },
              ]}
            >
              Total TTC
            </Text>
          </View>
          {data.items.map((item) => (
            <View
              key={item.lineId}
              style={item.isSection ? styles.tableSectionRow : styles.tableRow}
            >
              <Text
                style={[
                  item.isSection ? styles.cellTextBold : styles.cellText,
                  styles.colId,
                ]}
              >
                {item.id}
              </Text>
              <View style={styles.colDesignation}>
                <Text
                  style={item.isSection ? styles.cellTextBold : styles.cellText}
                >
                  {item.designation}
                </Text>
                {!item.isSection && item.description && (
                  <Text style={styles.cellTextMuted}>{item.description}</Text>
                )}
              </View>
              <Text style={[styles.cellText, styles.colQuantity]}>
                {item.isSection ? "" : item.quantity}
              </Text>
              <Text style={[styles.cellText, styles.colUnitPrice]}>
                {item.isSection ? "" : `${formatPrice(item.unitPrice)} €`}
              </Text>
              <Text style={[styles.cellText, styles.colTva]}>
                {item.isSection ? "" : `${item.tva}%`}
              </Text>
              <Text
                style={[
                  item.isSection ? styles.cellTextBold : styles.cellText,
                  styles.colTotal,
                ]}
              >
                {item.isSection
                  ? `${formatPrice(item.sectionTotalTTC ?? item.sectionTotal)} €`
                  : `${formatPrice((item.total || 0) * (1 + (item.tva || 0) / 100))} €`}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
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

        {/* Footer - Fixed at bottom */}
        <View style={styles.footerSection} fixed>
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
      </Page>
    </Document>
  );
}
