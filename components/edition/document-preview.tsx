"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Download,
  User,
  Trash2,
  Receipt,
  Loader2,
  Minus,
  Palette,
  AlertTriangle,
  MessageSquare,
  PenLine,
  X,
  Layers,
  LayoutList,
  ListPlus,
  UserPlus,
  Plus,
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
import { generateFacturXXml, downloadXml } from "@/lib/facturx/generate-xml";
import { createFacturXPdf } from "@/lib/facturx/embed-xml";
import { downloadExcel } from "@/lib/export/excel";

type DownloadFormat = "pdf" | "facturx" | "xml" | "excel";
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
import { SignatureModal } from "./signature-modal";
import { ClientPickerModal } from "./client-picker-modal";
import { NewClientModal } from "./new-client-modal";
import { ClientDocuments } from "@/components/clients/client-documents";
import { updateClient, deleteClient } from "@/lib/supabase/api";
import type {
  DocumentData,
  QuoteData,
  InvoiceData,
} from "@/lib/types/document";
import type { Client } from "@/lib/supabase/types";

type ClientType = "particulier" | "professionnel";

// Type pour les éléments sélectionnés (sections, sous-sections, lignes)
type SelectedItem = {
  type: "section" | "subsection" | "line";
  id: string;
  sectionId?: string;
  subsectionId?: string;
};

interface DocumentPreviewProps {
  document: DocumentData | null;
  onDeleteDocument?: () => Promise<{ success: boolean; error?: string }>;
  onDocumentUpdate?: (path: string, value: string | number) => void;
  onDocumentChange?: (document: DocumentData) => void;
  onConvertToInvoice?: () => Promise<{ success: boolean; error?: string }>;
  onAddSection?: () => void;
  onAddSubsection?: (sectionId?: string) => void;
  onAddLine?: (subsectionId?: string) => void;
  onRemoveItems?: (items: SelectedItem[]) => void;
  accentColor?: string | null;
  onAccentColorChange?: (color: string | null) => void;
  clientSyncError?: string | null;
  onClientSyncErrorClear?: () => void;
  isSaving?: boolean;
  showMobileInput?: boolean;
  mobileInputComponent?: React.ReactNode;
  onSwitchToChat?: () => void;
  clients?: Client[];
  onClientCreated?: (client: Client) => void;
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
      rcs: doc.company.rcs,
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
    sections: doc.sections,
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
      rcs: doc.company.rcs,
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
    sections: doc.sections,
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
  onDocumentChange,
  onConvertToInvoice,
  onAddSection,
  onAddSubsection,
  onAddLine,
  onRemoveItems,
  accentColor,
  onAccentColorChange,
  clientSyncError,
  onClientSyncErrorClear,
  isSaving,
  showMobileInput,
  mobileInputComponent,
  onSwitchToChat,
  clients = [],
  onClientCreated,
}: DocumentPreviewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
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
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showClientMenu, setShowClientMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ left: 0, top: 0 });
  const documentRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const colorPopoverRef = useRef<HTMLDivElement>(null);
  const clientButtonRef = useRef<HTMLButtonElement>(null);
  const clientMenuRef = useRef<HTMLDivElement>(null);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

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
      const target = event.target as Node;
      const clickedOnButton = colorButtonRef.current?.contains(target);
      const clickedOnPopover = colorPopoverRef.current?.contains(target);

      if (!clickedOnButton && !clickedOnPopover) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [showColorPicker]);

  // Fermer le menu client quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOnButton = clientButtonRef.current?.contains(target);
      const clickedOnMenu = clientMenuRef.current?.contains(target);

      if (!clickedOnButton && !clickedOnMenu) {
        setShowClientMenu(false);
      }
    };
    if (showClientMenu) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [showClientMenu]);

  // Fermer le menu téléchargement quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOnButton = downloadButtonRef.current?.contains(target);
      const clickedOnMenu = downloadMenuRef.current?.contains(target);

      if (!clickedOnButton && !clickedOnMenu) {
        setShowDownloadMenu(false);
      }
    };
    if (showDownloadMenu) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [showDownloadMenu]);

  // Gérer la sélection d'un client existant
  const handleClientSelect = async (client: Client) => {
    if (!document || !onDocumentChange) return;

    const clientName = [client.first_name, client.last_name]
      .filter(Boolean)
      .join(" ");

    // Update document with client info
    const updatedDocument: DocumentData = {
      ...document,
      client: {
        id: client.id,
        name: clientName,
        address: "",
        city: "",
        phone: client.phone || "",
        email: client.email || "",
      },
    };

    // Update client_id in database if document has an ID
    if (document.id) {
      const type = document.type === "quote" ? "quote" : "invoice";
      try {
        await fetch(`/api/documents?id=${document.id}&type=${type}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: client.id }),
        });
      } catch (error) {
        console.error("Failed to update client:", error);
      }
    }

    onDocumentChange(updatedDocument);
    setShowClientPicker(false);
  };

  // Gérer la création d'un nouveau client
  const handleNewClientCreated = (client: Client) => {
    onClientCreated?.(client);
    handleClientSelect(client);
    setShowNewClientModal(false);
  };

  // Vérifier si un élément est sélectionné
  const isItemSelected = (
    type: "section" | "subsection" | "line",
    id: string,
  ) => {
    return selectedItems.some((item) => item.type === type && item.id === id);
  };

  // Toggle la sélection d'un élément
  const toggleItemSelection = (item: SelectedItem) => {
    if (!deleteMode) return;

    setSelectedItems((prev) => {
      const exists = prev.some((i) => i.type === item.type && i.id === item.id);
      if (exists) {
        return prev.filter((i) => !(i.type === item.type && i.id === item.id));
      }
      return [...prev, item];
    });
  };

  // Handlers pour les clics sur les éléments en mode suppression
  const handleSectionClick = (sectionId: string) => {
    if (!deleteMode || !document) return;

    const section = document.sections.find((s) => s.sectionId === sectionId);
    if (!section) return;

    const isSelected = isItemSelected("section", sectionId);

    setSelectedItems((prev) => {
      if (isSelected) {
        const subsectionIds = section.subsections.map(
          (sub) => sub.subsectionId,
        );
        const lineIds = section.subsections.flatMap((sub) =>
          sub.lines.map((line) => line.lineId),
        );

        return prev.filter((item) => {
          if (item.type === "section" && item.id === sectionId) return false;
          if (item.type === "subsection" && subsectionIds.includes(item.id))
            return false;
          if (item.type === "line" && lineIds.includes(item.id)) return false;
          return true;
        });
      } else {
        const itemsToAdd: SelectedItem[] = [{ type: "section", id: sectionId }];

        for (const sub of section.subsections) {
          itemsToAdd.push({
            type: "subsection",
            id: sub.subsectionId,
            sectionId,
          });

          for (const line of sub.lines) {
            itemsToAdd.push({
              type: "line",
              id: line.lineId,
              subsectionId: sub.subsectionId,
              sectionId,
            });
          }
        }

        const existingIds = new Set(
          prev.map((item) => `${item.type}-${item.id}`),
        );
        const newItems = itemsToAdd.filter(
          (item) => !existingIds.has(`${item.type}-${item.id}`),
        );

        return [...prev, ...newItems];
      }
    });
  };

  const handleSubsectionClick = (subsectionId: string, sectionId: string) => {
    if (!deleteMode || !document) return;

    const section = document.sections.find((s) => s.sectionId === sectionId);
    const subsection = section?.subsections.find(
      (sub) => sub.subsectionId === subsectionId,
    );
    if (!subsection) return;

    const isSelected = isItemSelected("subsection", subsectionId);

    setSelectedItems((prev) => {
      if (isSelected) {
        const lineIds = subsection.lines.map((line) => line.lineId);

        return prev.filter((item) => {
          if (item.type === "subsection" && item.id === subsectionId)
            return false;
          if (item.type === "line" && lineIds.includes(item.id)) return false;
          return true;
        });
      } else {
        const itemsToAdd: SelectedItem[] = [
          { type: "subsection", id: subsectionId, sectionId },
        ];

        for (const line of subsection.lines) {
          itemsToAdd.push({
            type: "line",
            id: line.lineId,
            subsectionId,
            sectionId,
          });
        }

        const existingIds = new Set(
          prev.map((item) => `${item.type}-${item.id}`),
        );
        const newItems = itemsToAdd.filter(
          (item) => !existingIds.has(`${item.type}-${item.id}`),
        );

        return [...prev, ...newItems];
      }
    });
  };

  const handleLineClick = (
    lineId: string,
    subsectionId: string,
    sectionId: string,
  ) => {
    toggleItemSelection({
      type: "line",
      id: lineId,
      subsectionId,
      sectionId,
    });
  };

  // Reset la sélection quand on quitte le mode suppression
  useEffect(() => {
    if (!deleteMode) {
      setSelectedItems([]);
    }
  }, [deleteMode]);

  // Confirmer la suppression des éléments sélectionnés
  const handleConfirmDeleteItems = () => {
    if (selectedItems.length > 0 && onRemoveItems) {
      onRemoveItems(selectedItems);
      setSelectedItems([]);
      setDeleteMode(false);
    }
  };

  // Compter les éléments sélectionnés par type
  const getSelectionSummary = () => {
    const sections = selectedItems.filter((i) => i.type === "section").length;
    const subsections = selectedItems.filter(
      (i) => i.type === "subsection",
    ).length;
    const lines = selectedItems.filter((i) => i.type === "line").length;
    const parts = [];
    if (sections > 0)
      parts.push(`${sections} section${sections > 1 ? "s" : ""}`);
    if (subsections > 0)
      parts.push(`${subsections} sous-section${subsections > 1 ? "s" : ""}`);
    if (lines > 0) parts.push(`${lines} ligne${lines > 1 ? "s" : ""}`);
    return parts.join(", ");
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

  const handleSignatureSave = (signature: string) => {
    if (onDocumentUpdate) {
      onDocumentUpdate("signature", signature);
    }
  };

  const handleDownload = async (format: DownloadFormat) => {
    if (!document) return;

    setShowDownloadMenu(false);
    setIsGeneratingPDF(true);

    try {
      const isInvoice = document.type === "invoice";
      const baseFileName = isInvoice
        ? `Facture_${document.number}`
        : `Devis_${document.number}`;

      // Generate PDF document component
      const pdfDocument =
        document.type === "quote" ? (
          <QuotePDFTemplate
            data={mapToQuoteTemplateData(document)}
            accentColor={accentColor}
            signature={document.signature}
          />
        ) : (
          <InvoicePDFTemplate
            data={mapToInvoiceTemplateData(document)}
            accentColor={accentColor}
          />
        );

      switch (format) {
        case "pdf": {
          // Standard PDF download
          const blob = await pdf(pdfDocument).toBlob();
          const url = URL.createObjectURL(blob);
          const link = window.document.createElement("a");
          link.href = url;
          link.download = `${baseFileName}.pdf`;
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
          URL.revokeObjectURL(url);
          break;
        }

        case "facturx": {
          // Factur-X PDF (PDF with embedded XML) - only for invoices
          if (!isInvoice) {
            // Fallback to standard PDF for quotes
            const blob = await pdf(pdfDocument).toBlob();
            const url = URL.createObjectURL(blob);
            const link = window.document.createElement("a");
            link.href = url;
            link.download = `${baseFileName}.pdf`;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } else {
            const pdfBlob = await pdf(pdfDocument).toBlob();
            const xmlContent = generateFacturXXml(
              mapToInvoiceTemplateData(document),
            );
            const facturxBlob = await createFacturXPdf(pdfBlob, xmlContent);
            const url = URL.createObjectURL(facturxBlob);
            const link = window.document.createElement("a");
            link.href = url;
            link.download = `${baseFileName}_facturx.pdf`;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          break;
        }

        case "xml": {
          // XML download - only for invoices
          if (isInvoice) {
            downloadXml(mapToInvoiceTemplateData(document));
          }
          break;
        }

        case "excel": {
          // Excel download
          downloadExcel(document);
          break;
        }
      }
    } catch (error) {
      console.error("Error generating document:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Google Docs style toolbar */}
      {document && (
        <div className="relative border-b bg-background shrink-0">
          <div className="flex items-center flex-wrap min-h-12 py-1.5 px-2 gap-1">
            {/* Left group: Add elements - inline buttons */}
            <div
              className="flex items-center gap-1"
              data-tour-id="tour-add-elements"
            >
              {onAddSection && (
                <button
                  className="flex items-center justify-center h-9 w-9 rounded hover:bg-muted transition-colors"
                  onClick={onAddSection}
                  title="Ajouter une section"
                >
                  <Layers className="h-5 w-5" />
                </button>
              )}
              {onAddSubsection && (
                <button
                  className="flex items-center justify-center h-9 w-9 rounded hover:bg-muted transition-colors"
                  onClick={() => onAddSubsection()}
                  title="Ajouter une sous-section"
                >
                  <LayoutList className="h-5 w-5" />
                </button>
              )}
              {onAddLine && (
                <button
                  className="flex items-center justify-center h-9 w-9 rounded hover:bg-muted transition-colors"
                  onClick={() => onAddLine()}
                  title="Ajouter une ligne"
                >
                  <ListPlus className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Delete mode button */}
            {onRemoveItems && (
              <>
                <button
                  className={`flex items-center gap-1.5 h-9 px-2.5 rounded transition-colors ${
                    deleteMode
                      ? "bg-destructive/10 text-destructive"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setDeleteMode(!deleteMode)}
                  title={
                    deleteMode
                      ? "Annuler la sélection"
                      : "Supprimer des éléments"
                  }
                  data-tour-id="tour-remove-button"
                >
                  <Minus className="h-5 w-5" />
                  {deleteMode && <X className="h-3.5 w-3.5" />}
                </button>

                {/* Confirmation button when items selected */}
                {deleteMode && selectedItems.length > 0 && (
                  <button
                    className="flex items-center h-7 px-2.5 ml-1 rounded bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors animate-in fade-in slide-in-from-left-2 duration-200"
                    onClick={handleConfirmDeleteItems}
                  >
                    Supprimer ({getSelectionSummary()})
                  </button>
                )}
              </>
            )}

            {/* Separator - hidden on mobile */}
            <div className="hidden sm:block w-px h-6 bg-border mx-2" />

            {/* Middle group: Styling */}
            <button
              ref={colorButtonRef}
              className={`flex items-center justify-center h-9 w-9 rounded transition-colors ${
                showColorPicker ? "bg-muted" : "hover:bg-muted"
              }`}
              onClick={() => {
                if (colorButtonRef.current) {
                  const rect = colorButtonRef.current.getBoundingClientRect();
                  const popoverWidth = 252;
                  let left = rect.left + rect.width / 2 - popoverWidth / 2;
                  left = Math.max(
                    8,
                    Math.min(left, window.innerWidth - popoverWidth - 8),
                  );
                  setPopoverPosition({ left, top: rect.bottom + 8 });
                }
                setShowColorPicker(!showColorPicker);
              }}
              title="Couleur d'accent"
              data-tour-id="tour-color-button"
            >
              <div className="relative">
                <Palette className="h-5 w-5" />
                {accentColor && (
                  <div
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </div>
            </button>

            {/* Separator - hidden on mobile */}
            <div className="hidden sm:block w-px h-6 bg-border mx-2" />

            {/* Document actions group */}
            {document.type === "quote" && (
              <button
                className="flex items-center justify-center h-9 w-9 rounded hover:bg-muted transition-colors"
                onClick={() => setShowSignatureModal(true)}
                title="Signer le document"
                data-tour-id="tour-signature-button"
              >
                <PenLine className="h-5 w-5" />
              </button>
            )}
            {document.type === "quote" && onConvertToInvoice && (
              <button
                className="flex items-center justify-center h-9 w-9 rounded hover:bg-muted transition-colors"
                onClick={handleConvertClick}
                title="Convertir en facture"
                data-tour-id="tour-convert-button"
              >
                <Receipt className="h-5 w-5" />
              </button>
            )}
            <button
              ref={clientButtonRef}
              className={`flex items-center justify-center h-9 w-9 rounded transition-colors hover:bg-muted ${
                showClientMenu ? "bg-muted" : ""
              }`}
              onClick={() => {
                if (document.client?.id) {
                  handleClientButtonClick();
                } else {
                  if (clientButtonRef.current) {
                    const rect =
                      clientButtonRef.current.getBoundingClientRect();
                    const popoverWidth = 220;
                    let left = rect.left + rect.width / 2 - popoverWidth / 2;
                    left = Math.max(
                      8,
                      Math.min(left, window.innerWidth - popoverWidth - 8),
                    );
                    setPopoverPosition({ left, top: rect.bottom + 8 });
                  }
                  setShowClientMenu(!showClientMenu);
                }
              }}
              title={
                document.client?.id ? "Voir la fiche client" : "Lier un client"
              }
              data-tour-id="tour-client-button"
            >
              <User className="h-5 w-5" />
            </button>

            {/* Separator - hidden on mobile */}
            <div className="hidden sm:block w-px h-6 bg-border mx-2" />

            {/* Export group */}
            <button
              ref={downloadButtonRef}
              className={`flex items-center justify-center h-9 w-9 rounded transition-colors disabled:opacity-40 ${
                showDownloadMenu ? "bg-muted" : "hover:bg-muted"
              }`}
              onClick={() => {
                if (downloadButtonRef.current) {
                  const rect =
                    downloadButtonRef.current.getBoundingClientRect();
                  const popoverWidth = 240;
                  let left = rect.left + rect.width / 2 - popoverWidth / 2;
                  left = Math.max(
                    8,
                    Math.min(left, window.innerWidth - popoverWidth - 8),
                  );
                  setPopoverPosition({ left, top: rect.bottom + 8 });
                }
                setShowDownloadMenu(!showDownloadMenu);
              }}
              disabled={isGeneratingPDF}
              title="Télécharger"
              data-tour-id="tour-download-button"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
            </button>

            {/* Separator - hidden on mobile */}
            <div className="hidden sm:block w-px h-6 bg-border mx-2" />

            {/* Delete document */}
            <button
              className="flex items-center justify-center h-9 w-9 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={handleDeleteClick}
              title="Supprimer le document"
              data-tour-id="tour-delete-button"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            {/* Spacer - only on larger screens */}
            <div className="hidden sm:block flex-1 min-w-4" />

            {/* Right side: Status */}
            {isSaving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Sauvegarde...
              </span>
            )}

            {/* Switch to chat button - visible on screens smaller than xl */}
            {onSwitchToChat && (
              <button
                className="xl:hidden flex items-center justify-center h-9 w-9 rounded hover:bg-muted transition-colors"
                onClick={onSwitchToChat}
                title="Voir la conversation"
                data-tour-id="tour-switch-chat-button"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Color picker popover */}
          {showColorPicker && (
            <div
              ref={colorPopoverRef}
              className="fixed z-50 bg-popover border rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200"
              style={{ left: popoverPosition.left, top: popoverPosition.top }}
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-popover border-l border-t rounded-tl-sm" />
              <p className="text-sm font-medium mb-3">Couleur d&apos;accent</p>
              <HexColorPicker
                color={accentColor || "#000000"}
                onChange={(color) => onAccentColorChange?.(color)}
                style={{ width: "220px", height: "180px" }}
              />
              <button
                className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => onAccentColorChange?.(null)}
              >
                Réinitialiser
              </button>
            </div>
          )}

          {/* Client menu popover */}
          {showClientMenu && !document.client?.id && (
            <div
              ref={clientMenuRef}
              className="fixed z-50 bg-popover border rounded-2xl shadow-2xl p-2 min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-200"
              style={{ left: popoverPosition.left, top: popoverPosition.top }}
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-popover border-l border-t rounded-tl-sm" />
              <p className="text-xs font-medium text-muted-foreground px-2 py-1.5 mb-1">
                Ajouter un client
              </p>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                onClick={() => {
                  setShowClientMenu(false);
                  setShowClientPicker(true);
                }}
              >
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                Lier un client existant
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                onClick={() => {
                  setShowClientMenu(false);
                  setShowNewClientModal(true);
                }}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                Créer un nouveau client
              </button>
            </div>
          )}

          {/* Download menu popover */}
          {showDownloadMenu && (
            <div
              ref={downloadMenuRef}
              className="fixed z-50 bg-popover border rounded-2xl shadow-2xl p-2 min-w-[240px] animate-in fade-in slide-in-from-top-2 duration-200"
              style={{ left: popoverPosition.left, top: popoverPosition.top }}
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-popover border-l border-t rounded-tl-sm" />
              <p className="text-xs font-medium text-muted-foreground px-2 py-1.5 mb-1">
                Télécharger
              </p>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                onClick={() => handleDownload("pdf")}
                disabled={isGeneratingPDF}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                PDF Standard
              </button>
              {document.type === "invoice" && (
                <>
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                    onClick={() => handleDownload("facturx")}
                    disabled={isGeneratingPDF}
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="flex-1">PDF Factur-X</span>
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Recommandé
                    </span>
                  </button>
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                    onClick={() => handleDownload("xml")}
                    disabled={isGeneratingPDF}
                  >
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    XML Factur-X
                  </button>
                </>
              )}
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                onClick={() => handleDownload("excel")}
                disabled={isGeneratingPDF}
              >
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                Excel
              </button>
            </div>
          )}
        </div>
      )}

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
                data-tour-id="tour-document-preview"
              >
                <QuoteTemplate
                  data={mapToQuoteTemplateData(document)}
                  onUpdate={onDocumentUpdate}
                  deleteMode={deleteMode}
                  isItemSelected={isItemSelected}
                  onSectionClick={handleSectionClick}
                  onSubsectionClick={handleSubsectionClick}
                  onLineClick={handleLineClick}
                  accentColor={accentColor}
                  signature={document.signature}
                />
              </div>
            ) : (
              <div
                ref={documentRef}
                className="w-full max-w-2xl rounded-lg border bg-background shadow-sm"
                data-tour-id="tour-document-preview"
              >
                <InvoiceTemplate
                  data={mapToInvoiceTemplateData(document)}
                  onUpdate={onDocumentUpdate}
                  deleteMode={deleteMode}
                  isItemSelected={isItemSelected}
                  onSectionClick={handleSectionClick}
                  onSubsectionClick={handleSubsectionClick}
                  onLineClick={handleLineClick}
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

      {/* Input for screens smaller than xl */}
      {showMobileInput && mobileInputComponent && (
        <div className="xl:hidden border-t bg-background">
          {mobileInputComponent}
        </div>
      )}

      {/* Signature Modal */}
      {document?.type === "quote" && (
        <SignatureModal
          open={showSignatureModal}
          onOpenChange={setShowSignatureModal}
          onSave={handleSignatureSave}
          existingSignature={document.signature}
        />
      )}

      {/* Client Picker Modal */}
      <ClientPickerModal
        clients={clients}
        isOpen={showClientPicker}
        onClose={() => setShowClientPicker(false)}
        onSelect={handleClientSelect}
      />

      {/* New Client Modal */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onClientCreated={handleNewClientCreated}
      />
    </div>
  );
}
