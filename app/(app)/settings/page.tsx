"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
} from "lucide-react";

const settingsSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  siret: z.string().optional(),
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
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      siret: "",
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

        form.reset({
          firstName: profile?.first_name ?? "",
          lastName: profile?.last_name ?? "",
          companyName: company?.name ?? "",
          siret: company?.siret ?? "",
          address: company?.address ?? "",
          phone: company?.phone ?? profile?.phone ?? "",
          email: company?.email ?? profile?.email ?? "",
          vatRate: company?.vat_rate ?? 20,
          legalStatus: company?.legal_status ?? "",
          paymentTerms: company?.payment_terms ?? "",
          legalNotice: company?.legal_notice ?? "",
        });

        // Load logo URL
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

    // Validate file type (only JPG and PNG)
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Format accepté : JPG ou PNG uniquement",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "L'image ne doit pas dépasser 2 Mo" });
      return;
    }

    setIsUploadingLogo(true);
    setMessage(null);

    try {
      // Get user info for filename
      const uploadInfo = await getLogoUploadInfo();
      if (!uploadInfo.success || !uploadInfo.userId) {
        setMessage({
          type: "error",
          text: uploadInfo.error || "Erreur d'authentification",
        });
        setIsUploadingLogo(false);
        return;
      }

      // Upload using browser client
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

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("client-uploads")
        .getPublicUrl(filePath);

      const newLogoUrl = urlData.publicUrl;

      // Update company with logo URL via server action
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
          phone: data.phone || null,
          email: data.email || null,
        }),
        updateCompany({
          name: data.companyName || null,
          siret: data.siret || null,
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

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Configurez votre compte et vos préférences
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>Vos informations personnelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations entreprise</CardTitle>
              <CardDescription>
                Ces informations apparaîtront sur vos devis et factures.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload Section */}
              <div className="space-y-4 pb-2">
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
                        className="absolute -top-2 -right-2 bg-muted text-muted-foreground rounded-full p-1 hover:bg-muted-foreground/20 hover:text-foreground transition-colors"
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
              </div>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Ces informations apparaîtront automatiquement sur vos devis et
                factures.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions de paiement</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Paiement à 30 jours, par virement bancaire sur le compte : FR76 XXXX XXXX..."
                        className="min-h-[100px]"
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
                        placeholder="Ex: TVA non applicable, art. 293 B du CGI / Assurance décennale : ..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

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
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
