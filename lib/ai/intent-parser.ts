import type { Client } from "@/lib/supabase/types";

export interface ParsedIntent {
  documentType: "quote" | "invoice" | null;
  clientMatch: Client | null;
  projectTitle: string | null;
  hasDocumentType: boolean;
  hasClient: boolean;
}

const QUOTE_KEYWORDS = [
  "devis",
  "estimation",
  "chiffrage",
  "cotation",
  "proposer",
  "estimer",
];

const INVOICE_KEYWORDS = ["facture", "facturer", "facturation", "note", "reçu"];

export function parseUserIntent(
  message: string,
  clients: Client[],
): ParsedIntent {
  const normalizedMessage = message.toLowerCase().trim();

  const documentType = detectDocumentType(normalizedMessage);
  const clientMatch = findClientInMessage(normalizedMessage, clients);
  const projectTitle = extractProjectTitle(normalizedMessage);

  return {
    documentType,
    clientMatch,
    projectTitle,
    hasDocumentType: documentType !== null,
    hasClient: clientMatch !== null,
  };
}

function detectDocumentType(message: string): "quote" | "invoice" | null {
  const hasQuoteKeyword = QUOTE_KEYWORDS.some((keyword) =>
    message.includes(keyword),
  );
  const hasInvoiceKeyword = INVOICE_KEYWORDS.some((keyword) =>
    message.includes(keyword),
  );

  if (hasInvoiceKeyword && !hasQuoteKeyword) {
    return "invoice";
  }
  if (hasQuoteKeyword && !hasInvoiceKeyword) {
    return "quote";
  }
  if (hasQuoteKeyword && hasInvoiceKeyword) {
    const quoteIndex = Math.min(
      ...QUOTE_KEYWORDS.map((k) =>
        message.includes(k) ? message.indexOf(k) : Infinity,
      ),
    );
    const invoiceIndex = Math.min(
      ...INVOICE_KEYWORDS.map((k) =>
        message.includes(k) ? message.indexOf(k) : Infinity,
      ),
    );
    return invoiceIndex < quoteIndex ? "invoice" : "quote";
  }

  return null;
}

function findClientInMessage(
  message: string,
  clients: Client[],
): Client | null {
  if (clients.length === 0) return null;

  const clientPatterns = [
    /pour\s+(?:le\s+client\s+)?(?:monsieur|madame|m\.|mme\.?)?\s*([a-zàâäéèêëïîôùûüç\-]+(?:\s+[a-zàâäéèêëïîôùûüç\-]+)?)/i,
    /client\s*:?\s*([a-zàâäéèêëïîôùûüç\-]+(?:\s+[a-zàâäéèêëïîôùûüç\-]+)?)/i,
    /chez\s+(?:monsieur|madame|m\.|mme\.?)?\s*([a-zàâäéèêëïîôùûüç\-]+(?:\s+[a-zàâäéèêëïîôùûüç\-]+)?)/i,
    /de\s+(?:monsieur|madame|m\.|mme\.?)?\s*([a-zàâäéèêëïîôùûüç\-]+(?:\s+[a-zàâäéèêëïîôùûüç\-]+)?)/i,
  ];

  for (const pattern of clientPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const extractedName = match[1].trim().toLowerCase();
      const client = matchClientByName(extractedName, clients);
      if (client) return client;
    }
  }

  for (const client of clients) {
    const fullName = [client.first_name, client.last_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const lastName = (client.last_name || "").toLowerCase();
    const firstName = (client.first_name || "").toLowerCase();

    if (fullName && message.includes(fullName)) {
      return client;
    }
    if (lastName && lastName.length > 2 && message.includes(lastName)) {
      return client;
    }
    if (firstName && firstName.length > 3 && message.includes(firstName)) {
      const words = message.split(/\s+/);
      if (words.some((w) => w === firstName)) {
        return client;
      }
    }
  }

  return null;
}

function matchClientByName(name: string, clients: Client[]): Client | null {
  for (const client of clients) {
    const fullName = [client.first_name, client.last_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const lastName = (client.last_name || "").toLowerCase();
    const firstName = (client.first_name || "").toLowerCase();

    if (fullName === name || lastName === name || firstName === name) {
      return client;
    }
    if (fullName.includes(name) || name.includes(fullName)) {
      return client;
    }
    if (lastName && name.includes(lastName)) {
      return client;
    }
  }

  return null;
}

function extractProjectTitle(message: string): string | null {
  const projectPatterns = [
    /(?:projet|chantier|travaux)\s*:?\s*([^,.\n]+)/i,
    /(?:pour|concernant)\s+(?:le\s+)?(?:projet|chantier|travaux)\s+(?:de\s+)?([^,.\n]+)/i,
    /objet\s*:?\s*([^,.\n]+)/i,
  ];

  for (const pattern of projectPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      if (title.length > 3 && title.length < 100) {
        return title.charAt(0).toUpperCase() + title.slice(1);
      }
    }
  }

  return null;
}
