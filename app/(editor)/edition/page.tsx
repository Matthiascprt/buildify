import {
  getProfile,
  getCompany,
  getClients,
  getNextQuoteNumber,
  getNextInvoiceNumber,
  getQuote,
  getInvoice,
} from "@/lib/supabase/api";
import { EditionClient } from "./edition-client";
import type {
  DocumentData,
  QuoteData,
  InvoiceData,
} from "@/lib/types/document";

interface EditionPageProps {
  searchParams: Promise<{ id?: string; type?: string }>;
}

export default async function EditionPage({ searchParams }: EditionPageProps) {
  const params = await searchParams;
  const [profile, company, clients, nextQuoteNumber, nextInvoiceNumber] =
    await Promise.all([
      getProfile(),
      getCompany(),
      getClients(),
      getNextQuoteNumber(),
      getNextInvoiceNumber(),
    ]);

  const userInitial = profile?.last_name?.charAt(0).toUpperCase() || "U";

  let initialDocument: DocumentData | null = null;

  if (params.id && params.type) {
    const documentId = parseInt(params.id, 10);

    if (!isNaN(documentId)) {
      if (params.type === "quote") {
        const quote = await getQuote(documentId);
        if (quote && quote.content) {
          const content = quote.content as unknown as QuoteData;
          initialDocument = {
            ...content,
            type: "quote",
            id: quote.id,
            number: quote.quote_number || content.number || "",
          };
        }
      } else if (params.type === "invoice") {
        const invoice = await getInvoice(documentId);
        if (invoice && invoice.content) {
          const content = invoice.content as unknown as InvoiceData;
          initialDocument = {
            ...content,
            type: "invoice",
            id: invoice.id,
            number: invoice.invoice_number || content.number || "",
          };
        }
      }
    }
  }

  return (
    <EditionClient
      userInitial={userInitial}
      company={company}
      clients={clients}
      initialNextQuoteNumber={nextQuoteNumber}
      initialNextInvoiceNumber={nextInvoiceNumber}
      initialDocument={initialDocument}
    />
  );
}
