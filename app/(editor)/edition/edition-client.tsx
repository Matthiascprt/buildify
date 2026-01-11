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
  initialNextQuoteNumber: string;
  initialNextInvoiceNumber: string;
  initialDocument?: DocumentData | null;
}

export function EditionClient({
  userInitial,
  company,
  clients,
  initialNextQuoteNumber,
  initialNextInvoiceNumber,
  initialDocument = null,
}: EditionClientProps) {
  const [document, setDocument] = useState<DocumentData | null>(
    initialDocument,
  );
  const [nextQuoteNumber, setNextQuoteNumber] = useState(
    initialNextQuoteNumber,
  );
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(
    initialNextInvoiceNumber,
  );

  const handleDocumentChange = (newDocument: DocumentData | null) => {
    setDocument(newDocument);
    // Numbers are now managed by the database, so we update them after document creation
    if (newDocument?.number) {
      if (newDocument.type === "quote") {
        // Increment the number for the next potential document
        const parts = newDocument.number.split("-");
        if (parts.length === 3) {
          const nextSeq = (parseInt(parts[2], 10) + 1)
            .toString()
            .padStart(4, "0");
          setNextQuoteNumber(`${parts[0]}-${parts[1]}-${nextSeq}`);
        }
      } else if (newDocument.type === "invoice") {
        const parts = newDocument.number.split("-");
        if (parts.length === 3) {
          const nextSeq = (parseInt(parts[2], 10) + 1)
            .toString()
            .padStart(4, "0");
          setNextInvoiceNumber(`${parts[0]}-${parts[1]}-${nextSeq}`);
        }
      }
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
          isEditingExisting={!!initialDocument}
        />
      </div>
      <div className="hidden lg:block h-full overflow-hidden">
        <DocumentPreview document={document} />
      </div>
    </div>
  );
}
