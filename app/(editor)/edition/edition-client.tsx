"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import { Chat, type ChatRef, type QuotaInfo } from "@/components/edition/chat";
import { ChatWidget } from "@/components/edition/chat-widget";
import { DocumentPreview } from "@/components/edition/document-preview";
import { QuotePDFTemplate } from "@/components/edition/quote-pdf-template";
import { InvoicePDFTemplate } from "@/components/edition/invoice-pdf-template";
import { OnboardingTutorial } from "@/components/edition/onboarding-tutorial";
import type {
  DocumentData,
  QuoteData,
  InvoiceData,
  Section,
  LineItem,
} from "@/lib/types/document";
import {
  calculateTotals,
  calculateLineTotal,
  calculateSubsectionTotal,
  calculateSectionTotal,
  convertQuoteToInvoice,
  recalculateAllTotals,
  documentDataToContent,
  generateId,
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
  initialQuota: QuotaInfo;
}

export function EditionClient({
  userInitial,
  company,
  clients: initialClients,
  initialNextQuoteNumber,
  initialNextInvoiceNumber,
  initialDocument = null,
  initialAccentColor = null,
  initialQuota,
}: EditionClientProps) {
  const [document, setDocument] = useState<DocumentData | null>(
    initialDocument,
  );
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [quota, setQuota] = useState<QuotaInfo>(initialQuota);
  const [nextQuoteNumber, setNextQuoteNumber] = useState(
    initialNextQuoteNumber,
  );
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(
    initialNextInvoiceNumber,
  );
  const [accentColor, setAccentColor] = useState<string | null>(
    initialAccentColor,
  );
  const [showTutorial, setShowTutorial] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatRef = useRef<ChatRef>(null);
  const searchParams = useSearchParams();

  // Check if tutorial should be shown (only after setup, once)
  useEffect(() => {
    const fromSetup = searchParams.get("fromSetup") === "true";
    const forceTutorial = searchParams.get("tutorial") === "1";

    // Force tutorial for testing via ?tutorial=1
    if (forceTutorial) {
      localStorage.removeItem("buildify_tutorial_completed");
      sessionStorage.setItem("buildify_tutorial_active", "true");
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
      sessionStorage.setItem("buildify_tutorial_active", "true");
      setShowTutorial(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("fromSetup");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    // Check if tutorial was active (handles browser back/forward navigation)
    const tutorialActive =
      sessionStorage.getItem("buildify_tutorial_active") === "true";
    const tutorialCompleted =
      localStorage.getItem("buildify_tutorial_completed") === "true";
    if (tutorialActive && !tutorialCompleted) {
      setShowTutorial(true);
    } else {
      setShowTutorial(false);
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

        // Handle hierarchical paths: sections.{id}.label, subsections.{id}.label, lines.{id}.{field}
        if (parts[0] === "sections" && parts.length === 3) {
          const sectionId = parts[1];
          // parts[2] is the field name (e.g., "label")
          updated.sections = prev.sections.map((section) =>
            section.sectionId === sectionId
              ? { ...section, sectionLabel: String(value) }
              : section,
          );
        } else if (parts[0] === "subsections" && parts.length === 3) {
          const subsectionId = parts[1];
          updated.sections = prev.sections.map((section) => ({
            ...section,
            subsections: section.subsections.map((subsection) =>
              subsection.subsectionId === subsectionId
                ? { ...subsection, subsectionLabel: String(value) }
                : subsection,
            ),
          }));
        } else if (parts[0] === "lines" && parts.length === 3) {
          const lineId = parts[1];
          const field = parts[2];
          updated.sections = prev.sections.map((section) => ({
            ...section,
            subsections: section.subsections.map((subsection) => {
              const updatedLines = subsection.lines.map((line) => {
                if (line.lineId !== lineId) return line;

                const updatedLine = { ...line };
                if (field === "designation") {
                  updatedLine.designation = String(value);
                } else if (field === "description") {
                  updatedLine.description = String(value);
                } else if (field === "quantity") {
                  updatedLine.quantity =
                    typeof value === "number" ? value : parseFloat(value) || 0;
                  updatedLine.totalHT = calculateLineTotal(
                    updatedLine.quantity,
                    updatedLine.unitPriceHT,
                  );
                } else if (field === "unitPriceHT") {
                  updatedLine.unitPriceHT =
                    typeof value === "number" ? value : parseFloat(value) || 0;
                  updatedLine.totalHT = calculateLineTotal(
                    updatedLine.quantity,
                    updatedLine.unitPriceHT,
                  );
                } else if (field === "vatRate") {
                  updatedLine.vatRate =
                    typeof value === "number" ? value : parseFloat(value) || 0;
                }
                return updatedLine;
              });

              return {
                ...subsection,
                lines: updatedLines,
                totalHT: calculateSubsectionTotal(updatedLines),
              };
            }),
          }));

          // Recalculate section totals
          updated.sections = updated.sections.map((section) => ({
            ...section,
            totalHT: calculateSectionTotal(section.subsections),
          }));

          // Recalculate document totals
          const totals = calculateTotals(
            updated.sections,
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
            updated.sections,
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

    // Redirect to fresh edition page with full reload
    window.location.href = "/edition";
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

      let sections = prev.sections.map((s) => ({
        ...s,
        subsections: s.subsections.map((sub) => ({
          ...sub,
          lines: [...sub.lines],
        })),
      }));

      // If no sections exist, create a default section with a subsection
      if (sections.length === 0) {
        const newSection: Section = {
          sectionId: generateId(),
          sectionNumber: "1",
          sectionLabel: "Section 1",
          totalHT: 0,
          subsections: [
            {
              subsectionId: generateId(),
              subsectionNumber: "1.1",
              subsectionLabel: "Sous-section 1.1",
              totalHT: 0,
              lines: [],
            },
          ],
        };
        sections = [newSection];
      }

      // Get last section and subsection
      const lastSectionIndex = sections.length - 1;
      const lastSection = sections[lastSectionIndex];

      if (lastSection.subsections.length === 0) {
        // Add a default subsection if none exists
        sections[lastSectionIndex] = {
          ...lastSection,
          subsections: [
            {
              subsectionId: generateId(),
              subsectionNumber: `${lastSection.sectionNumber}.1`,
              subsectionLabel: `Sous-section ${lastSection.sectionNumber}.1`,
              totalHT: 0,
              lines: [],
            },
          ],
        };
      }

      const updatedLastSection = sections[lastSectionIndex];
      const lastSubsectionIndex = updatedLastSection.subsections.length - 1;
      const lastSubsection =
        updatedLastSection.subsections[lastSubsectionIndex];
      const lineCount = lastSubsection.lines.length;
      const lineNumber = `${lastSubsection.subsectionNumber}.${lineCount + 1}`;

      const newLine: LineItem = {
        lineId: generateId(),
        lineNumber,
        designation: "",
        description: "",
        quantity: 1,
        unitPriceHT: 0,
        vatRate: prev.tvaRate,
        totalHT: 0,
      };

      // Add line to last subsection (immutably)
      sections[lastSectionIndex] = {
        ...updatedLastSection,
        subsections: updatedLastSection.subsections.map((sub, idx) =>
          idx === lastSubsectionIndex
            ? { ...sub, lines: [...sub.lines, newLine] }
            : sub,
        ),
      };

      // Recalculate totals
      const recalculatedSections = recalculateAllTotals(sections);
      const totals = calculateTotals(
        recalculatedSections,
        prev.tvaRate,
        prev.deposit,
      );

      return {
        ...prev,
        sections: recalculatedSections,
        ...totals,
      };
    });
  }, [document]);

  const handleAddSection = useCallback(() => {
    if (!document) return;

    setDocument((prev) => {
      if (!prev) return prev;

      const sectionNumber = String(prev.sections.length + 1);
      const subsectionNumber = `${sectionNumber}.1`;
      const lineNumber = `${subsectionNumber}.1`;

      const newLine: LineItem = {
        lineId: generateId(),
        lineNumber,
        designation: "",
        description: "",
        quantity: 1,
        unitPriceHT: 0,
        vatRate: prev.tvaRate,
        totalHT: 0,
      };

      const newSection: Section = {
        sectionId: generateId(),
        sectionNumber,
        sectionLabel: `Section ${sectionNumber}`,
        totalHT: 0,
        subsections: [
          {
            subsectionId: generateId(),
            subsectionNumber,
            subsectionLabel: `Sous-section ${subsectionNumber}`,
            totalHT: 0,
            lines: [newLine],
          },
        ],
      };

      return {
        ...prev,
        sections: [...prev.sections, newSection],
      };
    });
  }, [document]);

  const handleAddSubsection = useCallback(() => {
    if (!document) return;

    setDocument((prev) => {
      if (!prev) return prev;

      let sections = [...prev.sections];

      // If no sections exist, create one first
      if (sections.length === 0) {
        const newSection: Section = {
          sectionId: generateId(),
          sectionNumber: "1",
          sectionLabel: "Section 1",
          totalHT: 0,
          subsections: [],
        };
        sections = [newSection];
      }

      // Add subsection to the last section
      const lastSectionIndex = sections.length - 1;
      const lastSection = sections[lastSectionIndex];
      const subsectionNumber = `${lastSection.sectionNumber}.${lastSection.subsections.length + 1}`;
      const lineNumber = `${subsectionNumber}.1`;

      const newLine: LineItem = {
        lineId: generateId(),
        lineNumber,
        designation: "",
        description: "",
        quantity: 1,
        unitPriceHT: 0,
        vatRate: prev.tvaRate,
        totalHT: 0,
      };

      const newSubsection = {
        subsectionId: generateId(),
        subsectionNumber,
        subsectionLabel: `Sous-section ${subsectionNumber}`,
        totalHT: 0,
        lines: [newLine],
      };

      sections[lastSectionIndex] = {
        ...lastSection,
        subsections: [...lastSection.subsections, newSubsection],
      };

      return {
        ...prev,
        sections,
      };
    });
  }, [document]);

  type SelectedItem = {
    type: "section" | "subsection" | "line";
    id: string;
    sectionId?: string;
    subsectionId?: string;
  };

  const handleRemoveItems = useCallback(
    (items: SelectedItem[]) => {
      if (!document || items.length === 0) return;

      setDocument((prev) => {
        if (!prev) return prev;

        const sectionIds = new Set(
          items.filter((i) => i.type === "section").map((i) => i.id),
        );
        const subsectionIds = new Set(
          items.filter((i) => i.type === "subsection").map((i) => i.id),
        );
        const lineIds = new Set(
          items.filter((i) => i.type === "line").map((i) => i.id),
        );

        // Filter out deleted sections, subsections, and lines
        let updatedSections = prev.sections
          .filter((section) => !sectionIds.has(section.sectionId))
          .map((section) => ({
            ...section,
            subsections: section.subsections
              .filter(
                (subsection) => !subsectionIds.has(subsection.subsectionId),
              )
              .map((subsection) => ({
                ...subsection,
                lines: subsection.lines.filter(
                  (line) => !lineIds.has(line.lineId),
                ),
              })),
          }));

        // Renumber sections and their children
        updatedSections = updatedSections.map((section, sIdx) => {
          const newSectionNumber = String(sIdx + 1);
          return {
            ...section,
            sectionNumber: newSectionNumber,
            subsections: section.subsections.map((subsection, ssIdx) => {
              const newSubsectionNumber = `${newSectionNumber}.${ssIdx + 1}`;
              return {
                ...subsection,
                subsectionNumber: newSubsectionNumber,
                lines: subsection.lines.map((line, lIdx) => ({
                  ...line,
                  lineNumber: `${newSubsectionNumber}.${lIdx + 1}`,
                })),
              };
            }),
          };
        });

        // Recalculate totals
        const recalculatedSections = recalculateAllTotals(updatedSections);
        const totals = calculateTotals(
          recalculatedSections,
          prev.tvaRate,
          prev.deposit,
        );

        return {
          ...prev,
          sections: recalculatedSections,
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

  return (
    <>
      {showTutorial && (
        <OnboardingTutorial
          documentType={document?.type}
          onComplete={() => setShowTutorial(false)}
        />
      )}

      <div className="h-full overflow-hidden">
        {/* Welcome screen when no document */}
        {!document && (
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
            onDownloadPdf={handleDownloadPdf}
            onConvertToInvoice={handleConvertToInvoice}
            quota={quota}
            onQuotaChange={setQuota}
          />
        )}

        {/* Full-page document preview when document exists */}
        {document && (
          <>
            <div
              className={`h-full transition-all duration-200 ${isChatOpen ? "blur-[12px] sm:blur-none brightness-[0.98] sm:brightness-100 cursor-pointer sm:cursor-default" : ""}`}
              onClick={() => isChatOpen && setIsChatOpen(false)}
            >
              <DocumentPreview
                document={document}
                onDeleteDocument={handleDeleteDocument}
                onDocumentUpdate={handleDocumentUpdate}
                onDocumentChange={handleDocumentChange}
                onConvertToInvoice={handleConvertToInvoice}
                onAddSection={handleAddSection}
                onAddSubsection={handleAddSubsection}
                onAddLine={handleAddLine}
                onRemoveItems={handleRemoveItems}
                accentColor={accentColor}
                onAccentColorChange={handleAccentColorChange}
                clientSyncError={clientSyncError}
                onClientSyncErrorClear={() => setClientSyncError(null)}
                isSaving={isSaving}
                clients={clients}
                onClientCreated={handleClientCreated}
              />
            </div>

            {/* Floating chat widget */}
            <ChatWidget
              isOpen={isChatOpen}
              onOpenChange={setIsChatOpen}
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
              onDownloadPdf={handleDownloadPdf}
              onConvertToInvoice={handleConvertToInvoice}
              quota={quota}
              onQuotaChange={setQuota}
            />
          </>
        )}
      </div>
    </>
  );
}
