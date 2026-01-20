/**
 * Factur-X XML Generator
 * Generates XML conforming to EN 16931 standard (Cross Industry Invoice - CII format)
 * Profile: MINIMUM or BASIC
 */

import type {
  Section,
  DocumentCompany,
  DocumentClient,
} from "@/lib/types/document";

// Interface simplifiée pour les données de facture nécessaires à Factur-X
interface FacturXInvoiceData {
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
}

interface FacturXOptions {
  profile?: "MINIMUM" | "BASIC" | "EN16931";
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(dateString: string): string {
  // Convert "12/01/2025" or "2025-01-12" to "20250112"
  const parts = dateString.includes("/")
    ? dateString.split("/").reverse()
    : dateString.split("-");

  if (parts.length === 3) {
    const [year, month, day] = dateString.includes("/")
      ? [parts[0], parts[1], parts[2]]
      : parts;
    return `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`;
  }
  return dateString.replace(/[/-]/g, "");
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function generateLineItems(sections: Section[]): string {
  let lineNumber = 1;
  let xml = "";

  for (const section of sections) {
    for (const subsection of section.subsections) {
      for (const line of subsection.lines) {
        xml += `
        <ram:IncludedSupplyChainTradeLineItem>
            <ram:AssociatedDocumentLineDocument>
                <ram:LineID>${lineNumber}</ram:LineID>
            </ram:AssociatedDocumentLineDocument>
            <ram:SpecifiedTradeProduct>
                <ram:Name>${escapeXml(line.designation)}</ram:Name>
            </ram:SpecifiedTradeProduct>
            <ram:SpecifiedLineTradeAgreement>
                <ram:NetPriceProductTradePrice>
                    <ram:ChargeAmount>${formatAmount(line.unitPriceHT)}</ram:ChargeAmount>
                </ram:NetPriceProductTradePrice>
            </ram:SpecifiedLineTradeAgreement>
            <ram:SpecifiedLineTradeDelivery>
                <ram:BilledQuantity unitCode="C62">${line.quantity}</ram:BilledQuantity>
            </ram:SpecifiedLineTradeDelivery>
            <ram:SpecifiedLineTradeSettlement>
                <ram:ApplicableTradeTax>
                    <ram:TypeCode>VAT</ram:TypeCode>
                    <ram:CategoryCode>S</ram:CategoryCode>
                    <ram:RateApplicablePercent>${line.vatRate}</ram:RateApplicablePercent>
                </ram:ApplicableTradeTax>
                <ram:SpecifiedTradeSettlementLineMonetarySummation>
                    <ram:LineTotalAmount>${formatAmount(line.totalHT)}</ram:LineTotalAmount>
                </ram:SpecifiedTradeSettlementLineMonetarySummation>
            </ram:SpecifiedLineTradeSettlement>
        </ram:IncludedSupplyChainTradeLineItem>`;
        lineNumber++;
      }
    }
  }

  return xml;
}

export function generateFacturXXml(
  invoice: FacturXInvoiceData,
  options: FacturXOptions = {},
): string {
  const { profile = "BASIC" } = options;

  const invoiceDate = formatDate(invoice.date);
  const dueDate = formatDate(invoice.dueDate);

  // Generate unique ID based on invoice number and timestamp
  const documentId = invoice.number.replace(/[^a-zA-Z0-9]/g, "-");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

    <rsm:ExchangedDocumentContext>
        <ram:GuidelineSpecifiedDocumentContextParameter>
            <ram:ID>urn:factur-x.eu:1p0:${profile.toLowerCase()}</ram:ID>
        </ram:GuidelineSpecifiedDocumentContextParameter>
    </rsm:ExchangedDocumentContext>

    <rsm:ExchangedDocument>
        <ram:ID>${escapeXml(documentId)}</ram:ID>
        <ram:TypeCode>380</ram:TypeCode>
        <ram:IssueDateTime>
            <udt:DateTimeString format="102">${invoiceDate}</udt:DateTimeString>
        </ram:IssueDateTime>
    </rsm:ExchangedDocument>

    <rsm:SupplyChainTradeTransaction>
        <ram:ApplicableHeaderTradeAgreement>
            <ram:SellerTradeParty>
                <ram:Name>${escapeXml(invoice.company.name)}</ram:Name>
                ${
                  invoice.company.phone
                    ? `<ram:DefinedTradeContact>
                    <ram:TelephoneUniversalCommunication>
                        <ram:CompleteNumber>${escapeXml(invoice.company.phone)}</ram:CompleteNumber>
                    </ram:TelephoneUniversalCommunication>
                </ram:DefinedTradeContact>`
                    : ""
                }
                <ram:PostalTradeAddress>
                    <ram:LineOne>${escapeXml(invoice.company.address)}</ram:LineOne>
                    <ram:CityName>${escapeXml(invoice.company.city.split(" ").slice(1).join(" ") || invoice.company.city)}</ram:CityName>
                    <ram:PostcodeCode>${escapeXml(invoice.company.city.split(" ")[0] || "")}</ram:PostcodeCode>
                    <ram:CountryID>FR</ram:CountryID>
                </ram:PostalTradeAddress>
                ${
                  invoice.company.email
                    ? `<ram:URIUniversalCommunication>
                    <ram:URIID schemeID="EM">${escapeXml(invoice.company.email)}</ram:URIID>
                </ram:URIUniversalCommunication>`
                    : ""
                }
                ${
                  invoice.company.siret
                    ? `<ram:SpecifiedLegalOrganization>
                    <ram:ID schemeID="0002">${escapeXml(invoice.company.siret)}</ram:ID>
                </ram:SpecifiedLegalOrganization>`
                    : ""
                }
            </ram:SellerTradeParty>

            <ram:BuyerTradeParty>
                <ram:Name>${escapeXml(invoice.client.name || "Client")}</ram:Name>
                ${
                  invoice.client.phone
                    ? `<ram:DefinedTradeContact>
                    <ram:TelephoneUniversalCommunication>
                        <ram:CompleteNumber>${escapeXml(invoice.client.phone)}</ram:CompleteNumber>
                    </ram:TelephoneUniversalCommunication>
                </ram:DefinedTradeContact>`
                    : ""
                }
                <ram:PostalTradeAddress>
                    <ram:LineOne>${escapeXml(invoice.client.address || "")}</ram:LineOne>
                    <ram:CityName>${escapeXml(invoice.client.city?.split(" ").slice(1).join(" ") || invoice.client.city || "")}</ram:CityName>
                    <ram:PostcodeCode>${escapeXml(invoice.client.city?.split(" ")[0] || "")}</ram:PostcodeCode>
                    <ram:CountryID>FR</ram:CountryID>
                </ram:PostalTradeAddress>
                ${
                  invoice.client.email
                    ? `<ram:URIUniversalCommunication>
                    <ram:URIID schemeID="EM">${escapeXml(invoice.client.email)}</ram:URIID>
                </ram:URIUniversalCommunication>`
                    : ""
                }
                ${
                  invoice.client.siret
                    ? `<ram:SpecifiedLegalOrganization>
                    <ram:ID schemeID="0002">${escapeXml(invoice.client.siret)}</ram:ID>
                </ram:SpecifiedLegalOrganization>`
                    : ""
                }
            </ram:BuyerTradeParty>
        </ram:ApplicableHeaderTradeAgreement>

        <ram:ApplicableHeaderTradeDelivery/>

        <ram:ApplicableHeaderTradeSettlement>
            <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>

            <ram:SpecifiedTradePaymentTerms>
                <ram:Description>${escapeXml(invoice.paymentConditions || "Paiement à réception")}</ram:Description>
                <ram:DueDateDateTime>
                    <udt:DateTimeString format="102">${dueDate}</udt:DateTimeString>
                </ram:DueDateDateTime>
            </ram:SpecifiedTradePaymentTerms>

            <ram:ApplicableTradeTax>
                <ram:CalculatedAmount>${formatAmount(invoice.tvaAmount)}</ram:CalculatedAmount>
                <ram:TypeCode>VAT</ram:TypeCode>
                <ram:BasisAmount>${formatAmount(invoice.totalHT)}</ram:BasisAmount>
                <ram:CategoryCode>S</ram:CategoryCode>
                <ram:RateApplicablePercent>${invoice.tvaRate}</ram:RateApplicablePercent>
            </ram:ApplicableTradeTax>

            <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
                <ram:LineTotalAmount>${formatAmount(invoice.totalHT)}</ram:LineTotalAmount>
                <ram:TaxBasisTotalAmount>${formatAmount(invoice.totalHT)}</ram:TaxBasisTotalAmount>
                <ram:TaxTotalAmount currencyID="EUR">${formatAmount(invoice.tvaAmount)}</ram:TaxTotalAmount>
                <ram:GrandTotalAmount>${formatAmount(invoice.totalTTC)}</ram:GrandTotalAmount>
                ${invoice.deposit > 0 ? `<ram:TotalPrepaidAmount>${formatAmount(invoice.deposit)}</ram:TotalPrepaidAmount>` : ""}
                <ram:DuePayableAmount>${formatAmount(invoice.totalTTC - (invoice.deposit || 0))}</ram:DuePayableAmount>
            </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        </ram:ApplicableHeaderTradeSettlement>
        ${generateLineItems(invoice.sections)}
    </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

  return xml;
}

export function downloadXml(
  invoice: FacturXInvoiceData,
  filename?: string,
): void {
  const xml = generateFacturXXml(invoice);
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `Facture_${invoice.number}_facturx.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
