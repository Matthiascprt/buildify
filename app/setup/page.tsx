"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getCompany,
  updateCompany,
  getLogoUploadInfo,
  createQuote,
  getNextQuoteNumber,
  createInvoice,
  getNextInvoiceNumber,
  addClient,
} from "@/lib/supabase/api";
import type { DocumentContent } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  ArrowRight,
  Upload,
  X,
  ImageIcon,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Sparkles,
} from "lucide-react";

const MAX_AVATAR_URL =
  "https://ckvcijpgohqlnvoinwmc.supabase.co/storage/v1/object/public/buildify-assets/Logo/Agent%20IA.png";

const setupSchema = z.object({
  address: z.string().min(1, "L'adresse est obligatoire"),
  phone: z.string().min(1, "Le téléphone est obligatoire"),
  email: z.string().email("Email invalide").min(1, "L'email est obligatoire"),
  siret: z.string().min(1, "Le numéro SIRET est obligatoire"),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      address: "",
      phone: "",
      email: "",
      siret: "",
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const company = await getCompany();
        if (company) {
          setCompanyName(company.name || "");
          if (company.logo_url) {
            setLogoUrl(company.logo_url);
          }
          form.reset({
            address: company.address || "",
            phone: company.phone || "",
            email: company.email || "",
            siret: company.siret || "",
          });
        } else {
          // No company exists yet, try to load name from localStorage (from onboarding)
          const pendingData = localStorage.getItem("pendingOnboardingDocument");
          if (pendingData) {
            try {
              const parsed = JSON.parse(pendingData);
              if (parsed.companyName) {
                setCompanyName(parsed.companyName);
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      } catch (err) {
        console.error("Error loading company:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [form]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (only JPG and PNG)
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Format accepté : JPG ou PNG uniquement");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 2 Mo)");
      return;
    }

    setIsUploadingLogo(true);
    setError(null);

    try {
      const uploadInfo = await getLogoUploadInfo();
      if (!uploadInfo.success || !uploadInfo.userId) {
        setError(uploadInfo.error || "Erreur d'authentification");
        setIsUploadingLogo(false);
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${uploadInfo.userId}-${Date.now()}.${fileExt}`;
      const filePath = `Logo clients/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("client-uploads")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        setError(uploadError.message || "Erreur lors de l'upload");
        setIsUploadingLogo(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("client-uploads")
        .getPublicUrl(filePath);

      const newLogoUrl = urlData.publicUrl;
      // Store locally - will be saved to DB when form is submitted
      // (company might not exist yet during initial setup)
      setLogoUrl(newLogoUrl);
    } catch (err) {
      console.error("Error uploading logo:", err);
      setError("Erreur inattendue lors de l'upload");
    }

    setIsUploadingLogo(false);
  }

  function handleRemoveLogo() {
    // Just remove from local state - will be saved when form is submitted
    setLogoUrl(null);
  }

  function onSubmit(data: SetupFormValues) {
    startTransition(async () => {
      setError(null);

      const result = await updateCompany({
        name: companyName || null,
        address: data.address,
        phone: data.phone,
        email: data.email,
        siret: data.siret,
        logo_url: logoUrl,
      });

      if (!result.success) {
        setError(result.error || "Erreur lors de la sauvegarde");
        return;
      }

      const pendingData = localStorage.getItem("pendingOnboardingDocument");
      if (pendingData) {
        try {
          const parsed = JSON.parse(pendingData) as {
            document: DocumentContent;
            documentType?: "quote" | "invoice";
            companyName: string;
            activity: string;
            clientName: string | null;
          };

          let clientId: string | null = null;

          if (parsed.clientName) {
            const nameParts = parsed.clientName
              .replace(/^(M\.|Mme|Mr|Mrs)\.?\s*/i, "")
              .trim()
              .split(/\s+/);
            const lastName = nameParts.pop() || parsed.clientName;
            const firstName = nameParts.join(" ") || null;

            const clientResult = await addClient({
              type: "particulier",
              first_name: firstName,
              last_name: lastName,
              email: null,
              phone: null,
            });

            if (clientResult.success && clientResult.client) {
              clientId = clientResult.client.id;
            }
          }

          const docType = parsed.documentType || "quote";
          localStorage.removeItem("pendingOnboardingDocument");

          if (docType === "invoice") {
            const invoiceNumber = await getNextInvoiceNumber();
            const invoiceResult = await createInvoice({
              number: invoiceNumber,
              content: parsed.document,
              client_id: clientId,
              due_date: null,
              color: null,
            });

            if (invoiceResult.success && invoiceResult.invoice) {
              router.push(
                `/edition?id=${invoiceResult.invoice.id}&type=invoice&fromSetup=true`,
              );
              return;
            }
          } else {
            const quoteNumber = await getNextQuoteNumber();
            const quoteResult = await createQuote({
              number: quoteNumber,
              content: parsed.document,
              client_id: clientId,
              valid_until: null,
              color: null,
            });

            if (quoteResult.success && quoteResult.quote) {
              router.push(
                `/edition?id=${quoteResult.quote.id}&type=quote&fromSetup=true`,
              );
              return;
            }
          }
        } catch (err) {
          console.error("Error creating document from pending data:", err);
        }
      }

      router.push("/edition?fromSetup=true");
    });
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8 md:p-10"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Image
              src={MAX_AVATAR_URL}
              alt="Max"
              width={56}
              height={56}
              className="rounded-full ring-4 ring-orange-100"
              unoptimized
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Bienvenue {companyName ? `chez ${companyName}` : ""} !
            </h1>
            <p className="text-zinc-500">
              Finalisez la configuration de votre entreprise
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 rounded-xl mb-6">
          <Sparkles className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <p className="text-sm text-orange-700">
            Ces informations apparaîtront sur vos devis et factures
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    Adresse de l&apos;entreprise
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="12 rue des Artisans&#10;75011 Paris"
                      className="min-h-[80px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-zinc-400" />
                      Téléphone
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="06 12 34 56 78" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-zinc-400" />
                      Email entreprise
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="contact@exemple.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="siret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    Numéro SIRET
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="123 456 789 00012" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium">
                  Logo de l&apos;entreprise
                </span>
                <span className="text-xs text-zinc-400">(optionnel)</span>
              </div>

              <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-xl bg-muted/30">
                {logoUrl ? (
                  <div className="relative">
                    <Image
                      src={logoUrl}
                      alt="Logo entreprise"
                      width={120}
                      height={60}
                      className="w-28 h-14 object-contain border rounded-lg bg-background p-2"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={isUploadingLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-14 border rounded-lg bg-background flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg hover:bg-muted transition-colors">
                    {isUploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {isUploadingLogo
                        ? "Upload en cours..."
                        : logoUrl
                          ? "Changer le logo"
                          : "Choisir un fichier"}
                    </span>
                  </div>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                JPG ou PNG, max 2 Mo
              </p>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 mt-6 text-base font-semibold bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-primary transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  Terminer et voir mon devis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
