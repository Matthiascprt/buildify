"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, FileText } from "lucide-react";
import type { DocumentItem, DocumentType } from "./page";

interface DocumentsClientProps {
  initialDocuments: DocumentItem[];
}

export function DocumentsClient({ initialDocuments }: DocumentsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | DocumentType>("all");
  const [sortBy, setSortBy] = useState<"numero" | "date" | "montant">("date");

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = initialDocuments;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.numero.toLowerCase().includes(query) ||
          doc.clientNom.toLowerCase().includes(query),
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((doc) => doc.type === filterType);
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "numero":
          return a.numero.localeCompare(b.numero);
        case "date":
          return b.dateCreation.getTime() - a.dateCreation.getTime();
        case "montant":
          return b.totalTTC - a.totalTTC;
        default:
          return 0;
      }
    });

    return sorted;
  }, [initialDocuments, searchQuery, filterType, sortBy]);

  const handleDocumentClick = (doc: DocumentItem) => {
    const type = doc.type === "devis" ? "quote" : "invoice";
    router.push(`/edition?id=${doc.id}&type=${type}`);
  };

  const handleNewDocument = () => {
    router.push("/edition");
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground">Gérez vos devis et factures</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filterType}
          onValueChange={(value) =>
            setFilterType(value as "all" | DocumentType)
          }
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Filtrer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="devis">Devis</SelectItem>
            <SelectItem value="facture">Factures</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value) =>
            setSortBy(value as "numero" | "date" | "montant")
          }
        >
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="numero">Numéro</SelectItem>
            <SelectItem value="date">Date (récent → ancien)</SelectItem>
            <SelectItem value="montant">Montant (↓)</SelectItem>
          </SelectContent>
        </Select>

        <Button className="w-full sm:w-auto" onClick={handleNewDocument}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tous les documents</CardTitle>
            {filteredAndSortedDocuments.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {filteredAndSortedDocuments.length} document
                {filteredAndSortedDocuments.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucun document</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchQuery || filterType !== "all"
                  ? "Aucun document ne correspond à votre recherche."
                  : "Créez votre premier devis ou facture pour commencer."}
              </p>
              {!searchQuery && filterType === "all" && (
                <Button onClick={handleNewDocument}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau document
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedDocuments.map((doc) => (
                <DocumentRow
                  key={`${doc.type}-${doc.id}`}
                  document={doc}
                  onClick={() => handleDocumentClick(doc)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface DocumentRowProps {
  document: DocumentItem;
  onClick: () => void;
}

function DocumentRow({ document, onClick }: DocumentRowProps) {
  const isDevis = document.type === "devis";

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="shrink-0 w-12 h-14 rounded border-2 flex flex-col items-center justify-center border-orange-200 bg-orange-50 dark:border-orange-500/40 dark:bg-orange-500/10">
        <div className="w-6 h-0.5 rounded-full mb-1 bg-orange-300 dark:bg-orange-400" />
        <div className="w-4 h-0.5 rounded-full mb-1.5 bg-orange-200 dark:bg-orange-500/50" />
        <div className="space-y-0.5">
          <div className="w-5 h-0.5 rounded-full bg-orange-200 dark:bg-orange-500/50" />
          <div className="w-5 h-0.5 rounded-full bg-orange-200 dark:bg-orange-500/50" />
          <div className="w-3 h-0.5 rounded-full bg-orange-200 dark:bg-orange-500/50" />
        </div>
        <span className="text-[6px] font-bold mt-1 text-orange-500 dark:text-orange-400">
          {isDevis ? "DEV" : "FAC"}
        </span>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${
              isDevis ? "bg-orange-500" : "bg-amber-500"
            }`}
          />
          <p className="font-semibold text-sm truncate">
            {isDevis ? "Devis" : "Facture"} N° {document.numero}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDate(document.dateCreation)}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {document.clientNom}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-semibold text-base">
          {formatCurrency(document.totalTTC)}
        </p>
        <p className="text-xs text-muted-foreground">TTC</p>
      </div>
    </div>
  );
}
