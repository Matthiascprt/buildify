"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Building2,
} from "lucide-react";
import Image from "next/image";
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
    try {
      // Delete all selected documents via API
      // compositeId format: "devis-uuid" or "facture-uuid"
      const deletePromises = Array.from(selectedIds).map((compositeId) => {
        const firstDashIndex = compositeId.indexOf("-");
        const docType = compositeId.substring(0, firstDashIndex);
        const docId = compositeId.substring(firstDashIndex + 1);
        const type = docType === "devis" ? "quote" : "invoice";
        return fetch(`/api/documents?id=${docId}&type=${type}`, {
          method: "DELETE",
        });
      });

      await Promise.all(deletePromises);

      // Update local state
      setDocuments((prev) =>
        prev.filter((doc) => !selectedIds.has(`${doc.type}-${doc.id}`)),
      );
      setSelectedIds(new Set());
      setDeleteMode(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">Gérez vos devis et factures</p>
      </div>

      {/* Controls Bar */}
      <div className="space-y-3">
        {/* Search - full width on all screens, inline on xl+ */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Desktop only: Filter, Sort, Delete, Action button inline with search */}
          <div className="hidden xl:flex items-center gap-3">
            <Select
              value={filterType}
              onValueChange={(value) =>
                setFilterType(value as "all" | DocumentType)
              }
            >
              <SelectTrigger className="w-[140px]">
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
                <Button variant="outline" className="min-w-[120px]">
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
                  <span className={sortBy !== "numero" ? "ml-6" : ""}>
                    Numéro
                  </span>
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
              <Button variant="outline" size="icon" onClick={exitDeleteMode}>
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteMode(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            {deleteMode && selectedIds.size > 0 ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer ({selectedIds.size})
              </Button>
            ) : (
              <Button onClick={handleNewDocument}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau document
              </Button>
            )}
          </div>
        </div>

        {/* Mobile/Tablet: Filter, Sort, Delete row */}
        <div className="flex xl:hidden items-center gap-3">
          <Select
            value={filterType}
            onValueChange={(value) =>
              setFilterType(value as "all" | DocumentType)
            }
          >
            <SelectTrigger className="flex-1">
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
              <Button variant="outline" className="flex-1">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Tri
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
                <span className={sortBy !== "numero" ? "ml-6" : ""}>
                  Numéro
                </span>
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
        </div>

        {/* Mobile/Tablet: Action button full width */}
        <div className="xl:hidden">
          {deleteMode && selectedIds.size > 0 ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer ({selectedIds.size})
            </Button>
          ) : (
            <Button className="w-full" onClick={handleNewDocument}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau document
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tous les documents</CardTitle>
            <CardDescription>Vos devis et factures</CardDescription>
          </div>
          {filteredAndSortedDocuments.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedDocuments.length} document
              {filteredAndSortedDocuments.length > 1 ? "s" : ""}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {filteredAndSortedDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-semibold text-lg mb-2">Aucun document</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchQuery || filterType !== "all"
                  ? "Aucun document ne correspond à votre recherche."
                  : "Créez votre premier devis ou facture pour commencer."}
              </p>
              {!searchQuery && filterType === "all" && (
                <Button variant="outline" size="sm" onClick={handleNewDocument}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un document
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
              {filteredAndSortedDocuments.map((doc) => (
                <DocumentCard
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

interface DocumentCardProps {
  document: DocumentItem;
  onClick: () => void;
  deleteMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

function DocumentCard({
  document,
  onClick,
  deleteMode,
  isSelected,
  onToggleSelect,
}: DocumentCardProps) {
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

  // Couleur d'accent ou couleur par défaut selon le type
  const accentColor = document.accentColor || (isDevis ? "#f97316" : "#f59e0b");

  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-card hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
        isSelected ? "ring-2 ring-destructive" : "hover:border-primary/50"
      }`}
      onClick={handleClick}
    >
      {/* Delete mode checkbox */}
      {deleteMode && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.()}
            onClick={(e) => e.stopPropagation()}
            className="bg-background"
          />
        </div>
      )}

      {/* Document preview - Real content */}
      <div className="p-2 sm:p-3 bg-muted/30">
        <div className="bg-background rounded-lg p-2 sm:p-3 shadow-sm border">
          {/* Header with logo and document info */}
          <div className="flex justify-between items-start gap-2 mb-2">
            {document.companyLogo ? (
              <Image
                src={document.companyLogo}
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
                {isDevis ? "Devis" : "Facture"} n° {document.numero}
              </p>
              <p className="text-[6px] sm:text-[7px] text-muted-foreground mt-0.5">
                {formatDate(document.dateCreation)}
              </p>
            </div>
          </div>

          {/* Company and Client row */}
          <div className="flex justify-between gap-2 text-[6px] sm:text-[7px] text-muted-foreground mb-2 pb-1.5 sm:pb-2 border-b border-dashed">
            <p className="font-medium text-foreground truncate flex-1">
              {document.companyName || "Mon entreprise"}
            </p>
            <p className="font-medium text-foreground truncate flex-1 text-right">
              {document.clientNom}
            </p>
          </div>

          {/* Project title */}
          <p className="font-semibold truncate mb-2 text-[8px] sm:text-[9px]">
            {document.projectTitle || "Sans titre"}
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
                <span className="w-8 sm:w-10 text-right shrink-0">Total</span>
              </div>
            </div>
            {/* Table rows - simulated content */}
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
                  {formatCurrency(document.totalTTC).replace("€", "").trim()} €
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
            {isDevis ? "Devis" : "Facture"}
          </span>
          <span
            className="text-[11px] sm:text-xs font-semibold truncate"
            style={{ color: accentColor }}
          >
            n° {document.numero}
          </span>
        </div>

        {/* Client name and date */}
        <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs text-muted-foreground">
          <p className="truncate flex-1">{document.clientNom}</p>
          <span className="shrink-0">{formatDate(document.dateCreation)}</span>
        </div>

        {/* Amount */}
        <div className="flex items-baseline justify-between pt-2 border-t gap-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
            Total TTC
          </span>
          <span className="font-bold text-base sm:text-lg truncate">
            {formatCurrency(document.totalTTC)}
          </span>
        </div>
      </div>
    </div>
  );
}
