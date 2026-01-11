"use client";

import { useState } from "react";
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

type DocumentType = "devis" | "facture";

interface Document {
  id: string;
  numero: string;
  type: DocumentType;
  clientNom: string;
  dateCreation: Date;
  totalTTC: number;
}

// Mock data pour démonstration UI
const mockDocuments: Document[] = [
  {
    id: "1",
    numero: "DEV-2024-001",
    type: "devis",
    clientNom: "Jean Dupont",
    dateCreation: new Date("2024-01-15"),
    totalTTC: 1250.0,
  },
  {
    id: "2",
    numero: "FAC-2024-001",
    type: "facture",
    clientNom: "Marie Martin",
    dateCreation: new Date("2024-01-18"),
    totalTTC: 3420.5,
  },
  {
    id: "3",
    numero: "DEV-2024-002",
    type: "devis",
    clientNom: "Entreprise ABC",
    dateCreation: new Date("2024-01-20"),
    totalTTC: 8750.0,
  },
  {
    id: "4",
    numero: "FAC-2024-002",
    type: "facture",
    clientNom: "Pierre Durand",
    dateCreation: new Date("2024-01-22"),
    totalTTC: 560.0,
  },
];

export default function DocumentsPage() {
  const [documents] = useState<Document[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | DocumentType>("all");
  const [sortBy, setSortBy] = useState<"numero" | "date" | "montant">("date");

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground">Gérez vos devis et factures</p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter */}
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

        {/* Sort */}
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

        {/* New Document Button */}
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau document
        </Button>
      </div>

      {/* Documents Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tous les documents</CardTitle>
            {documents.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {documents.length} document{documents.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucun document</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Créez votre premier devis ou facture pour commencer.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau document
              </Button>
            </div>
          ) : (
            // Document List
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentRow key={doc.id} document={doc} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface DocumentRowProps {
  document: Document;
}

function DocumentRow({ document }: DocumentRowProps) {
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
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Mini Document Preview */}
      <div
        className={`
          shrink-0 w-12 h-14 rounded border-2 flex flex-col items-center justify-center
          ${
            isDevis
              ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
              : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
          }
        `}
      >
        <div
          className={`
            w-6 h-0.5 rounded-full mb-1
            ${isDevis ? "bg-blue-300 dark:bg-blue-700" : "bg-emerald-300 dark:bg-emerald-700"}
          `}
        />
        <div
          className={`
            w-4 h-0.5 rounded-full mb-1.5
            ${isDevis ? "bg-blue-200 dark:bg-blue-800" : "bg-emerald-200 dark:bg-emerald-800"}
          `}
        />
        <div className="space-y-0.5">
          <div
            className={`
              w-5 h-0.5 rounded-full
              ${isDevis ? "bg-blue-200 dark:bg-blue-800" : "bg-emerald-200 dark:bg-emerald-800"}
            `}
          />
          <div
            className={`
              w-5 h-0.5 rounded-full
              ${isDevis ? "bg-blue-200 dark:bg-blue-800" : "bg-emerald-200 dark:bg-emerald-800"}
            `}
          />
          <div
            className={`
              w-3 h-0.5 rounded-full
              ${isDevis ? "bg-blue-200 dark:bg-blue-800" : "bg-emerald-200 dark:bg-emerald-800"}
            `}
          />
        </div>
        <span
          className={`
            text-[6px] font-bold mt-1
            ${isDevis ? "text-blue-500 dark:text-blue-400" : "text-emerald-500 dark:text-emerald-400"}
          `}
        >
          {isDevis ? "DEV" : "FAC"}
        </span>
      </div>

      {/* Document Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-semibold text-sm truncate">{document.numero}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(document.dateCreation)}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {document.clientNom}
        </p>
      </div>

      {/* Total TTC */}
      <div className="shrink-0 text-right">
        <p className="font-semibold text-base">
          {formatCurrency(document.totalTTC)}
        </p>
        <p className="text-xs text-muted-foreground">TTC</p>
      </div>
    </div>
  );
}
