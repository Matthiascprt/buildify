"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Send,
  Mic,
  MicOff,
  UserPlus,
  Plus,
  FileCheck,
  FilePenLine,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { DocumentData, DocumentCompany } from "@/lib/types/document";
import {
  createEmptyQuote,
  createEmptyInvoice,
  documentDataToContent,
} from "@/lib/types/document";
import type { Company, Client } from "@/lib/supabase/types";
import { ClientPickerModal } from "./client-picker-modal";
import { NewClientModal } from "./new-client-modal";

export interface ChatRef {
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
}

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
  accentColor?: string | null;
  onAccentColorChange?: (color: string | null) => void;
  onClientCreated?: (client: Client) => void;
  onSwitchToPreview?: () => void;
}

export const Chat = forwardRef<ChatRef, ChatProps>(function Chat(
  {
    userInitial = "U",
    company,
    clients,
    document,
    onDocumentChange,
    nextQuoteNumber,
    nextInvoiceNumber,
    isEditingExisting: initialIsEditingExisting = false,
    accentColor,
    onAccentColorChange,
    onClientCreated,
    onSwitchToPreview,
  },
  ref,
) {
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
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Speech recognition setup
  const startRecording = useCallback((isRetry = false) => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "La reconnaissance vocale n'est pas supportée par votre navigateur.",
      );
      return;
    }

    // Reset retry count if not a retry
    if (!isRetry) {
      retryCountRef.current = 0;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      // Reset retry count on successful start
      retryCountRef.current = 0;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      // Append to existing input
      if (finalTranscript) {
        setInput((prev) => prev + (prev ? " " : "") + finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);

      // Handle recoverable errors with retry
      if (event.error === "network" || event.error === "aborted") {
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(
            `Retrying speech recognition (${retryCountRef.current}/${maxRetries})...`,
          );
          // Wait a bit before retrying
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current = null;
              startRecording(true);
            }
          }, 500);
          return;
        }
      }

      // For non-recoverable errors or max retries reached, stop
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      // Only set recording to false if we're not in a retry cycle
      if (retryCountRef.current === 0 || retryCountRef.current >= maxRetries) {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Show client picker button when document exists and no client is linked
  // Check both id AND name to ensure client is properly linked
  const hasClientLinked = document?.client?.id || document?.client?.name;
  const shouldShowClientButton =
    document !== null && !hasClientLinked && !isEditingExisting;

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

  const sendMessage = useCallback(
    async (
      content: string,
      overrideDocument?: DocumentData | null,
      isFirstUserMessage?: boolean,
    ) => {
      if (isFirstUserMessage) {
        setShowQuickActions(false);
      }

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
            accentColor,
            isFirstMessage: isFirstUserMessage,
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

          // Handle accent color change from AI
          if (data.accentColor !== undefined && onAccentColorChange) {
            onAccentColorChange(data.accentColor);
          }

          // Handle new client created by AI
          if (data.newClient && onClientCreated) {
            onClientCreated(data.newClient);
          }

          // Handle validity date update for quotes
          if (
            data.validityUpdate &&
            data.document?.id &&
            data.document?.type === "quote"
          ) {
            try {
              await fetch(`/api/documents?id=${data.document.id}&type=quote`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  valid_until: data.validityUpdate.validUntil,
                }),
              });
            } catch (error) {
              console.error("Failed to update validity date:", error);
            }
          }

          // Handle due date update for invoices
          if (
            data.dueDateUpdate &&
            data.document?.id &&
            data.document?.type === "invoice"
          ) {
            try {
              await fetch(
                `/api/documents?id=${data.document.id}&type=invoice`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    due_date: data.dueDateUpdate.dueDateDb,
                  }),
                },
              );
            } catch (error) {
              console.error("Failed to update due date:", error);
            }
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
    },
    [
      messages,
      document,
      company,
      clients,
      nextQuoteNumber,
      nextInvoiceNumber,
      accentColor,
      onDocumentChange,
      onAccentColorChange,
      onClientCreated,
    ],
  );

  // Expose sendMessage and isLoading to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      sendMessage: async (content: string) => {
        if (!content.trim() || isLoading) return;
        await sendMessage(content.trim());
      },
      isLoading,
    }),
    [isLoading, sendMessage],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const isFirstUserMessage =
      !document && messages.length === 1 && messages[0].role === "assistant";
    await sendMessage(input.trim(), undefined, isFirstUserMessage);
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

    // Add local messages without calling API
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Le client est ${clientName}`,
    };

    const documentType =
      document.type === "quote" ? "ce devis" : "cette facture";
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `Parfait ! Que souhaitez-vous ajouter à ${documentType} ?`,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
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
      paymentTerms: company?.payment_terms || undefined,
      legalNotice: company?.legal_notice || undefined,
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

    // Save document to database
    try {
      const content = documentDataToContent(newDocument);

      const requestBody = {
        type,
        client_id: null,
        number: newDocument.number,
        ...(type === "quote"
          ? {
              valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            }
          : {
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            }),
        content,
        color: null,
      };

      console.log("[DEBUG] Creating document:", requestBody);

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log("[DEBUG] API response:", response.status, responseData);

      if (response.ok && responseData.document) {
        newDocument = {
          ...newDocument,
          id: responseData.document.id,
        };
        console.log("[DEBUG] Document created with ID:", newDocument.id);
      } else {
        console.error("[DEBUG] Failed to create document:", responseData.error);
      }
    } catch (error) {
      console.error("[DEBUG] Failed to save document:", error);
    }

    onDocumentChange(newDocument);

    // Add user message
    const userContent =
      type === "quote"
        ? "Je souhaite créer un devis"
        : "Je souhaite créer une facture";

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
    };

    // Add assistant response asking about client
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content:
        type === "quote"
          ? "Très bien ! Quel client souhaitez-vous lier à ce devis ? Sélectionnez-le ci-dessous ou dites-le moi."
          : "Très bien ! Quel client souhaitez-vous lier à cette facture ? Sélectionnez-le ci-dessous ou dites-le moi.",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(false);
  };

  // Welcome screen shown only on initial state (no document, no interaction)
  const showWelcomeScreen = showQuickActions && !document;

  if (showWelcomeScreen) {
    return (
      <div className="relative h-full flex flex-col overflow-hidden bg-linear-to-b from-background via-background to-orange-50/30 dark:to-orange-950/10">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-linear-to-br from-orange-400/20 via-amber-300/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-linear-to-tr from-amber-400/15 via-orange-300/10 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-3xl mx-auto">
            {/* Hero section */}
            <div className="text-center mb-12">
              {/* Max Avatar - larger and more prominent */}
              <div className="relative inline-block mb-8">
                <div className="absolute -inset-6 bg-linear-to-r from-orange-500/30 via-amber-400/20 to-orange-500/30 rounded-full blur-2xl animate-pulse" />
                <div className="relative">
                  <Avatar className="h-28 w-28 ring-[3px] ring-white dark:ring-neutral-800 shadow-2xl shadow-orange-500/20">
                    <AvatarImage
                      src="https://ckvcijpgohqlnvoinwmc.supabase.co/storage/v1/object/public/buildify-assets/Logo/Agent%20IA.png"
                      alt="Max"
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-linear-to-br from-orange-500 to-amber-500 text-white text-3xl font-bold">
                      M
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <span className="absolute bottom-1 right-1 h-5 w-5 bg-emerald-500 rounded-full border-[3px] border-white dark:border-neutral-800" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                <span className="bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-white dark:via-neutral-100 dark:to-white bg-clip-text text-transparent">
                  Bonjour, je suis{" "}
                </span>
                <span className="bg-linear-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">
                  Max
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Votre assistant intelligent pour créer des devis et factures
                professionnels
              </p>
            </div>

            {/* Action cards */}
            <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {/* Quote Card */}
              <button
                onClick={() => handleQuickAction("quote")}
                disabled={isLoading}
                className="group relative p-6 rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-orange-300 dark:hover:border-orange-700 shadow-sm hover:shadow-xl hover:shadow-orange-500/10"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative">
                  {/* Icon */}
                  <div className="h-12 w-12 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center mb-4 group-hover:bg-orange-100 dark:group-hover:bg-orange-950/30 transition-colors">
                    <FileCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>

                  {/* Text */}
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Créer un devis
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Générez un devis professionnel en quelques secondes
                  </p>

                  {/* Arrow */}
                  <div className="absolute top-6 right-6 h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                    <svg
                      className="h-4 w-4 text-orange-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Invoice Card */}
              <button
                onClick={() => handleQuickAction("invoice")}
                disabled={isLoading}
                className="group relative p-6 rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-orange-300 dark:hover:border-orange-700 shadow-sm hover:shadow-xl hover:shadow-orange-500/10"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative">
                  {/* Icon */}
                  <div className="h-12 w-12 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center mb-4 group-hover:bg-orange-100 dark:group-hover:bg-orange-950/30 transition-colors">
                    <FilePenLine className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>

                  {/* Text */}
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Créer une facture
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Émettez une facture conforme en un instant
                  </p>

                  {/* Arrow */}
                  <div className="absolute top-6 right-6 h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                    <svg
                      className="h-4 w-4 text-orange-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.3s]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.15s]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-orange-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Création en cours...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="relative z-10 pb-8 text-center">
          <p className="text-xs text-muted-foreground/60">
            Propulsé par l&apos;intelligence artificielle
          </p>
        </div>

        {/* Modals */}
        <ClientPickerModal
          clients={clients}
          isOpen={showClientPicker}
          onClose={() => setShowClientPicker(false)}
          onSelect={handleClientSelect}
        />
        <NewClientModal
          isOpen={showNewClientModal}
          onClose={() => setShowNewClientModal(false)}
          onClientCreated={(client) => {
            onClientCreated?.(client);
            handleClientSelect(client);
          }}
        />
      </div>
    );
  }

  // Normal chat interface (after interaction)
  return (
    <div className="relative grid h-full grid-rows-[auto_1fr_auto]">
      <ClientPickerModal
        clients={clients}
        isOpen={showClientPicker}
        onClose={() => setShowClientPicker(false)}
        onSelect={handleClientSelect}
      />
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onClientCreated={(client) => {
          // Add to clients list for future AI interactions
          onClientCreated?.(client);
          // Also handle client selection for the current document
          handleClientSelect(client);
        }}
      />
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
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
          {/* Switch to preview button - visible on screens smaller than 2xl */}
          {onSwitchToPreview && document && (
            <Button
              variant="ghost"
              size="icon"
              className="2xl:hidden h-9 w-9 rounded-full bg-muted hover:bg-muted/80"
              onClick={onSwitchToPreview}
              title="Voir l'aperçu"
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
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
                {shouldShowClientButton &&
                  message.role === "assistant" &&
                  message ===
                    messages.filter((m) => m.role === "assistant").pop() && (
                    <div className="flex gap-2">
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full gap-2"
                        onClick={() => setShowNewClientModal(true)}
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4" />
                        Nouveau client
                      </Button>
                    </div>
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
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            className={cn("shrink-0", isRecording && "animate-pulse")}
            onClick={toggleRecording}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
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
});
