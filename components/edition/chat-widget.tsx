"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Chat, type ChatRef, type QuotaInfo } from "@/components/edition/chat";
import type { DocumentData } from "@/lib/types/document";
import type { Company, Client } from "@/lib/supabase/types";

export interface ChatWidgetRef {
  chatRef: ChatRef | null;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userInitial: string;
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

export const ChatWidget = forwardRef<ChatWidgetRef, ChatWidgetProps>(
  function ChatWidget(
    {
      isOpen,
      onOpenChange,
      userInitial,
      company,
      clients,
      document,
      onDocumentChange,
      nextQuoteNumber,
      nextInvoiceNumber,
      isEditingExisting = false,
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
    const chatRef = useRef<ChatRef>(null);

    useImperativeHandle(
      ref,
      () => ({
        chatRef: chatRef.current,
      }),
      [],
    );

    return (
      <div className="fixed bottom-28 lg:bottom-12 inset-x-3 sm:inset-x-auto sm:right-10 lg:right-12 z-40 flex flex-col items-center sm:items-end gap-4">
        {/* Chat Panel - always mounted to preserve conversation state */}
        <div
          className={`w-full sm:w-[420px] lg:w-[440px] h-[65vh] sm:h-[540px] lg:h-[600px] max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col rounded-[28px] backdrop-blur-xl backdrop-saturate-[180%] border ${
            isOpen
              ? "animate-in slide-in-from-bottom-5 fade-in duration-300"
              : "hidden"
          } bg-gradient-to-br from-white/95 to-white/88 border-white/60 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05),0_10px_30px_-5px_rgba(249,115,22,0.1)] dark:from-neutral-900/95 dark:to-neutral-900/88 dark:border-neutral-700/60 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05),0_10px_30px_-5px_rgba(249,115,22,0.15)]`}
        >
          <Chat
            ref={chatRef}
            userInitial={userInitial}
            company={company}
            clients={clients}
            document={document}
            onDocumentChange={onDocumentChange}
            nextQuoteNumber={nextQuoteNumber}
            nextInvoiceNumber={nextInvoiceNumber}
            isEditingExisting={isEditingExisting}
            accentColor={accentColor}
            onAccentColorChange={onAccentColorChange}
            onClientCreated={onClientCreated}
            onDownloadPdf={onDownloadPdf}
            onConvertToInvoice={onConvertToInvoice}
            quota={quota}
            onQuotaChange={onQuotaChange}
          />
        </div>

        {/* Premium Floating Button */}
        <div className="relative">
          <button
            onClick={() => onOpenChange(!isOpen)}
            className="relative h-16 w-16 lg:h-[72px] lg:w-[72px] rounded-full transition-all duration-300 ease-out hover:scale-105 active:scale-95 flex items-center justify-center group"
            style={{
              background:
                "linear-gradient(135deg, #f97316 0%, #fb923c 30%, #ea580c 70%, #c2410c 100%)",
              boxShadow: isOpen
                ? "0 4px 12px -2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)"
                : "0 6px 16px -3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
            aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
            data-tour-id="tour-chat-button"
          >
            {isOpen ? (
              <ChevronDown className="h-7 w-7 lg:h-8 lg:w-8 text-white drop-shadow-sm transition-transform duration-200 group-hover:translate-y-0.5" />
            ) : (
              <Avatar className="h-16 w-16 lg:h-[72px] lg:w-[72px]">
                <AvatarImage
                  src="https://ckvcijpgohqlnvoinwmc.supabase.co/storage/v1/object/public/buildify-assets/Logo/Agent%20IA.png"
                  alt="Max"
                  className="object-cover"
                />
                <AvatarFallback className="bg-orange-600 text-white font-bold text-lg">
                  M
                </AvatarFallback>
              </Avatar>
            )}
          </button>
        </div>
      </div>
    );
  },
);
