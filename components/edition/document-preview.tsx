import { FileText } from "lucide-react";
import { QuoteTemplate } from "./quote-template";
import { InvoiceTemplate } from "./invoice-template";
import type {
  DocumentData,
  QuoteData,
  InvoiceData,
} from "@/lib/types/document";

interface DocumentPreviewProps {
  document: DocumentData | null;
}

function mapToQuoteTemplateData(doc: QuoteData) {
  return {
    number: doc.number,
    date: doc.date,
    validity: doc.validity,
    company: {
      name: doc.company.name,
      address: doc.company.address,
      city: doc.company.city,
      phone: doc.company.phone,
      email: doc.company.email,
      siret: doc.company.siret,
    },
    client: {
      name: doc.client.name,
      address: doc.client.address,
      city: doc.client.city,
      phone: doc.client.phone,
      email: doc.client.email,
      siret: doc.client.siret,
    },
    projectTitle: doc.projectTitle,
    items: doc.items,
    totalHT: doc.totalHT,
    tvaRate: doc.tvaRate,
    tvaAmount: doc.tvaAmount,
    deposit: doc.deposit,
    totalTTC: doc.totalTTC,
    paymentConditions: doc.paymentConditions,
  };
}

function mapToInvoiceTemplateData(doc: InvoiceData) {
  return {
    number: doc.number,
    date: doc.date,
    dueDate: doc.dueDate,
    company: {
      name: doc.company.name,
      address: doc.company.address,
      city: doc.company.city,
      phone: doc.company.phone,
      email: doc.company.email,
      siret: doc.company.siret,
    },
    client: {
      name: doc.client.name,
      address: doc.client.address,
      city: doc.client.city,
      phone: doc.client.phone,
      email: doc.client.email,
      siret: doc.client.siret,
    },
    projectTitle: doc.projectTitle,
    items: doc.items,
    totalHT: doc.totalHT,
    tvaRate: doc.tvaRate,
    tvaAmount: doc.tvaAmount,
    deposit: doc.deposit,
    totalTTC: doc.totalTTC,
    paymentConditions: doc.paymentConditions,
  };
}

export function DocumentPreview({ document }: DocumentPreviewProps) {
  const getDescription = () => {
    if (!document) {
      return "Votre devis ou facture apparaîtra ici";
    }
    if (document.type === "quote") {
      return `Aperçu du devis n°${document.number}`;
    }
    return `Aperçu de la facture n°${document.number}`;
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="border-b px-4 py-3 shrink-0">
        <h2 className="font-semibold">Aperçu du document</h2>
        <p className="text-sm text-muted-foreground">{getDescription()}</p>
      </div>

      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0 overflow-y-auto">
          <div className="flex items-center justify-center p-4">
            {document === null ? (
              <div className="flex aspect-[210/297] w-full max-w-md flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background">
                <FileText className="h-16 w-16 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  Document A4
                </p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  Le contenu généré apparaîtra ici
                </p>
              </div>
            ) : document.type === "quote" ? (
              <div className="w-full max-w-2xl rounded-lg border bg-background shadow-sm">
                <QuoteTemplate data={mapToQuoteTemplateData(document)} />
              </div>
            ) : (
              <div className="w-full max-w-2xl rounded-lg border bg-background shadow-sm">
                <InvoiceTemplate data={mapToInvoiceTemplateData(document)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
