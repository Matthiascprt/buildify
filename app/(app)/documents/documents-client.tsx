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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  FileText,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Check,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { deleteQuote, deleteInvoice } from "@/lib/supabase/api";
import type { DocumentItem, DocumentType } from "./page";

interface DocumentsClientProps {
  initialDocuments: DocumentItem[];
}

export function DocumentsClient({ initialDocuments }: DocumentsClientProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | DocumentType>("all");
  const [sortBy, setSortBy] = useState<"numero" | "date" | "montant">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;

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
      let comparison = 0;
      switch (sortBy) {
        case "numero":
          comparison = a.numero.localeCompare(b.numero);
          break;
        case "date":
          comparison = a.dateCreation.getTime() - b.dateCreation.getTime();
          break;
        case "montant":
          comparison = a.totalTTC - b.totalTTC;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [documents, searchQuery, filterType, sortBy, sortOrder]);

  const toggleSelectDocument = (docId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    const selectedDocs = documents.filter((doc) =>
      selectedIds.has(`${doc.type}-${doc.id}`),
    );

    for (const doc of selectedDocs) {
      if (doc.type === "devis") {
        await deleteQuote(doc.id);
      } else {
        await deleteInvoice(doc.id);
      }
    }

    setDocuments((prev) =>
      prev.filter((doc) => !selectedIds.has(`${doc.type}-${doc.id}`)),
    );
    setSelectedIds(new Set());
    setDeleteMode(false);
    setShowDeleteConfirm(false);
    setIsDeleting(false);
  };

  const exitDeleteMode = () => {
    setDeleteMode(false);
    setSelectedIds(new Set());
  };

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto sm:min-w-[140px]"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Trier
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px] p-2">
            <div className="flex gap-2 mb-2">
              <Button
                variant={sortOrder === "asc" ? "default" : "ghost"}
                size="sm"
                className="flex-1 h-8"
                onClick={() => setSortOrder("asc")}
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                Asc
              </Button>
              <Button
                variant={sortOrder === "desc" ? "default" : "ghost"}
                size="sm"
                className="flex-1 h-8"
                onClick={() => setSortOrder("desc")}
              >
                <ArrowDown className="h-4 w-4 mr-1" />
                Desc
              </Button>
            </div>
            <DropdownMenuSeparator className="mx-0" />
            <DropdownMenuItem
              onClick={() => setSortBy("numero")}
              className="mt-1"
            >
              {sortBy === "numero" && <Check className="h-4 w-4 mr-2" />}
              <span className={sortBy !== "numero" ? "ml-6" : ""}>Numéro</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("date")}>
              {sortBy === "date" && <Check className="h-4 w-4 mr-2" />}
              <span className={sortBy !== "date" ? "ml-6" : ""}>Date</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("montant")}>
              {sortBy === "montant" && <Check className="h-4 w-4 mr-2" />}
              <span className={sortBy !== "montant" ? "ml-6" : ""}>
                Montant
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {deleteMode ? (
          <Button
            variant="outline"
            size="icon"
            onClick={exitDeleteMode}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDeleteMode(true)}
            className="shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {deleteMode && selectedIds.size > 0 ? (
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer ({selectedIds.size})
          </Button>
        ) : (
          <Button className="w-full sm:w-auto" onClick={handleNewDocument}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau document
          </Button>
        )}
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
                  deleteMode={deleteMode}
                  isSelected={selectedIds.has(`${doc.type}-${doc.id}`)}
                  onToggleSelect={() =>
                    toggleSelectDocument(`${doc.type}-${doc.id}`)
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedIds.size} document
              {selectedIds.size > 1 ? "s" : ""} ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface DocumentRowProps {
  document: DocumentItem;
  onClick: () => void;
  deleteMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

function DocumentRow({
  document,
  onClick,
  deleteMode,
  isSelected,
  onToggleSelect,
}: DocumentRowProps) {
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

  const handleClick = () => {
    if (deleteMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onClick();
    }
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer ${
        isSelected ? "ring-2 ring-destructive bg-destructive/5" : ""
      }`}
      onClick={handleClick}
    >
      {deleteMode && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect?.()}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        />
      )}
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
