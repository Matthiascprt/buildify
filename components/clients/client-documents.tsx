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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {documents.map((doc) => {
        const isQuote = doc.type === "quote";
        return (
          <div
            key={`${doc.type}-${doc.id}`}
            onClick={() => handleDocumentClick(doc)}
            className="group flex flex-col bg-card border border-border/60 hover:border-border hover:shadow-sm transition-all cursor-pointer overflow-hidden rounded-md"
          >
            {/* Document preview miniature */}
            <div className="relative bg-muted/15 border-b border-border/40">
              <div className="aspect-[210/115] p-2.5 flex flex-col">
                {/* Mini document header */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  {doc.companyLogo ? (
                    <Image
                      src={doc.companyLogo}
                      alt="Logo"
                      width={36}
                      height={18}
                      className="w-9 h-[18px] object-contain object-left shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="w-9 h-[18px] rounded bg-muted/50 flex items-center justify-center shrink-0">
                      <Building2 className="w-2.5 h-2.5 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-[7px] font-semibold text-foreground/70 uppercase tracking-wide">
                      {isQuote ? "Devis" : "Facture"}
                    </p>
                    <p className="text-[6px] text-muted-foreground/60">
                      n° {doc.number}
                    </p>
                  </div>
                </div>

                {/* Company name */}
                <div className="flex justify-between gap-2 mb-1.5">
                  <p className="text-[6px] font-medium text-foreground/60 truncate">
                    {doc.companyName || "Entreprise"}
                  </p>
                </div>

                {/* Skeleton table */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 py-0.5 border-b border-muted/30">
                    <div className="w-3 h-1 rounded bg-muted/40" />
                    <div className="flex-1 h-1 rounded bg-muted/30" />
                    <div className="w-5 h-1 rounded bg-muted/40" />
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5">
                    <div className="w-3 h-0.5 rounded bg-muted/25" />
                    <div className="flex-1 h-0.5 rounded bg-muted/20" />
                    <div className="w-5 h-0.5 rounded bg-muted/25" />
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5">
                    <div className="w-3 h-0.5 rounded bg-muted/25" />
                    <div className="flex-1 h-0.5 rounded bg-muted/20" />
                    <div className="w-5 h-0.5 rounded bg-muted/25" />
                  </div>
                </div>

                {/* Mini total */}
                <div className="mt-auto pt-1 border-t border-muted/30 flex justify-end">
                  <div className="text-right">
                    <p className="text-[5px] text-muted-foreground/50 uppercase">
                      Total TTC
                    </p>
                    <p className="text-[8px] font-bold text-foreground/80">
                      {formatCurrency(doc.totalTTC)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document info - clean and minimal */}
            <div className="p-2.5 space-y-1.5">
              {/* Header row: Type badge + Number */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    !doc.accentColor ? "bg-muted text-muted-foreground" : ""
                  }`}
                  style={
                    doc.accentColor
                      ? {
                          backgroundColor: `${doc.accentColor}15`,
                          color: doc.accentColor,
                        }
                      : undefined
                  }
                >
                  {isQuote ? "Devis" : "Facture"}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {doc.number}
                </span>
              </div>

              {/* Project title */}
              <p className="text-sm font-medium text-foreground truncate leading-tight">
                {doc.projectTitle || "Sans titre"}
              </p>

              {/* Footer: Date + Amount */}
              <div className="flex items-end justify-between gap-2">
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {doc.date}
                </span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
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
