"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Mic, MicOff } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Chat, type ChatRef } from "@/components/edition/chat";
import { DocumentPreview } from "@/components/edition/document-preview";
import { QuotePDFTemplate } from "@/components/edition/quote-pdf-template";
import { InvoicePDFTemplate } from "@/components/edition/invoice-pdf-template";
import { OnboardingTutorial } from "@/components/edition/onboarding-tutorial";
import type {
  DocumentData,
  LineItem,
  QuoteData,
  InvoiceData,
} from "@/lib/types/document";
import {
  calculateTotals,
  calculateLineTotal,
  convertQuoteToInvoice,
  recalculateSectionTotals,
  documentDataToContent,
  generateLineId,
} from "@/lib/types/document";
import type { Company, Client } from "@/lib/supabase/types";

interface EditionClientProps {
  userInitial: string;
  company: Company | null;
  clients: Client[];
  initialNextQuoteNumber: string;
  initialNextInvoiceNumber: string;
  initialDocument?: DocumentData | null;
  initialAccentColor?: string | null;
}

export function EditionClient({
  userInitial,
  company,
  clients: initialClients,
  initialNextQuoteNumber,
  initialNextInvoiceNumber,
  initialDocument = null,
  initialAccentColor = null,
}: EditionClientProps) {
  const [document, setDocument] = useState<DocumentData | null>(
    initialDocument,
  );
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [nextQuoteNumber, setNextQuoteNumber] = useState(
    initialNextQuoteNumber,
  );
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(
    initialNextInvoiceNumber,
  );
  const [accentColor, setAccentColor] = useState<string | null>(
    initialAccentColor,
  );
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");
  const [showTutorial, setShowTutorial] = useState(false);
  const chatRef = useRef<ChatRef>(null);
  const searchParams = useSearchParams();

  // Check if tutorial should be shown (only after setup, once)
  useEffect(() => {
    const fromSetup = searchParams.get("fromSetup") === "true";
    const forceTutorial = searchParams.get("tutorial") === "1";

    // Force tutorial for testing via ?tutorial=1
    if (forceTutorial) {
      localStorage.removeItem("buildify_tutorial_completed");
      setShowTutorial(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("tutorial");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    // Show tutorial after setup - this is the ONLY trigger for the tutorial
    // Clear any previous flag since setup means fresh start
    if (fromSetup) {
      localStorage.removeItem("buildify_tutorial_completed");
      setShowTutorial(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("fromSetup");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Sync document state when initialDocument changes (e.g., navigating to another document)
  useEffect(() => {
    setDocument(initialDocument);
    lastSavedContentRef.current = "";
  }, [initialDocument]);

  // Sync accent color when initialAccentColor changes
  useEffect(() => {
    setAccentColor(initialAccentColor);
  }, [initialAccentColor]);
  const [clientSyncError, setClientSyncError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>("");

  const saveDocumentToDatabase = useCallback(async (doc: DocumentData) => {
    if (!doc.id) return;

    const content = documentDataToContent(doc);
    const clientId = doc.client?.id ? String(doc.client.id) : null;
    // Include both content AND client_id in comparison to detect all changes
    const saveKey = JSON.stringify({ content, client_id: clientId });

    if (saveKey === lastSavedContentRef.current) {
      return;
    }

    setIsSaving(true);
    try {
      const type = doc.type === "quote" ? "quote" : "invoice";
      const response = await fetch(`/api/documents?id=${doc.id}&type=${type}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          client_id: doc.client?.id ? String(doc.client.id) : null,
        }),
      });

      if (response.ok) {
        lastSavedContentRef.current = saveKey;
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const debouncedSave = useCallback(
    (doc: DocumentData) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveDocumentToDatabase(doc);
      }, 1000);
    },
    [saveDocumentToDatabase],
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (document?.id) {
      debouncedSave(document);
    }
  }, [document, debouncedSave]);

  const handleDocumentChange = useCallback(
    (newDocument: DocumentData | null) => {
      setDocument(newDocument);

      // Update next numbers when document is created
      if (newDocument?.number) {
        if (newDocument.type === "quote") {
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
    },
    [],
  );

  const handleAccentColorChange = useCallback(
    async (color: string | null) => {
      setAccentColor(color);

      // Save color to database if document exists
      if (document?.id) {
        const type = document.type === "quote" ? "quote" : "invoice";
        try {
          await fetch(`/api/documents?id=${document.id}&type=${type}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ color }),
          });
        } catch (error) {
          console.error("Failed to save color:", error);
        }
      }
    },
    [document],
  );

  const handleDocumentUpdate = useCallback(
    (path: string, value: string | number) => {
      if (!document) return;

      // Protected fields - only editable via Settings
      const protectedPaths = [
        "number",
        "date",
        "company.name",
        "company.address",
        "company.city",
        "company.phone",
        "company.email",
        "company.siret",
        "company.logoUrl",
        "company.paymentTerms",
        "company.legalNotice",
        "paymentConditions",
      ];

      if (protectedPaths.includes(path) || path.startsWith("company.")) {
        console.warn(
          `Tentative de modification d'un champ protégé: ${path}. Utilisez les Paramètres.`,
        );
        return;
      }

      setDocument((prev) => {
        if (!prev) return prev;

        const updated = { ...prev };
        const parts = path.split(".");

        if (parts[0] === "items" && parts.length >= 3) {
          const index = parseInt(parts[1], 10);
          const field = parts[2];
          const items = [...prev.items];
          const item = { ...items[index] };

          (item as Record<string, unknown>)[field] = value;

          if (
            !item.isSection &&
            (field === "unitPrice" || field === "tva" || field === "quantity")
          ) {
            const qty = parseFloat(
              String(field === "quantity" ? value : item.quantity)?.replace(
                /[^\d.]/g,
                "",
              ) || "0",
            );
            const price =
              field === "unitPrice" ? (value as number) : item.unitPrice || 0;
            item.total = calculateLineTotal(qty, price);

            if (field === "tva") {
              updated.tvaRate = value as number;
            }
          }

          items[index] = item;
          const recalculatedItems = recalculateSectionTotals(items);
          updated.items = recalculatedItems;

          const totals = calculateTotals(
            recalculatedItems,
            updated.tvaRate,
            updated.deposit,
          );
          updated.totalHT = totals.totalHT;
          updated.tvaAmount = totals.tvaAmount;
          updated.totalTTC = totals.totalTTC;
        } else if (parts[0] === "client" && parts.length === 2) {
          updated.client = { ...prev.client, [parts[1]]: value };
        } else if (path === "tvaRate" || path === "deposit") {
          (updated as Record<string, unknown>)[path] = value;
          const totals = calculateTotals(
            updated.items,
            path === "tvaRate" ? (value as number) : updated.tvaRate,
            path === "deposit" ? (value as number) : updated.deposit,
          );
          updated.totalHT = totals.totalHT;
          updated.tvaAmount = totals.tvaAmount;
          updated.totalTTC = totals.totalTTC;
        } else {
          (updated as Record<string, unknown>)[path] = value;
        }

        return updated;
      });
    },
    [document],
  );

  const handleDeleteDocument = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!document) {
      return { success: false, error: "Aucun document à supprimer" };
    }

    // Delete from database if document has an ID
    if (document.id) {
      const type = document.type === "quote" ? "quote" : "invoice";
      try {
        const response = await fetch(
          `/api/documents?id=${document.id}&type=${type}`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          const data = await response.json();
          return {
            success: false,
            error: data.error || "Erreur de suppression",
          };
        }
      } catch (error) {
        console.error("Delete error:", error);
        return { success: false, error: "Erreur de connexion" };
      }
    }

    setDocument(null);
    return { success: true };
  };

  const handleConvertToInvoice = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!document || document.type !== "quote") {
      return { success: false, error: "Aucun devis à convertir" };
    }

    const invoiceData = convertQuoteToInvoice(
      document as QuoteData,
      nextInvoiceNumber,
    );

    // Create invoice in database
    try {
      const { documentDataToContent } = await import("@/lib/types/document");
      const content = documentDataToContent(invoiceData);

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "invoice",
          client_id: invoiceData.client.id || null,
          number: invoiceData.number,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          content,
          color: accentColor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.error || "Erreur de création" };
      }

      const { document: createdInvoice } = await response.json();

      // Update local state with the created invoice
      setDocument({
        ...invoiceData,
        id: createdInvoice.id,
      });

      // Update next invoice number
      const parts = nextInvoiceNumber.split("-");
      if (parts.length === 3) {
        const nextSeq = (parseInt(parts[2], 10) + 1)
          .toString()
          .padStart(4, "0");
        setNextInvoiceNumber(`${parts[0]}-${parts[1]}-${nextSeq}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Convert to invoice error:", error);
      return { success: false, error: "Erreur de connexion" };
    }
  };

  const handleAddLine = useCallback(() => {
    if (!document) return;

    setDocument((prev) => {
      if (!prev) return prev;

      const nonSectionItems = prev.items.filter((item) => !item.isSection);
      const sections = prev.items.filter((item) => item.isSection);
      const lastSection = sections[sections.length - 1];

      // Numéro d'affichage (pas l'identifiant technique)
      let displayId: string;
      if (lastSection) {
        const sectionNumber = lastSection.id;
        const sectionItems = prev.items.filter(
          (item) => !item.isSection && item.id.startsWith(`${sectionNumber}.`),
        );
        displayId = `${sectionNumber}.${sectionItems.length + 1}`;
      } else {
        displayId = `${nonSectionItems.length + 1}`;
      }

      const newLine: LineItem = {
        lineId: generateLineId(), // UUID stable et unique
        id: displayId, // Numéro d'affichage uniquement
        designation: "",
        description: "",
        quantity: "1",
        unitPrice: 0,
        tva: prev.tvaRate,
        total: 0,
        isSection: false,
      };

      const newItems = [...prev.items, newLine];
      const recalculatedItems = recalculateSectionTotals(newItems);
      const totals = calculateTotals(
        recalculatedItems,
        prev.tvaRate,
        prev.deposit,
      );

      return {
        ...prev,
        items: recalculatedItems,
        ...totals,
      };
    });
  }, [document]);

  const handleRemoveLines = useCallback(
    (lineIndices: number[]) => {
      if (!document || lineIndices.length === 0) return;

      setDocument((prev) => {
        if (!prev) return prev;

        // Trier les indices en ordre décroissant pour supprimer de la fin
        const sortedIndices = [...lineIndices].sort((a, b) => b - a);
        const indexSet = new Set(sortedIndices);

        const newItems = prev.items.filter((_, index) => !indexSet.has(index));
        const recalculatedItems = recalculateSectionTotals(newItems);
        const totals = calculateTotals(
          recalculatedItems,
          prev.tvaRate,
          prev.deposit,
        );

        return {
          ...prev,
          items: recalculatedItems,
          ...totals,
        };
      });
    },
    [document],
  );

  const handleClientCreated = useCallback((newClient: Client) => {
    setClients((prev) => {
      if (prev.some((c) => c.id === newClient.id)) {
        return prev;
      }
      return [...prev, newClient];
    });
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!document) return;

    const mapToQuoteTemplateData = (doc: QuoteData) => ({
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
    });

    const mapToInvoiceTemplateData = (doc: InvoiceData) => ({
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
    });

    try {
      const pdfDocument =
        document.type === "quote" ? (
          <QuotePDFTemplate
            data={mapToQuoteTemplateData(document as QuoteData)}
            accentColor={accentColor}
          />
        ) : (
          <InvoicePDFTemplate
            data={mapToInvoiceTemplateData(document as InvoiceData)}
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
    }
  }, [document, accentColor]);

  // Mobile chat input state
  const [mobileInput, setMobileInput] = useState("");
  const [isMobileRecording, setIsMobileRecording] = useState(false);
  const mobileRecognitionRef = useRef<SpeechRecognition | null>(null);

  const handleMobileSendMessage = useCallback(async () => {
    if (!mobileInput.trim() || chatRef.current?.isLoading || !document) return;

    const messageContent = mobileInput.trim();
    setMobileInput("");

    // Use the Chat component's sendMessage via ref to keep messages synchronized
    await chatRef.current?.sendMessage(messageContent);
  }, [mobileInput, document]);

  const toggleMobileRecording = useCallback(() => {
    if (isMobileRecording) {
      if (mobileRecognitionRef.current) {
        mobileRecognitionRef.current.stop();
        mobileRecognitionRef.current = null;
      }
      setIsMobileRecording(false);
    } else {
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        return;
      }

      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();

      recognition.lang = "fr-FR";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsMobileRecording(true);
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setMobileInput((prev) => prev + (prev ? " " : "") + finalTranscript);
        }
      };
      recognition.onerror = () => {
        setIsMobileRecording(false);
        mobileRecognitionRef.current = null;
      };
      recognition.onend = () => setIsMobileRecording(false);

      mobileRecognitionRef.current = recognition;
      recognition.start();
    }
  }, [isMobileRecording]);

  const mobileInputComponent = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleMobileSendMessage();
      }}
      className="p-4"
    >
      <div className="flex gap-2">
        <Button
          type="button"
          variant={isMobileRecording ? "destructive" : "outline"}
          size="icon"
          className={`shrink-0 ${isMobileRecording ? "animate-pulse" : ""}`}
          onClick={toggleMobileRecording}
        >
          {isMobileRecording ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
        <Textarea
          value={mobileInput}
          onChange={(e) => setMobileInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleMobileSendMessage();
            }
          }}
          placeholder="Modifier le document..."
          className="min-h-10 max-h-32 resize-none"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!mobileInput.trim() || chatRef.current?.isLoading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );

  // Hide document preview in initial state (no document)
  const showDocumentPreview = document !== null;

  return (
    <>
      {showTutorial && (
        <OnboardingTutorial
          documentType={document?.type}
          onComplete={() => setShowTutorial(false)}
        />
      )}
      <div
        className={`grid h-full grid-cols-1 ${showDocumentPreview ? "2xl:grid-cols-2" : ""} overflow-hidden`}
      >
        {/* Chat - visible on desktop (2xl+), or on smaller screens when mobileView is "chat" */}
        <div
          className={`h-full overflow-hidden ${showDocumentPreview ? "2xl:border-r" : ""} ${
            showDocumentPreview && mobileView === "preview"
              ? "hidden 2xl:block"
              : ""
          }`}
        >
          <Chat
            ref={chatRef}
            userInitial={userInitial}
            company={company}
            clients={clients}
            document={document}
            onDocumentChange={handleDocumentChange}
            nextQuoteNumber={nextQuoteNumber}
            nextInvoiceNumber={nextInvoiceNumber}
            isEditingExisting={!!initialDocument}
            accentColor={accentColor}
            onAccentColorChange={handleAccentColorChange}
            onClientCreated={handleClientCreated}
            onSwitchToPreview={() => setMobileView("preview")}
            onDownloadPdf={handleDownloadPdf}
            onConvertToInvoice={handleConvertToInvoice}
          />
        </div>

        {/* Document Preview - visible on desktop (2xl+), or on smaller screens when mobileView is "preview" */}
        {showDocumentPreview && (
          <div
            className={`h-full overflow-hidden ${
              mobileView === "chat" ? "hidden 2xl:block" : ""
            }`}
          >
            <DocumentPreview
              document={document}
              onDeleteDocument={handleDeleteDocument}
              onDocumentUpdate={handleDocumentUpdate}
              onConvertToInvoice={handleConvertToInvoice}
              onAddLine={handleAddLine}
              onRemoveLines={handleRemoveLines}
              accentColor={accentColor}
              onAccentColorChange={handleAccentColorChange}
              clientSyncError={clientSyncError}
              onClientSyncErrorClear={() => setClientSyncError(null)}
              isSaving={isSaving}
              showMobileInput={mobileView === "preview"}
              mobileInputComponent={mobileInputComponent}
              onSwitchToChat={() => setMobileView("chat")}
            />
          </div>
        )}
      </div>
    </>
  );
}
