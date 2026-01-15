import {
  getProfile,
  getCompany,
  getClients,
  getQuote,
  getInvoice,
  getNextQuoteNumber,
  getNextInvoiceNumber,
  getClient,
} from "@/lib/supabase/api";
import { EditionClient } from "./edition-client";
import type { DocumentData } from "@/lib/types/document";
import {
  quoteToDocumentData,
  invoiceToDocumentData,
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
  let initialAccentColor: string | null = null;

  // Load existing document if id and type are provided
  if (params.id && params.type && company) {
    if (params.type === "quote") {
      const quote = await getQuote(params.id);
      if (quote) {
        const client = quote.client_id
          ? await getClient(quote.client_id)
          : null;
        initialDocument = quoteToDocumentData(quote, company, client);
        initialAccentColor = quote.color;
      }
    } else if (params.type === "invoice") {
      const invoice = await getInvoice(params.id);
      if (invoice) {
        const client = invoice.client_id
          ? await getClient(invoice.client_id)
          : null;
        initialDocument = invoiceToDocumentData(invoice, company, client);
        initialAccentColor = invoice.color;
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
      initialAccentColor={initialAccentColor}
    />
  );
}
