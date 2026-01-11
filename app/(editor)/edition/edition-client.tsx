"use client";

import { useState, useCallback, useRef } from "react";
import { Chat } from "@/components/edition/chat";
import { DocumentPreview } from "@/components/edition/document-preview";
import {
  deleteQuote,
  deleteInvoice,
  updateQuote,
  updateInvoice,
  getNextInvoiceNumber,
  createInvoiceWithContent,
  syncClientFromDocument,
} from "@/lib/supabase/api";
import type { DocumentData, LineItem, QuoteData } from "@/lib/types/document";
import {
  calculateTotals,
  calculateLineTotal,
  convertQuoteToInvoice,
} from "@/lib/types/document";
import type { Company, Client } from "@/lib/supabase/types";

function recalculateSectionTotals(items: LineItem[]): LineItem[] {
  const result: LineItem[] = [];
  let currentSectionIndex = -1;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.isSection) {
      if (currentSectionIndex >= 0) {
        let sectionTotal = 0;
        for (let j = currentSectionIndex + 1; j < i; j++) {
          if (!items[j].isSection) {
            sectionTotal += items[j].total || 0;
          }
        }
        result[currentSectionIndex] = {
          ...result[currentSectionIndex],
          sectionTotal,
        };
      }
      result.push({ ...item });
      currentSectionIndex = result.length - 1;
    } else {
      result.push({ ...item });
    }
  }

  if (currentSectionIndex >= 0) {
    let sectionTotal = 0;
    for (let j = currentSectionIndex + 1; j < result.length; j++) {
      if (!result[j].isSection) {
        sectionTotal += result[j].total || 0;
      }
    }
    result[currentSectionIndex] = {
      ...result[currentSectionIndex],
      sectionTotal,
    };
  }

  return result;
}

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
  clients,
  initialNextQuoteNumber,
  initialNextInvoiceNumber,
  initialDocument = null,
  initialAccentColor = null,
}: EditionClientProps) {
  const [document, setDocument] = useState<DocumentData | null>(
    initialDocument,
  );
  const [nextQuoteNumber, setNextQuoteNumber] = useState(
    initialNextQuoteNumber,
  );
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(
    initialNextInvoiceNumber,
  );
  const [accentColor, setAccentColor] = useState<string | null>(
    initialAccentColor,
  );

  const handleDocumentChange = (newDocument: DocumentData | null) => {
    setDocument(newDocument);
    // Numbers are now managed by the database, so we update them after document creation
    if (newDocument?.number) {
      if (newDocument.type === "quote") {
        // Increment the number for the next potential document
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
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousClientNameRef = useRef<string | undefined>(
    initialDocument?.client?.name,
  );

  const saveToDatabase = useCallback(async (doc: DocumentData) => {
    if (!doc.id) return;

    const { id, type, ...content } = doc;
    const contentWithoutIdType = { ...content, type };

    if (type === "quote") {
      await updateQuote(id, { content: contentWithoutIdType });
    } else {
      await updateInvoice(id, { content: contentWithoutIdType });
    }
  }, []);

  const handleAccentColorChange = useCallback(
    async (color: string | null) => {
      setAccentColor(color);

      // Save color to database if document exists
      if (document?.id) {
        if (document.type === "quote") {
          await updateQuote(document.id, { color });
        } else {
          await updateInvoice(document.id, { color });
        }
      }
    },
    [document],
  );

  const handleDocumentUpdate = useCallback(
    (path: string, value: string | number) => {
      if (!document) return;

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
        } else if (parts[0] === "company" && parts.length === 2) {
          updated.company = { ...prev.company, [parts[1]]: value };
        } else if (parts[0] === "client" && parts.length === 2) {
          updated.client = { ...prev.client, [parts[1]]: value };

          // Sync client when name, phone or email changes
          if (
            updated.id &&
            (parts[1] === "name" ||
              parts[1] === "phone" ||
              parts[1] === "email")
          ) {
            if (syncTimeoutRef.current) {
              clearTimeout(syncTimeoutRef.current);
            }
            syncTimeoutRef.current = setTimeout(async () => {
              const result = await syncClientFromDocument(
                updated.type,
                updated.id!,
                updated.client.id,
                {
                  name: updated.client.name,
                  phone: updated.client.phone,
                  email: updated.client.email,
                },
                previousClientNameRef.current,
              );

              if (result.success && result.client) {
                // Update the client ID and auto-fill phone/email when client is associated
                if (
                  result.action === "created" ||
                  result.action === "associated"
                ) {
                  setDocument((prev) => {
                    if (!prev) return prev;
                    const clientUpdate: typeof prev.client = {
                      ...prev.client,
                      id: result.client!.id,
                    };

                    if (result.action === "associated") {
                      // Client reconnu → remplir avec ses infos
                      const fullName = [
                        result.client!.first_name,
                        result.client!.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ");
                      clientUpdate.phone = result.client!.phone || "";
                      clientUpdate.email = result.client!.email || "";
                      if (fullName) {
                        clientUpdate.name = fullName;
                      }
                    } else if (result.action === "created") {
                      // Nouveau client (nom non reconnu) → vider téléphone et email
                      clientUpdate.phone = "";
                      clientUpdate.email = "";
                    }

                    const updatedDoc = {
                      ...prev,
                      client: clientUpdate,
                    };
                    // Save to database after auto-fill/clear
                    saveToDatabase(updatedDoc);
                    return updatedDoc;
                  });
                }
                // Update previous name reference
                previousClientNameRef.current = updated.client.name;
              }
            }, 500);
          }
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

        // Save to database with debounce
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          saveToDatabase(updated);
        }, 300);

        return updated;
      });
    },
    [document, saveToDatabase],
  );

  const handleDeleteDocument = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!document || !document.id) {
      return { success: false, error: "Aucun document à supprimer" };
    }

    let result: { success: boolean; error?: string };

    if (document.type === "quote") {
      result = await deleteQuote(document.id);
    } else {
      result = await deleteInvoice(document.id);
    }

    if (result.success) {
      setDocument(null);
    }

    return result;
  };

  const handleConvertToInvoice = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!document || document.type !== "quote") {
      return { success: false, error: "Aucun devis à convertir" };
    }

    const invoiceNumber = await getNextInvoiceNumber();
    const invoiceData = convertQuoteToInvoice(
      document as QuoteData,
      invoiceNumber,
    );

    const { type, ...contentWithoutType } = invoiceData;
    const contentForDb = { ...contentWithoutType, type };
    delete (contentForDb as Record<string, unknown>).id;

    const result = await createInvoiceWithContent(
      invoiceNumber,
      contentForDb,
      undefined,
      document.client.id,
    );

    if (result.success && result.invoice) {
      const newInvoice: DocumentData = {
        ...invoiceData,
        id: result.invoice.id,
      };
      setDocument(newInvoice);
      return { success: true };
    }

    return {
      success: false,
      error: result.error || "Erreur lors de la création",
    };
  };

  const handleAddLine = useCallback(() => {
    if (!document) return;

    setDocument((prev) => {
      if (!prev) return prev;

      // Generate new line ID
      const nonSectionItems = prev.items.filter((item) => !item.isSection);
      const sections = prev.items.filter((item) => item.isSection);
      const lastSection = sections[sections.length - 1];

      let newId: string;
      if (lastSection) {
        const sectionNumber = lastSection.id;
        const sectionItems = prev.items.filter(
          (item) => !item.isSection && item.id.startsWith(`${sectionNumber}.`),
        );
        newId = `${sectionNumber}.${sectionItems.length + 1}`;
      } else {
        newId = `${nonSectionItems.length + 1}`;
      }

      const newLine: LineItem = {
        id: newId,
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

      const updated = {
        ...prev,
        items: recalculatedItems,
        ...totals,
      };

      // Save to database with debounce
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveToDatabase(updated);
      }, 300);

      return updated;
    });
  }, [document, saveToDatabase]);

  const handleRemoveLine = useCallback(
    (lineIndex: number) => {
      if (!document) return;

      setDocument((prev) => {
        if (!prev) return prev;

        const newItems = prev.items.filter((_, index) => index !== lineIndex);
        const recalculatedItems = recalculateSectionTotals(newItems);
        const totals = calculateTotals(
          recalculatedItems,
          prev.tvaRate,
          prev.deposit,
        );

        const updated = {
          ...prev,
          items: recalculatedItems,
          ...totals,
        };

        // Save to database with debounce
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          saveToDatabase(updated);
        }, 300);

        return updated;
      });
    },
    [document, saveToDatabase],
  );

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-2 overflow-hidden">
      <div className="border-r h-full overflow-hidden">
        <Chat
          userInitial={userInitial}
          company={company}
          clients={clients}
          document={document}
          onDocumentChange={handleDocumentChange}
          nextQuoteNumber={nextQuoteNumber}
          nextInvoiceNumber={nextInvoiceNumber}
          isEditingExisting={!!initialDocument}
          onAccentColorChange={handleAccentColorChange}
        />
      </div>
      <div className="hidden lg:block h-full overflow-hidden">
        <DocumentPreview
          document={document}
          onDeleteDocument={handleDeleteDocument}
          onDocumentUpdate={handleDocumentUpdate}
          onConvertToInvoice={handleConvertToInvoice}
          onAddLine={handleAddLine}
          onRemoveLine={handleRemoveLine}
          accentColor={accentColor}
          onAccentColorChange={handleAccentColorChange}
        />
      </div>
    </div>
  );
}
