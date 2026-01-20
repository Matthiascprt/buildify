"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSettingsData,
  updateProfile,
  updateCompany,
  updateCompanyLogoUrl,
  getLogoUploadInfo,
} from "@/lib/supabase/api";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  ImageIcon,
  User,
  Building2,
  Scale,
  Lightbulb,
  FileText,
  Mail,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const settingsSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  profilePhone: z.string().optional(),
  companyName: z.string().optional(),
  siret: z.string().optional(),
  rcs: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  vatRate: z.number().min(0).max(100).optional(),
  legalStatus: z.string().optional(),
  paymentTerms: z.string().optional(),
  legalNotice: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [authEmail, setAuthEmail] = useState<string>("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeStatus, setEmailChangeStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Check if email was just changed successfully
  useEffect(() => {
    if (searchParams.get("email_changed") === "true") {
      setMessage({
        type: "success",
        text: "Votre adresse email a été modifiée avec succès",
      });
      // Clean URL
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      profileEmail: "",
      profilePhone: "",
      companyName: "",
      siret: "",
      rcs: "",
      address: "",
      phone: "",
      email: "",
      vatRate: 20,
      legalStatus: "",
      paymentTerms: "",
      legalNotice: "",
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const { profile, company } = await getSettingsData();

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setAuthEmail(user.email);
        }

        form.reset({
          firstName: profile?.first_name ?? "",
          lastName: profile?.last_name ?? "",
          profileEmail: profile?.email ?? "",
          profilePhone: profile?.phone ?? "",
          companyName: company?.name ?? "",
          siret: company?.siret ?? "",
          rcs: company?.rcs ?? "",
          address: company?.address ?? "",
          phone: company?.phone ?? "",
          email: company?.email ?? "",
          vatRate: company?.vat_rate ?? 20,
          legalStatus: company?.legal_status ?? "",
          paymentTerms: company?.payment_terms ?? "",
          legalNotice: company?.legal_notice ?? "",
        });

        if (company?.logo_url) {
          setLogoUrl(company.logo_url);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        setMessage({
          type: "error",
          text: "Erreur lors du chargement des données",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [form]);

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Format accepté : JPG ou PNG uniquement",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "L'image ne doit pas dépasser 2 Mo" });
      return;
    }

    setIsUploadingLogo(true);
    setMessage(null);

    try {
      const uploadInfo = await getLogoUploadInfo();
      if (!uploadInfo.success || !uploadInfo.userId) {
        setMessage({
          type: "error",
          text: uploadInfo.error || "Erreur d'authentification",
        });
        setIsUploadingLogo(false);
        return;
      }

      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${uploadInfo.userId}-${Date.now()}.${fileExt}`;
      const filePath = `Logo clients/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("client-uploads")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading logo:", uploadError);
        setMessage({
          type: "error",
          text: uploadError.message || "Erreur lors de l'upload",
        });
        setIsUploadingLogo(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("client-uploads")
        .getPublicUrl(filePath);

      const newLogoUrl = urlData.publicUrl;

      const updateResult = await updateCompanyLogoUrl(newLogoUrl);
      if (!updateResult.success) {
        setMessage({
          type: "error",
          text: updateResult.error || "Erreur lors de la sauvegarde",
        });
        setIsUploadingLogo(false);
        return;
      }

      setLogoUrl(newLogoUrl);
      setMessage({ type: "success", text: "Logo uploadé avec succès" });
    } catch (error) {
      console.error("Error uploading logo:", error);
      setMessage({
        type: "error",
        text: "Erreur inattendue lors de l'upload",
      });
    }

    setIsUploadingLogo(false);
  }

  async function handleLogoDelete() {
    setIsUploadingLogo(true);
    setMessage(null);

    const result = await updateCompanyLogoUrl(null);

    if (result.success) {
      setLogoUrl(null);
      setMessage({ type: "success", text: "Logo supprimé avec succès" });
    } else {
      setMessage({
        type: "error",
        text: result.error || "Erreur lors de la suppression du logo",
      });
    }

    setIsUploadingLogo(false);
  }

  function onSubmit(data: SettingsFormValues) {
    startTransition(async () => {
      setMessage(null);

      const [profileResult, companyResult] = await Promise.all([
        updateProfile({
          first_name: data.firstName || null,
          last_name: data.lastName || null,
          email: data.profileEmail || null,
          phone: data.profilePhone || null,
        }),
        updateCompany({
          name: data.companyName || null,
          siret: data.siret || null,
          rcs: data.rcs || null,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          vat_rate: data.vatRate ?? null,
          legal_status: data.legalStatus || null,
          payment_terms: data.paymentTerms || null,
          legal_notice: data.legalNotice || null,
        }),
      ]);

      if (!profileResult.success || !companyResult.success) {
        setMessage({
          type: "error",
          text:
            profileResult.error ||
            companyResult.error ||
            "Erreur lors de la sauvegarde",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Modifications enregistrées avec succès",
      });
    });
  }

  async function handleEmailChange() {
    if (!newEmail || newEmail === authEmail) return;

    setEmailChangeLoading(true);
    setEmailChangeStatus(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/auth/callback` },
      );

      if (error) {
        setEmailChangeStatus({
          type: "error",
          message: error.message,
        });
      } else {
        setEmailChangeStatus({
          type: "success",
          message:
            "Un email de confirmation a été envoyé à votre nouvelle adresse.",
        });
        setNewEmail("");
      }
    } catch {
      setEmailChangeStatus({
        type: "error",
        message: "Une erreur est survenue",
      });
    }

    setEmailChangeLoading(false);
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Configurez votre compte et vos préférences
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profil Section */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-md border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
                <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Profil</h2>
                <p className="text-sm text-muted-foreground">
                  Vos informations personnelles
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Jean" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Dupont" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="profileEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="jean.dupont@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profilePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="06 12 34 56 78" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <button
                type="button"
                onClick={() => setEmailDialogOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>
                  Modifier l&apos;email de connexion
                  {authEmail && (
                    <span className="ml-1 text-xs">({authEmail})</span>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Informations entreprise Section */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-md border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Informations entreprise
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ces informations apparaîtront sur vos devis et factures.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Logo de l&apos;entreprise
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ce logo apparaîtra sur vos devis et factures
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl bg-muted/30 max-w-xs">
                  {logoUrl ? (
                    <div className="relative">
                      <Image
                        src={logoUrl}
                        alt="Logo entreprise"
                        width={200}
                        height={100}
                        className="w-48 h-24 object-contain border rounded-lg bg-background p-2"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={handleLogoDelete}
                        disabled={isUploadingLogo}
                        className="absolute -top-2 -right-2 bg-background text-muted-foreground rounded-full p-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-md border"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-48 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                  )}
                  <label className="cursor-pointer w-full">
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg hover:bg-muted transition-colors w-full">
                      {isUploadingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
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
                  <p className="text-xs text-muted-foreground">
                    JPG ou PNG, max 2 Mo
                  </p>
                </div>
              </div>

              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l&apos;entreprise</FormLabel>
                      <FormControl>
                        <Input placeholder="Mon Entreprise" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="legalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forme juridique</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SARL, SAS, Auto-entrepreneur..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="siret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SIRET</FormLabel>
                      <FormControl>
                        <Input placeholder="123 456 789 00012" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rcs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RCS</FormLabel>
                      <FormControl>
                        <Input placeholder="Paris B 123 456 789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="vatRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taux de TVA par défaut</FormLabel>
                    <Select
                      value={field.value?.toString() ?? "20"}
                      onValueChange={(value) =>
                        field.onChange(value === "0" ? 0 : Number(value))
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un taux" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="20">20%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="5.5">5,5%</SelectItem>
                        <SelectItem value="0">Aucune</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 rue Exemple, 75001 Paris"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="06 12 34 56 78" {...field} />
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
                      <FormLabel>Email professionnel</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@exemple.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Mentions légales & Paiement Section */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-md border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
                <Scale className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Mentions légales & Paiement
                </h2>
                <p className="text-sm text-muted-foreground">
                  Informations obligatoires sur vos devis et factures.
                </p>
              </div>
            </div>

            <Accordion type="single" collapsible className="mb-6">
              <AccordionItem value="guide" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <span>Guide des bonnes pratiques BTP</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4" />
                        Conditions de paiement
                      </h4>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          <strong>Acompte :</strong> 30% à la commande est
                          courant dans le BTP
                        </li>
                        <li>
                          <strong>Échéance :</strong> 30 jours après réception
                          de facture (ou fin de travaux)
                        </li>
                        <li>
                          <strong>Moyens de paiement :</strong> Précisez
                          virement, chèque, espèces (max 1000€)
                        </li>
                        <li>
                          <strong>IBAN :</strong> Incluez vos coordonnées
                          bancaires complètes
                        </li>
                        <li>
                          <strong>Pénalités de retard :</strong> Taux légal BCE
                          + 10 points (obligatoire)
                        </li>
                        <li>
                          <strong>Indemnité forfaitaire :</strong> 40€ pour
                          frais de recouvrement (obligatoire)
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                        <span className="text-base">%</span>
                        TVA dans le BTP
                      </h4>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          <strong>N° TVA intracommunautaire :</strong>{" "}
                          Obligatoire sur les factures (FR + 11 chiffres)
                        </li>
                        <li>
                          <strong>TVA 20% :</strong> Taux normal (construction
                          neuve, bâtiments &lt; 2 ans)
                        </li>
                        <li>
                          <strong>TVA 10% :</strong> Travaux de rénovation
                          (bâtiments &gt; 2 ans, résidence principale ou
                          secondaire)
                        </li>
                        <li>
                          <strong>TVA 5,5% :</strong> Rénovation énergétique
                          (isolation, chauffage, fenêtres...)
                        </li>
                        <li>
                          <strong>Attestation TVA :</strong> Le client doit
                          fournir l&apos;attestation simplifiée ou normale pour
                          les taux réduits
                        </li>
                        <li>
                          <strong>Micro-entreprise :</strong> &quot;TVA non
                          applicable, art. 293 B du CGI&quot;
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                        <Scale className="h-4 w-4" />
                        Assurances & Garanties
                      </h4>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          <strong>Assurance décennale :</strong> Nom de
                          l&apos;assureur + n° de contrat + zone couverte
                        </li>
                        <li>
                          <strong>Assurance RC Pro :</strong> Responsabilité
                          civile professionnelle
                        </li>
                        <li>
                          <strong>Garantie biennale :</strong> 2 ans sur les
                          équipements dissociables
                        </li>
                        <li>
                          <strong>Qualification :</strong> Qualibat, RGE, ou
                          autre certification
                        </li>
                        <li>
                          <strong>Médiation :</strong> Coordonnées du médiateur
                          de la consommation
                        </li>
                      </ul>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 mt-3">
                      <p className="font-medium text-foreground mb-2">
                        Exemple de mentions complètes :
                      </p>
                      <p className="text-xs italic">
                        &quot;Assurance décennale : [Assureur] - Contrat n°
                        [XXXXX] - Couverture France entière. Assurance RC Pro :
                        [Assureur] - Contrat n° [XXXXX]. En cas de litige, vous
                        pouvez recourir au médiateur de la consommation : [Nom
                        et coordonnées].&quot;
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions de paiement</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Acompte, échéance, IBAN, pénalités de retard..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="legalNotice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mentions légales</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Assurances, garanties, TVA, certifications..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {message && (
            <Alert
              variant={message.type === "success" ? "success" : "destructive"}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;email de connexion</DialogTitle>
            <DialogDescription>
              Entrez votre nouvelle adresse email. Un lien de confirmation sera
              envoyé à cette adresse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {authEmail && (
              <div className="text-sm">
                <span className="text-muted-foreground">Email actuel : </span>
                <span className="font-medium">{authEmail}</span>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="new-email" className="text-sm font-medium">
                Nouvel email
              </label>
              <Input
                id="new-email"
                type="email"
                placeholder="nouveau@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            {emailChangeStatus && (
              <Alert
                variant={
                  emailChangeStatus.type === "success"
                    ? "default"
                    : "destructive"
                }
              >
                {emailChangeStatus.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{emailChangeStatus.message}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmailDialogOpen(false);
                setNewEmail("");
                setEmailChangeStatus(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleEmailChange}
              disabled={
                emailChangeLoading || !newEmail || newEmail === authEmail
              }
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {emailChangeLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
