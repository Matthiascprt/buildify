"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText,
  Download,
  User,
  Trash2,
  Receipt,
  Loader2,
  Plus,
  Minus,
  Palette,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuotePDFTemplate } from "./quote-pdf-template";
import { InvoicePDFTemplate } from "./invoice-pdf-template";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuoteTemplate } from "./quote-template";
import { InvoiceTemplate } from "./invoice-template";
import { ClientDocuments } from "@/components/clients/client-documents";
import { updateClient, deleteClient } from "@/lib/supabase/api";
import type {
  DocumentData,
  QuoteData,
  InvoiceData,
} from "@/lib/types/document";
import type { Client } from "@/lib/supabase/types";

type ClientType = "particulier" | "professionnel";

interface DocumentPreviewProps {
  document: DocumentData | null;
  onDeleteDocument?: () => Promise<{ success: boolean; error?: string }>;
  onDocumentUpdate?: (path: string, value: string | number) => void;
  onConvertToInvoice?: () => Promise<{ success: boolean; error?: string }>;
  onAddLine?: () => void;
  onRemoveLines?: (lineIndices: number[]) => void;
  accentColor?: string | null;
  onAccentColorChange?: (color: string | null) => void;
  clientSyncError?: string | null;
  onClientSyncErrorClear?: () => void;
  isSaving?: boolean;
  showMobileInput?: boolean;
  mobileInputComponent?: React.ReactNode;
  onSwitchToChat?: () => void;
}

function mapToQuoteTemplateData(doc: QuoteData) {
  return {
    number: doc.number,
    date: doc.date,
    validity: doc.validity,
    company: {
      name: doc.company.name,
      address: doc.company.address,
      city: doc.company.city,
      phone: doc.company.phone,
      email: doc.company.email,
      siret: doc.company.siret,
      logoUrl: doc.company.logoUrl,
      paymentTerms: doc.company.paymentTerms,
      legalNotice: doc.company.legalNotice,
    },
    client: {
      name: doc.client.name,
      address: doc.client.address,
      city: doc.client.city,
      phone: doc.client.phone,
      email: doc.client.email,
      siret: doc.client.siret,
    },
    projectTitle: doc.projectTitle,
    items: doc.items,
    totalHT: doc.totalHT,
    tvaRate: doc.tvaRate,
    tvaAmount: doc.tvaAmount,
    deposit: doc.deposit,
    totalTTC: doc.totalTTC,
    paymentConditions: doc.paymentConditions,
  };
}

function mapToInvoiceTemplateData(doc: InvoiceData) {
  return {
    number: doc.number,
    date: doc.date,
    dueDate: doc.dueDate,
    company: {
      name: doc.company.name,
      address: doc.company.address,
      city: doc.company.city,
      phone: doc.company.phone,
      email: doc.company.email,
      siret: doc.company.siret,
      logoUrl: doc.company.logoUrl,
      paymentTerms: doc.company.paymentTerms,
      legalNotice: doc.company.legalNotice,
    },
    client: {
      name: doc.client.name,
      address: doc.client.address,
      city: doc.client.city,
      phone: doc.client.phone,
      email: doc.client.email,
      siret: doc.client.siret,
    },
    projectTitle: doc.projectTitle,
    items: doc.items,
    totalHT: doc.totalHT,
    tvaRate: doc.tvaRate,
    tvaAmount: doc.tvaAmount,
    deposit: doc.deposit,
    totalTTC: doc.totalTTC,
    paymentConditions: doc.paymentConditions,
  };
}

export function DocumentPreview({
  document,
  onDeleteDocument,
  onDocumentUpdate,
  onConvertToInvoice,
  onAddLine,
  onRemoveLines,
  accentColor,
  onAccentColorChange,
  clientSyncError,
  onClientSyncErrorClear,
  isSaving,
  showMobileInput,
  mobileInputComponent,
  onSwitchToChat,
}: DocumentPreviewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [deleteLineMode, setDeleteLineMode] = useState(false);
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showClientSheet, setShowClientSheet] = useState(false);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    type: "particulier" as ClientType,
  });
  const [clientEditError, setClientEditError] = useState<string | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const handleClientButtonClick = async () => {
    if (!document?.client?.id) return;

    setShowClientSheet(true);
    setIsLoadingClient(true);
    setClientEditError(null);

    try {
      const response = await fetch(`/api/clients/${document.client.id}`);
      if (response.ok) {
        const data = await response.json();
        setClientData(data.client);
        setEditFormData({
          first_name: data.client.first_name ?? "",
          last_name: data.client.last_name ?? "",
          email: data.client.email ?? "",
          phone: data.client.phone ?? "",
          type: (data.client.type as ClientType) ?? "particulier",
        });
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setIsLoadingClient(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!clientData) return;

    setIsSavingClient(true);
    const result = await updateClient(clientData.id, {
      first_name: editFormData.first_name || null,
      last_name: editFormData.last_name || null,
      email: editFormData.email || null,
      phone: editFormData.phone || null,
      type: editFormData.type,
    });

    if (result.success && result.client) {
      setClientData(result.client);
      setClientEditError(null);
    } else {
      setClientEditError(
        result.error || "Erreur lors de la modification du client",
      );
    }
    setIsSavingClient(false);
  };

  const handleDeleteClientFromSheet = async () => {
    if (!clientData) return;

    setIsSavingClient(true);
    const result = await deleteClient(clientData.id);
    if (result.success) {
      setShowClientSheet(false);
      setClientData(null);
    }
    setIsSavingClient(false);
  };

  // Fermer le color picker quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [showColorPicker]);

  // Drag-select pour suppression multiple
  const dragStartLineRef = useRef<number | null>(null);

  const handleLineMouseDown = (lineIndex: number) => {
    if (deleteLineMode) {
      dragStartLineRef.current = lineIndex;
      setIsDragging(false); // Will be set to true only if mouse moves to another line
    }
  };

  const handleLineMouseEnter = (lineIndex: number) => {
    if (
      deleteLineMode &&
      dragStartLineRef.current !== null &&
      dragStartLineRef.current !== lineIndex
    ) {
      // Started dragging to another line
      if (!isDragging) {
        setIsDragging(true);
        setSelectedLines(new Set([dragStartLineRef.current, lineIndex]));
      } else {
        setSelectedLines((prev) => new Set([...prev, lineIndex]));
      }
    }
  };

  const handleLineClick = (lineIndex: number) => {
    if (deleteLineMode) {
      // Click simple - sélectionner/désélectionner
      setSelectedLines((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(lineIndex)) {
          newSet.delete(lineIndex);
        } else {
          newSet.add(lineIndex);
        }
        return newSet;
      });
    }
  };

  // Gérer le mouseup global pour terminer le drag
  useEffect(() => {
    const handleMouseUp = () => {
      dragStartLineRef.current = null;
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (deleteLineMode) {
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [deleteLineMode, isDragging]);

  // Reset la sélection quand on quitte le mode suppression
  useEffect(() => {
    if (!deleteLineMode) {
      setSelectedLines(new Set());
      setIsDragging(false);
    }
  }, [deleteLineMode]);

  const handleConfirmDeleteLines = () => {
    if (selectedLines.size > 0 && onRemoveLines) {
      onRemoveLines(Array.from(selectedLines));
      setSelectedLines(new Set());
      setDeleteLineMode(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteDocument) return;

    setIsDeleting(true);
    const result = await onDeleteDocument();
    setIsDeleting(false);

    if (result.success) {
      setShowDeleteConfirm(false);
    }
  };

  const handleConvertClick = () => {
    setShowConvertConfirm(true);
  };

  const handleConfirmConvert = async () => {
    if (!onConvertToInvoice) return;

    setIsConverting(true);
    await onConvertToInvoice();
    setIsConverting(false);
    setShowConvertConfirm(false);
  };

  const handleDownloadPDF = async () => {
    if (!document) return;

    setIsGeneratingPDF(true);

    try {
      const pdfDocument =
        document.type === "quote" ? (
          <QuotePDFTemplate
            data={mapToQuoteTemplateData(document)}
            accentColor={accentColor}
          />
        ) : (
          <InvoicePDFTemplate
            data={mapToInvoiceTemplateData(document)}
            accentColor={accentColor}
          />
        );

      const blob = await pdf(pdfDocument).toBlob();

      const fileName =
        document.type === "quote"
          ? `Devis_${document.number}.pdf`
          : `Facture_${document.number}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getDescription = () => {
    if (!document) {
      return "Votre devis ou facture apparaîtra ici";
    }
    if (document.type === "quote") {
      return `Aperçu du devis n°${document.number}`;
    }
    return `Aperçu de la facture n°${document.number}`;
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="border-b px-4 py-3 shrink-0">
        {/* Desktop: single row | Mobile: stacked */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Title section */}
          <div className="min-w-0">
            <h2 className="font-semibold">Aperçu du document</h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground truncate">
                {getDescription()}
              </p>
              {isSaving && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Sauvegarde...
                </span>
              )}
            </div>
          </div>

          {/* Actions - right side on desktop, below on mobile */}
          {document && (
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {/* Switch to chat button - visible on screens smaller than 2xl */}
              {onSwitchToChat && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="2xl:hidden h-8 w-8 rounded-full bg-muted hover:bg-muted/80"
                  onClick={onSwitchToChat}
                  title="Voir la conversation"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
              {onAddLine && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80"
                  onClick={onAddLine}
                  title="Ajouter une ligne"
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
              {onRemoveLines && (
                <div className="flex items-center gap-1">
                  {deleteLineMode && selectedLines.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 px-3 rounded-full text-xs animate-in fade-in slide-in-from-right-2 duration-200"
                      onClick={handleConfirmDeleteLines}
                    >
                      Supprimer {selectedLines.size}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-full transition-all ${deleteLineMode ? "bg-destructive/20 hover:bg-destructive/30" : "bg-muted hover:bg-muted/80"}`}
                    onClick={() => setDeleteLineMode(!deleteLineMode)}
                    title={
                      deleteLineMode
                        ? "Annuler la suppression"
                        : "Supprimer des lignes"
                    }
                  >
                    <Minus
                      className={`h-4 w-4 ${deleteLineMode ? "text-destructive" : "text-muted-foreground"}`}
                    />
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                  <Download className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <div className="relative" ref={colorPickerRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  title="Changer la couleur"
                >
                  <Palette className="h-4 w-4 text-muted-foreground" />
                </Button>
                {showColorPicker && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 bg-popover border rounded-xl shadow-xl p-4">
                    <p className="text-sm font-medium mb-3">
                      Couleur d&apos;accent
                    </p>
                    <HexColorPicker
                      color={accentColor || "#f5f5f5"}
                      onChange={(color) => onAccentColorChange?.(color)}
                      style={{ width: "200px", height: "160px" }}
                    />
                    <button
                      className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      onClick={() => onAccentColorChange?.(null)}
                    >
                      Réinitialiser
                    </button>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full ${
                  document.client?.id
                    ? "bg-muted hover:bg-muted/80"
                    : "bg-muted/50 cursor-not-allowed opacity-50"
                }`}
                onClick={handleClientButtonClick}
                disabled={!document.client?.id}
                title={
                  document.client?.id
                    ? "Voir la fiche client"
                    : "Aucun client lié"
                }
              >
                <User
                  className={`h-4 w-4 ${
                    document.client?.id
                      ? "text-muted-foreground"
                      : "text-muted-foreground/40"
                  }`}
                />
              </Button>
              {document.type === "quote" && onConvertToInvoice && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80"
                  onClick={handleConvertClick}
                  title="Convertir en facture"
                >
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {clientSyncError && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{clientSyncError}</span>
            </div>
            {onClientSyncErrorClear && (
              <button
                onClick={onClientSyncErrorClear}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-medium"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {document === null ? (
              <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden">
                {/* Modern empty state with gradient background */}
                <div className="relative p-12 bg-gradient-to-br from-orange-50 via-amber-50/50 to-white dark:from-orange-950/20 dark:via-amber-950/10 dark:to-background border border-orange-200/50 dark:border-orange-500/10 rounded-2xl">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-orange-200/40 to-transparent dark:from-orange-500/10 rounded-full blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-amber-200/30 to-transparent dark:from-amber-500/5 rounded-full blur-2xl" />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Document icon with gradient ring */}
                    <div className="relative mb-6">
                      <div className="absolute -inset-3 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 rounded-2xl opacity-20 blur-lg" />
                      <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center shadow-lg border border-orange-200/50 dark:border-orange-500/20">
                        <FileText className="h-10 w-10 text-orange-500 dark:text-orange-400" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 dark:from-orange-400 dark:via-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                      Votre document apparaîtra ici
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      Créez un devis ou une facture avec Max pour voir
                      l&apos;aperçu en temps réel
                    </p>

                    {/* Decorative dots */}
                    <div className="flex gap-2 mt-8">
                      <span className="h-2 w-2 rounded-full bg-orange-300 dark:bg-orange-600" />
                      <span className="h-2 w-2 rounded-full bg-amber-300 dark:bg-amber-600" />
                      <span className="h-2 w-2 rounded-full bg-orange-300 dark:bg-orange-600" />
                    </div>
                  </div>
                </div>
              </div>
            ) : document.type === "quote" ? (
              <div
                ref={documentRef}
                className="w-full max-w-2xl rounded-lg border bg-background shadow-sm"
              >
                <QuoteTemplate
                  data={mapToQuoteTemplateData(document)}
                  onUpdate={onDocumentUpdate}
                  deleteMode={deleteLineMode}
                  selectedLines={selectedLines}
                  onLineClick={handleLineClick}
                  onLineMouseDown={handleLineMouseDown}
                  onLineMouseEnter={handleLineMouseEnter}
                  accentColor={accentColor}
                />
              </div>
            ) : (
              <div
                ref={documentRef}
                className="w-full max-w-2xl rounded-lg border bg-background shadow-sm"
              >
                <InvoiceTemplate
                  data={mapToInvoiceTemplateData(document)}
                  onUpdate={onDocumentUpdate}
                  deleteMode={deleteLineMode}
                  selectedLines={selectedLines}
                  onLineClick={handleLineClick}
                  onLineMouseDown={handleLineMouseDown}
                  onLineMouseEnter={handleLineMouseEnter}
                  accentColor={accentColor}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le document</DialogTitle>
            <DialogDescription>
              Souhaitez-vous vraiment supprimer ce document ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Non
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Oui, supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de conversion en facture */}
      <Dialog open={showConvertConfirm} onOpenChange={setShowConvertConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir en facture</DialogTitle>
            <DialogDescription>
              Souhaitez-vous créer une facture à partir de ce devis ? Le devis
              sera conservé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConvertConfirm(false)}
              disabled={isConverting}
            >
              Annuler
            </Button>
            <Button onClick={handleConfirmConvert} disabled={isConverting}>
              {isConverting ? "Création..." : "Créer la facture"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog fiche client */}
      <Dialog open={showClientSheet} onOpenChange={setShowClientSheet}>
        <DialogContent
          className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Fixed Header */}
          <div className="shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogHeader className="pr-8">
              <DialogTitle className="flex items-center gap-3">
                {isLoadingClient ? (
                  <span>Chargement...</span>
                ) : clientData ? (
                  <>
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {`${clientData.first_name?.charAt(0) ?? ""}${clientData.last_name?.charAt(0) ?? ""}`.toUpperCase() ||
                          "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {clientData.first_name} {clientData.last_name}
                    </span>
                  </>
                ) : (
                  <span>Client</span>
                )}
              </DialogTitle>
            </DialogHeader>
          </div>

          {isLoadingClient ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : clientData ? (
            <>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <p className="text-sm text-muted-foreground mb-4">
                  Modifiez les informations du client
                </p>

                {/* Edit Form */}
                <div className="grid gap-4">
                  {clientEditError && (
                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{clientEditError}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_last_name">Nom</Label>
                      <Input
                        id="edit_last_name"
                        placeholder="Dupont"
                        value={editFormData.last_name}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            last_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_first_name">Prénom</Label>
                      <Input
                        id="edit_first_name"
                        placeholder="Jean"
                        value={editFormData.first_name}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            first_name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_email">Email</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      placeholder="jean.dupont@example.com"
                      value={editFormData.email}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_phone">Téléphone</Label>
                    <Input
                      id="edit_phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={editFormData.phone}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_type">Type</Label>
                    <Select
                      value={editFormData.type}
                      onValueChange={(value) =>
                        setEditFormData({
                          ...editFormData,
                          type: value as ClientType,
                        })
                      }
                    >
                      <SelectTrigger id="edit_type" className="w-full">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="particulier">Particulier</SelectItem>
                        <SelectItem value="professionnel">
                          Professionnel
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleUpdateClient}
                    disabled={isSavingClient}
                  >
                    {isSavingClient && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Enregistrer les modifications
                  </Button>
                </div>

                <Separator className="my-4" />

                {/* Documents Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Documents</h3>
                  <ClientDocuments
                    clientId={clientData.id}
                    onNavigate={() => setShowClientSheet(false)}
                  />
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="shrink-0 px-6 py-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Supprimer ce client
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDeleteClientFromSheet}
                    disabled={isSavingClient}
                  >
                    {isSavingClient ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1.5" />
                    )}
                    Supprimer
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Impossible de charger les informations du client
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Input for screens smaller than 2xl */}
      {showMobileInput && mobileInputComponent && (
        <div className="2xl:hidden border-t bg-background">
          {mobileInputComponent}
        </div>
      )}
    </div>
  );
}
