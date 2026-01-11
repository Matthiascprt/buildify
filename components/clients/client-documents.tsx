"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getDocumentsByClient, type ClientDocument } from "@/lib/supabase/api";

interface ClientDocumentsProps {
  clientId: number;
  onNavigate?: () => void;
}

type FilterType = "all" | "quote" | "invoice";

export function ClientDocuments({
  clientId,
  onNavigate,
}: ClientDocumentsProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  useEffect(() => {
    async function loadDocuments() {
      setIsLoading(true);
      const data = await getDocumentsByClient(clientId);
      setDocuments(data);
      setIsLoading(false);
    }
    loadDocuments();
  }, [clientId]);

  const filteredDocuments = useMemo(() => {
    let result = documents;

    // Filter by type
    if (filterType !== "all") {
      result = result.filter((doc) => doc.type === filterType);
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter((doc) => {
        const number = doc.number?.toLowerCase() || "";
        return number.includes(searchLower);
      });
    }

    return result;
  }, [documents, search, filterType]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (amount?: number) => {
    if (amount === undefined) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const handleDocumentClick = (doc: ClientDocument) => {
    onNavigate?.();
    const path =
      doc.type === "quote"
        ? `/edition?type=quote&id=${doc.id}`
        : `/edition?type=invoice&id=${doc.id}`;

    // Use hard navigation to ensure full page reload when already on /edition
    if (window.location.pathname === "/edition") {
      window.location.assign(path);
    } else {
      router.push(path);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Bar + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as FilterType)}
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="quote">Devis</SelectItem>
            <SelectItem value="invoice">Factures</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg bg-muted/30">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Aucun devis ou facture pour ce client
          </p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg bg-muted/30">
          <Search className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Aucun document trouvé</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredDocuments.map((doc) => (
            <button
              key={`${doc.type}-${doc.id}`}
              onClick={() => handleDocumentClick(doc)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
            >
              <div className="shrink-0 w-10 h-12 rounded border-2 flex flex-col items-center justify-center border-orange-200 bg-orange-50 dark:border-orange-500/40 dark:bg-orange-500/10">
                <div className="w-5 h-0.5 rounded-full mb-0.5 bg-orange-300 dark:bg-orange-400" />
                <div className="w-3 h-0.5 rounded-full mb-1 bg-orange-200 dark:bg-orange-500/50" />
                <div className="space-y-0.5">
                  <div className="w-4 h-0.5 rounded-full bg-orange-200 dark:bg-orange-500/50" />
                  <div className="w-4 h-0.5 rounded-full bg-orange-200 dark:bg-orange-500/50" />
                </div>
                <span className="text-[5px] font-bold mt-0.5 text-orange-500 dark:text-orange-400">
                  {doc.type === "quote" ? "DEV" : "FAC"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${
                      doc.type === "quote" ? "bg-orange-500" : "bg-amber-500"
                    }`}
                  />
                  <span className="font-medium truncate block">
                    {doc.type === "quote" ? "Devis" : "Facture"} N°{" "}
                    {doc.number || "Sans numéro"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 ml-4">
                  <span>{formatDate(doc.date)}</span>
                  {doc.totalTTC !== undefined && (
                    <span className="font-medium">
                      {formatAmount(doc.totalTTC)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Document count */}
      {documents.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {filteredDocuments.length} document
          {filteredDocuments.length > 1 ? "s" : ""}
          {filteredDocuments.length !== documents.length &&
            ` sur ${documents.length}`}
        </p>
      )}
    </div>
  );
}
