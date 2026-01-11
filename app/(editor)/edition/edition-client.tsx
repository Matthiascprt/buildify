"use client";

import { useState } from "react";
import { Chat } from "@/components/edition/chat";
import { DocumentPreview } from "@/components/edition/document-preview";
import type { DocumentData } from "@/lib/types/document";
import type { Company, Client } from "@/lib/supabase/types";

interface EditionClientProps {
  userInitial: string;
  company: Company | null;
  clients: Client[];
}

function generateDocumentNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${random}`;
}

export function EditionClient({
  userInitial,
  company,
  clients,
}: EditionClientProps) {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [nextQuoteNumber, setNextQuoteNumber] = useState(() =>
    generateDocumentNumber("DEV"),
  );
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(() =>
    generateDocumentNumber("FAC"),
  );

  const handleDocumentChange = (newDocument: DocumentData | null) => {
    setDocument(newDocument);
    if (newDocument?.type === "quote") {
      setNextQuoteNumber(generateDocumentNumber("DEV"));
    } else if (newDocument?.type === "invoice") {
      setNextInvoiceNumber(generateDocumentNumber("FAC"));
    }
  };

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-2 overflow-hidden">
      <div className="border-r h-full overflow-hidden">
        <Chat
          userInitial={userInitial}
          company={company}
          clients={clients}
          document={document}
          onDocumentChange={handleDocumentChange}
          nextQuoteNumber={nextQuoteNumber}
          nextInvoiceNumber={nextInvoiceNumber}
        />
      </div>
      <div className="hidden lg:block h-full overflow-hidden">
        <DocumentPreview document={document} />
      </div>
    </div>
  );
}
