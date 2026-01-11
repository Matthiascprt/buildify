"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { DocumentData, DocumentCompany } from "@/lib/types/document";
import { createEmptyQuote, createEmptyInvoice } from "@/lib/types/document";
import type { Company, Client } from "@/lib/supabase/types";
import { ClientPickerModal } from "./client-picker-modal";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  userInitial?: string;
  company: Company | null;
  clients: Client[];
  document: DocumentData | null;
  onDocumentChange: (document: DocumentData | null) => void;
  nextQuoteNumber: string;
  nextInvoiceNumber: string;
  isEditingExisting?: boolean;
}

export function Chat({
  userInitial = "U",
  company,
  clients,
  document,
  onDocumentChange,
  nextQuoteNumber,
  nextInvoiceNumber,
  isEditingExisting: initialIsEditingExisting = false,
}: ChatProps) {
  const [isEditingExisting, setIsEditingExisting] = useState(
    initialIsEditingExisting,
  );

  const getInitialMessage = () => {
    if (initialIsEditingExisting) {
      return "Bonjour ! Que souhaitez-vous modifier sur ce document ?";
    }
    return "Bonjour ! Que souhaitez-vous créer ?";
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: getInitialMessage(),
    },
  ]);
  const [showQuickActions, setShowQuickActions] = useState(
    !initialIsEditingExisting,
  );
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show client picker button when document exists and no client is linked
  const shouldShowClientButton =
    document !== null && !document.client?.id && !isEditingExisting;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset chat when document is deleted (goes from non-null to null)
  const prevDocumentRef = useRef<DocumentData | null>(document);
  useEffect(() => {
    const prevDocument = prevDocumentRef.current;
    prevDocumentRef.current = document;

    // If document was deleted (had a value before, now null)
    if (prevDocument !== null && document === null) {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "Bonjour ! Que souhaitez-vous créer ?",
        },
      ]);
      setShowQuickActions(true);
      setIsEditingExisting(false);
    }
  }, [document]);

  const sendMessage = async (
    content: string,
    overrideDocument?: DocumentData | null,
  ) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const documentToSend =
      overrideDocument !== undefined ? overrideDocument : document;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          document: documentToSend,
          company,
          clients,
          nextQuoteNumber,
          nextInvoiceNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (data.document !== undefined) {
          onDocumentChange(data.document);
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Désolé, une erreur est survenue. Veuillez réessayer.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Désolé, une erreur de connexion est survenue. Veuillez réessayer.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClientSelect = async (client: Client) => {
    if (!document) return;

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

    onDocumentChange(updatedDocument);

    // Send message as if user typed the client name
    await sendMessage(`Le client est ${clientName}`, updatedDocument);
  };

  const handleQuickAction = async (type: "quote" | "invoice") => {
    setShowQuickActions(false);
    setIsLoading(true);

    const documentCompany: DocumentCompany = {
      name: company?.name || "",
      address: company?.address || "",
      city: "",
      phone: company?.phone || "",
      email: company?.email || "",
      siret: company?.siret || "",
      logoUrl: company?.logo_url || undefined,
    };

    const defaultTvaRate = company?.vat_rate ?? 20;

    let newDocument: DocumentData;
    if (type === "quote") {
      newDocument = createEmptyQuote(
        documentCompany,
        nextQuoteNumber,
        defaultTvaRate,
      );
    } else {
      newDocument = createEmptyInvoice(
        documentCompany,
        nextInvoiceNumber,
        defaultTvaRate,
      );
    }

    try {
      // Create document in database
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          content: newDocument,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update document with database ID and generated number
        newDocument = {
          ...newDocument,
          id: data.document.id,
          number: data.documentNumber,
        };
      } else {
        console.error("Failed to create document in database:", data.error);
      }
    } catch (error) {
      console.error("Error creating document:", error);
    }

    setIsLoading(false);
    onDocumentChange(newDocument);

    const content =
      type === "quote"
        ? "Je souhaite créer un devis"
        : "Je souhaite créer une facture";
    await sendMessage(content, newDocument);
  };

  return (
    <div className="relative grid h-full grid-rows-[auto_1fr_auto]">
      <ClientPickerModal
        clients={clients}
        isOpen={showClientPicker}
        onClose={() => setShowClientPicker(false)}
        onSelect={handleClientSelect}
      />
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src="https://ckvcijpgohqlnvoinwmc.supabase.co/storage/v1/object/public/buildify-assets/Logo/Agent%20IA.png"
              alt="Max"
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              M
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">Max</h2>
            <p className="text-sm text-muted-foreground">
              Créez vos devis et factures avec Max
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto min-h-0 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" && "flex-row-reverse",
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                {message.role === "assistant" ? (
                  <>
                    <AvatarImage
                      src="https://ckvcijpgohqlnvoinwmc.supabase.co/storage/v1/object/public/buildify-assets/Logo/Agent%20IA.png"
                      alt="Max"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      M
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-muted">
                    {userInitial}
                  </AvatarFallback>
                )}
              </Avatar>
              <div
                className={cn(
                  "flex flex-col gap-2 flex-1 min-w-0",
                  message.role === "user" && "items-end",
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 w-fit max-w-[85%]",
                    message.role === "assistant"
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                {message.id === "1" && showQuickActions && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleQuickAction("quote")}
                      disabled={isLoading}
                    >
                      Devis
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleQuickAction("invoice")}
                      disabled={isLoading}
                    >
                      Facture
                    </Button>
                  </div>
                )}
                {shouldShowClientButton &&
                  message.role === "assistant" &&
                  message.id !== "1" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-2"
                      onClick={() => setShowClientPicker(true)}
                      disabled={isLoading}
                    >
                      <UserPlus className="h-4 w-4" />
                      Lier un client
                    </Button>
                  )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage
                  src="https://ckvcijpgohqlnvoinwmc.supabase.co/storage/v1/object/public/buildify-assets/Logo/Agent%20IA.png"
                  alt="Max"
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  M
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl bg-muted px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tapez votre message..."
            className="min-h-10 max-h-32 resize-none"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
