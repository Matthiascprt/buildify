import {
  getProfile,
  getCompany,
  getClients,
  getNextQuoteNumber,
  getNextInvoiceNumber,
  getQuoteWithClient,
  getInvoiceWithClient,
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
  let initialAccentColor: string | null = null;

  if (params.id && params.type) {
    const documentId = parseInt(params.id, 10);

    if (!isNaN(documentId)) {
      if (params.type === "quote") {
        const quote = await getQuoteWithClient(documentId);
        if (quote && quote.content) {
          const content = quote.content as unknown as QuoteData;
          // Use client data from DB relation if available
          const clientFromDb = quote.clients;
          const clientData = clientFromDb
            ? {
                id: clientFromDb.id,
                name: [clientFromDb.first_name, clientFromDb.last_name]
                  .filter(Boolean)
                  .join(" "),
                address: "",
                city: "",
                phone: clientFromDb.phone || "",
                email: clientFromDb.email || "",
              }
            : content.client;

          initialDocument = {
            ...content,
            type: "quote",
            id: quote.id,
            number: quote.quote_number || content.number || "",
            client: clientData,
            company: {
              ...content.company,
              // Always use current company data for protected fields (even if null)
              logoUrl: company?.logo_url ?? undefined,
              paymentTerms: company?.payment_terms ?? undefined,
              legalNotice: company?.legal_notice ?? undefined,
            },
          };
          initialAccentColor = quote.color || null;
        }
      } else if (params.type === "invoice") {
        const invoice = await getInvoiceWithClient(documentId);
        if (invoice && invoice.content) {
          const content = invoice.content as unknown as InvoiceData;
          // Use client data from DB relation if available
          const clientFromDb = invoice.clients;
          const clientData = clientFromDb
            ? {
                id: clientFromDb.id,
                name: [clientFromDb.first_name, clientFromDb.last_name]
                  .filter(Boolean)
                  .join(" "),
                address: "",
                city: "",
                phone: clientFromDb.phone || "",
                email: clientFromDb.email || "",
              }
            : content.client;

          initialDocument = {
            ...content,
            type: "invoice",
            id: invoice.id,
            number: invoice.invoice_number || content.number || "",
            client: clientData,
            company: {
              ...content.company,
              // Always use current company data for protected fields (even if null)
              logoUrl: company?.logo_url ?? undefined,
              paymentTerms: company?.payment_terms ?? undefined,
              legalNotice: company?.legal_notice ?? undefined,
            },
          };
          initialAccentColor = invoice.color || null;
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
      initialAccentColor={initialAccentColor}
    />
  );
}
