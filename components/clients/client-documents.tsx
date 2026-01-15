"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Building2 } from "lucide-react";
import Image from "next/image";
import { getClientDocuments } from "@/lib/supabase/api";
import type { Quote, Invoice } from "@/lib/supabase/types";

interface ClientDocumentsProps {
  clientId: string;
  onNavigate?: () => void;
}

type DocumentItem = {
  id: string;
  type: "quote" | "invoice";
  number: string;
  date: string;
  totalTTC: number;
  projectTitle?: string;
  companyName?: string;
  companyLogo?: string;
  accentColor?: string;
};

export function ClientDocuments({
  clientId,
  onNavigate,
}: ClientDocumentsProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDocuments() {
      setIsLoading(true);
      try {
        const { quotes, invoices, companyName, companyLogo } =
          await getClientDocuments(clientId);

        const quoteItems: DocumentItem[] = quotes.map((q: Quote) => ({
          id: q.id,
          type: "quote" as const,
          number: q.number,
          date: new Date(q.created_at).toLocaleDateString("fr-FR"),
          totalTTC: q.content?.totals?.total_ttc || 0,
          projectTitle: q.content?.project_title,
          companyName,
          companyLogo,
          accentColor: q.color || undefined,
        }));

        const invoiceItems: DocumentItem[] = invoices.map((i: Invoice) => ({
          id: i.id,
          type: "invoice" as const,
          number: i.number,
          date: new Date(i.created_at).toLocaleDateString("fr-FR"),
          totalTTC: i.content?.totals?.total_ttc || 0,
          projectTitle: i.content?.project_title,
          companyName,
          companyLogo,
          accentColor: i.color || undefined,
        }));

        const allDocs = [...quoteItems, ...invoiceItems].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        setDocuments(allDocs);
      } catch (error) {
        console.error("Failed to load client documents:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDocuments();
  }, [clientId]);

  const handleDocumentClick = (doc: DocumentItem) => {
    onNavigate?.();
    router.push(`/edition?id=${doc.id}&type=${doc.type}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg bg-muted/30">
        <FileText className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Aucun document pour ce client
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
      {documents.map((doc) => {
        const isQuote = doc.type === "quote";
        const accentColor =
          doc.accentColor || (isQuote ? "#f97316" : "#f59e0b");
        return (
          <div
            key={`${doc.type}-${doc.id}`}
            onClick={() => handleDocumentClick(doc)}
            className="flex flex-col rounded-xl border bg-card hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
          >
            {/* Document preview */}
            <div className="p-2 sm:p-3 bg-muted/30">
              <div className="bg-background rounded-lg p-2 sm:p-3 shadow-sm border">
                {/* Header with logo and document info */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  {doc.companyLogo ? (
                    <Image
                      src={doc.companyLogo}
                      alt="Logo"
                      width={40}
                      height={20}
                      className="w-8 sm:w-10 h-4 sm:h-5 object-contain object-left shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="w-8 sm:w-10 h-4 sm:h-5 bg-muted rounded flex items-center justify-center shrink-0">
                      <Building2 className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="text-right min-w-0 flex-1">
                    <p
                      className="font-bold text-[8px] sm:text-[9px] leading-tight truncate"
                      style={{ color: accentColor }}
                    >
                      {isQuote ? "Devis" : "Facture"} n° {doc.number}
                    </p>
                    <p className="text-[6px] sm:text-[7px] text-muted-foreground mt-0.5">
                      {doc.date}
                    </p>
                  </div>
                </div>

                {/* Company and Project title row */}
                <div className="flex justify-between gap-2 text-[6px] sm:text-[7px] text-muted-foreground mb-2 pb-1.5 sm:pb-2 border-b border-dashed">
                  <p className="font-medium text-foreground truncate flex-1">
                    {doc.companyName || "Mon entreprise"}
                  </p>
                </div>

                {/* Project title */}
                <p className="font-semibold truncate mb-2 text-[8px] sm:text-[9px]">
                  {doc.projectTitle || "Sans titre"}
                </p>

                {/* Mini table */}
                <div className="border rounded overflow-hidden mb-2">
                  {/* Table header */}
                  <div
                    className="px-1 sm:px-1.5 py-0.5 sm:py-1"
                    style={{ backgroundColor: accentColor + "15" }}
                  >
                    <div
                      className="flex gap-1 text-[6px] sm:text-[7px] font-semibold"
                      style={{ color: accentColor }}
                    >
                      <span className="w-3 sm:w-4 text-center shrink-0">#</span>
                      <span className="flex-1 truncate">Désignation</span>
                      <span className="w-8 sm:w-10 text-right shrink-0">
                        Total
                      </span>
                    </div>
                  </div>
                  {/* Table rows */}
                  <div className="divide-y divide-border/50">
                    <div className="flex gap-1 px-1 sm:px-1.5 py-0.5 sm:py-1 items-center">
                      <span className="w-3 sm:w-4 text-center text-[6px] sm:text-[7px] text-muted-foreground shrink-0">
                        1
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="h-1 sm:h-1.5 w-full rounded bg-muted/80" />
                        <div className="h-0.5 sm:h-1 w-2/3 rounded bg-muted/40 mt-0.5" />
                      </div>
                      <div className="h-1 sm:h-1.5 w-8 sm:w-10 rounded bg-muted/60 shrink-0" />
                    </div>
                    <div className="flex gap-1 px-1 sm:px-1.5 py-0.5 sm:py-1 items-center">
                      <span className="w-3 sm:w-4 text-center text-[6px] sm:text-[7px] text-muted-foreground shrink-0">
                        2
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="h-1 sm:h-1.5 w-4/5 rounded bg-muted/60" />
                        <div className="h-0.5 sm:h-1 w-1/2 rounded bg-muted/30 mt-0.5" />
                      </div>
                      <div className="h-1 sm:h-1.5 w-8 sm:w-10 rounded bg-muted/40 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Totals section */}
                <div className="flex justify-end">
                  <div className="text-[6px] sm:text-[7px] space-y-0.5 w-16 sm:w-20">
                    <div className="flex justify-between items-center text-muted-foreground gap-1">
                      <span className="shrink-0">Total HT</span>
                      <div className="h-1 sm:h-1.5 w-6 sm:w-8 rounded bg-muted/50" />
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground gap-1">
                      <span className="shrink-0">TVA</span>
                      <div className="h-1 sm:h-1.5 w-5 sm:w-6 rounded bg-muted/40" />
                    </div>
                    <div className="flex justify-between items-center font-bold pt-0.5 border-t gap-1">
                      <span className="shrink-0">TTC</span>
                      <span
                        className="truncate text-right"
                        style={{ color: accentColor }}
                      >
                        {formatCurrency(doc.totalTTC).replace("€", "").trim()} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document info footer */}
            <div className="p-3 space-y-2">
              {/* Type badge with number */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium shrink-0"
                  style={{
                    backgroundColor: accentColor + "20",
                    color: accentColor,
                  }}
                >
                  {isQuote ? "Devis" : "Facture"}
                </span>
                <span
                  className="text-[11px] sm:text-xs font-semibold truncate"
                  style={{ color: accentColor }}
                >
                  n° {doc.number}
                </span>
              </div>

              {/* Project title and date */}
              <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs text-muted-foreground">
                <p className="truncate flex-1">
                  {doc.projectTitle || "Sans titre"}
                </p>
                <span className="shrink-0">{doc.date}</span>
              </div>

              {/* Amount */}
              <div className="flex items-baseline justify-between pt-2 border-t gap-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                  Total TTC
                </span>
                <span className="font-bold text-base sm:text-lg truncate">
                  {formatCurrency(doc.totalTTC)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
