"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Send,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormState = "idle" | "loading" | "success" | "error";

export default function PublicContactPage() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du message");
      }

      setFormState("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      setFormState("error");
      setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-950">
      {/* Header */}
      <header className="h-16 border-b border-zinc-200/80 flex items-center justify-between px-4 lg:px-8 sticky top-0 bg-white/80 backdrop-blur-lg z-50">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buildify-assets/Logo/Logo02.svg`}
              alt="Buildify"
              width={32}
              height={32}
              className="flex-shrink-0 drop-shadow-sm"
              unoptimized
            />
            Buildify
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Connexion</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/onboarding">Commencer</Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-12">
        {/* Back Link */}
        <Link
          href="/help"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-zinc-950 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au centre d&apos;aide
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Form */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Contactez-nous
            </h1>
            <p className="text-muted-foreground mb-8">
              Une question ? Un problème ? Notre équipe vous répond sous 24h.
            </p>

            {formState === "success" ? (
              <div className="p-8 rounded-xl border bg-green-50 border-green-200 text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Message envoyé !</h2>
                <p className="text-muted-foreground mb-6">
                  Nous vous répondrons dans les plus brefs délais.
                </p>
                <Button variant="outline" onClick={() => setFormState("idle")}>
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      placeholder="Jean Dupont"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jean@exemple.fr"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) =>
                      setFormData({ ...formData, subject: value })
                    }
                    required
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Sélectionnez un sujet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Question générale</SelectItem>
                      <SelectItem value="bug">Signaler un bug</SelectItem>
                      <SelectItem value="feature">
                        Suggestion de fonctionnalité
                      </SelectItem>
                      <SelectItem value="billing">
                        Facturation / Abonnement
                      </SelectItem>
                      <SelectItem value="partnership">Partenariat</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez votre demande..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                  />
                </div>

                {formState === "error" && (
                  <p className="text-sm text-red-600">{errorMessage}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={formState === "loading"}
                >
                  {formState === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="lg:pl-8 lg:border-l">
            <h2 className="text-xl font-semibold mb-6">
              Autres moyens de nous joindre
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <Mail className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Email</h3>
                  <a
                    href="mailto:contact@buildify.app"
                    className="text-orange-600 hover:text-orange-700"
                  >
                    contact@buildify.app
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    Réponse sous 24h ouvrées
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Phone className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Téléphone</h3>
                  <a
                    href="tel:+33610490637"
                    className="text-orange-600 hover:text-orange-700"
                  >
                    06 10 49 06 37
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    Lun-Ven, 9h-18h
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <MapPin className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Adresse</h3>
                  <p className="text-muted-foreground">
                    123 Avenue de l&apos;Innovation
                    <br />
                    75001 Paris, France
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 rounded-xl bg-zinc-50 border">
              <h3 className="font-semibold mb-2">
                Besoin d&apos;aide rapide ?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Consultez notre FAQ pour trouver des réponses aux questions les
                plus fréquentes.
              </p>
              <Button variant="outline" asChild>
                <Link href="/#faq">Voir la FAQ</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-50 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-zinc-500">
              © {new Date().getFullYear()} Buildify. Tous droits réservés.
            </p>
            <p className="text-sm text-zinc-500">Fait avec passion en France</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
