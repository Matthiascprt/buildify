"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Send, Mic, MicOff, AlertTriangle, Sparkles } from "lucide-react";
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

export interface QuotaInfo {
  available: boolean;
  remaining: number;
  limit: number;
  used: number;
  status: string | null;
  plan: "standard" | "pro" | null;
  nextResetDate: string | null;
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
  onDownloadPdf?: () => void;
  onConvertToInvoice?: () => Promise<{ success: boolean; error?: string }>;
  quota: QuotaInfo;
  onQuotaChange?: (quota: QuotaInfo) => void;
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
    onDownloadPdf,
    onConvertToInvoice,
    quota,
    onQuotaChange,
  },
  ref,
) {
  const [, setIsEditingExisting] = useState(initialIsEditingExisting);

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

          // Handle PDF download request from AI
          if (data.downloadPdf && onDownloadPdf) {
            onDownloadPdf();
          }

          // Handle convert to invoice request from AI
          if (data.convertToInvoice && onConvertToInvoice) {
            await onConvertToInvoice();
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
      onDownloadPdf,
      onConvertToInvoice,
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

    const defaultTvaRate = company?.vat_rate ?? 10;

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

    // Show document immediately
    onDocumentChange(newDocument);

    // Save document to database in background
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

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (response.ok && responseData.document) {
        onDocumentChange({
          ...newDocument,
          id: responseData.document.id,
        });
        if (onQuotaChange) {
          onQuotaChange({
            ...quota,
            used: quota.used + 1,
            remaining: Math.max(0, quota.remaining - 1),
            available: quota.remaining - 1 > 0,
          });
        }
      }
    } catch (error) {
      console.error("Failed to save document:", error);
    }
  };

  // Welcome screen shown only on initial state (no document, no interaction)
  const showWelcomeScreen = showQuickActions && !document;

  if (showWelcomeScreen) {
    return (
      <div className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-orange-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        {/* Ambient glow effects */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-orange-600/15 via-amber-500/5 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 flex-1 px-6 sm:px-8 lg:px-12 overflow-y-auto">
          <div className="max-w-md mx-auto sm:mx-0">
            {/* Header section */}
            <div className="pt-10 sm:pt-14 pb-10">
              <div className="flex items-center gap-3 mb-10">
                <div className="relative">
                  <Avatar className="h-14 w-14 ring-4 ring-white/80 dark:ring-neutral-800/80 shadow-xl shadow-orange-500/20">
                    <AvatarImage
                      src="https://ckvcijpgohqlnvoinwmc.supabase.co/storage/v1/object/public/buildify-assets/Logo/Agent%20IA.png"
                      alt="Max"
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold text-lg">
                      M
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-emerald-400 rounded-full ring-[3px] ring-white dark:ring-neutral-900 shadow-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Assistant IA
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    En ligne
                  </p>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white leading-tight tracking-tight">
                Que souhaitez-vous
                <span className="block bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                  créer aujourd&apos;hui ?
                </span>
              </h1>
              <p className="mt-3 text-neutral-500 dark:text-neutral-400 text-base">
                Créez vos documents professionnels en quelques secondes
              </p>
            </div>

            {/* Quota warning */}
            {!quota.available && (
              <div className="mb-6 rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-orange-200/50 dark:border-orange-900/50 shadow-lg shadow-orange-500/5 p-5">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white mb-1">
                      Limite atteinte
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {quota.used}/{quota.limit} documents utilisés
                      {quota.nextResetDate && (
                        <>
                          {" "}
                          · Réinitialisation le{" "}
                          {new Date(quota.nextResetDate).toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "long" },
                          )}
                        </>
                      )}
                    </p>
                    {quota.plan === "standard" && (
                      <Button
                        onClick={() => (window.location.href = "/billing")}
                        className="mt-3 h-9 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-500/25 border-0"
                        size="sm"
                      >
                        Passer au plan Pro
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Main action cards */}
            <div className="space-y-4 pb-10">
              <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
                Créer un document
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleQuickAction("quote")}
                  disabled={isLoading}
                  className="group relative p-5 rounded-2xl text-left transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-lg shadow-neutral-900/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-300/50 dark:hover:border-orange-700/50 hover:-translate-y-1 hover:bg-white dark:hover:bg-neutral-900"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/0 to-amber-500/0 group-hover:from-orange-500/5 group-hover:to-amber-500/5 transition-all duration-300" />
                  <div className="relative">
                    <h3 className="font-semibold text-neutral-900 dark:text-white text-lg">
                      Devis
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      Proposition commerciale
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickAction("invoice")}
                  disabled={isLoading}
                  className="group relative p-5 rounded-2xl text-left transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-lg shadow-neutral-900/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-300/50 dark:hover:border-orange-700/50 hover:-translate-y-1 hover:bg-white dark:hover:bg-neutral-900"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/0 to-amber-500/0 group-hover:from-orange-500/5 group-hover:to-amber-500/5 transition-all duration-300" />
                  <div className="relative">
                    <h3 className="font-semibold text-neutral-900 dark:text-white text-lg">
                      Facture
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      Document de facturation
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 sm:mt-4">
                <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl shadow-xl shadow-neutral-900/10 border border-neutral-200/50 dark:border-neutral-800/50">
                  <div className="h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    Création en cours...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

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

      {/* Quota limit reached message */}
      {!quota.available ? (
        <div className="border-t p-4">
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                  Limite de documents atteinte
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                  Vous avez utilisé {quota.used}/{quota.limit} documents ce
                  mois-ci. L&apos;assistant IA n&apos;est plus disponible.
                  {quota.nextResetDate && (
                    <>
                      {" "}
                      Compteur remis à zéro le{" "}
                      {new Date(quota.nextResetDate).toLocaleDateString(
                        "fr-FR",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                      .
                    </>
                  )}
                </p>
                {quota.plan === "standard" ? (
                  <Button
                    onClick={() => (window.location.href = "/billing")}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    size="sm"
                  >
                    Passer au plan Pro
                  </Button>
                ) : (
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Contactez-nous pour un plan personnalisé :{" "}
                    <a
                      href="mailto:buildifyfrance@gmail.com"
                      className="font-medium underline hover:no-underline"
                    >
                      buildifyfrance@gmail.com
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border-t p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3 items-end">
            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              className={cn(
                "shrink-0 h-11 w-11 sm:h-10 sm:w-10 rounded-full",
                isRecording && "animate-pulse",
              )}
              onClick={toggleRecording}
              data-tour-id="tour-mic-button"
            >
              {isRecording ? (
                <MicOff className="h-5 w-5 sm:h-4 sm:w-4" />
              ) : (
                <Mic className="h-5 w-5 sm:h-4 sm:w-4" />
              )}
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tapez votre message..."
              className="min-h-11 sm:min-h-10 max-h-32 resize-none text-base sm:text-sm rounded-xl"
              rows={1}
              data-tour-id="tour-chat-input"
            />
            <Button
              type="submit"
              className="shrink-0 h-11 w-11 sm:h-10 sm:w-10 rounded-full"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
});
