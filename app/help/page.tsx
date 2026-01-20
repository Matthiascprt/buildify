"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeProvider } from "next-themes";
import {
  Rocket,
  MessageSquare,
  FileText,
  Users,
  Mic,
  Download,
  Mail,
  Scale,
  ChevronRight,
  Sparkles,
  HelpCircle,
  BookOpen,
  Phone,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Mic,
    title: "Dictée vocale",
    description:
      "Créez vos devis en dictant naturellement. L'IA comprend vos instructions et structure le document automatiquement.",
  },
  {
    icon: MessageSquare,
    title: "Assistant IA",
    description:
      "Conversez avec l'assistant pour modifier, ajouter des lignes, appliquer des remises ou transformer un devis en facture.",
  },
  {
    icon: FileText,
    title: "Documents professionnels",
    description:
      "Générez des PDF conformes aux obligations légales françaises avec toutes les mentions obligatoires.",
  },
  {
    icon: Users,
    title: "Gestion clients",
    description:
      "Gérez votre base clients simplement. Les informations sont automatiquement réutilisées pour vos prochains documents.",
  },
  {
    icon: Download,
    title: "Export Factur-X",
    description:
      "Exportez vos factures au format Factur-X compatible avec la facturation électronique obligatoire.",
  },
  {
    icon: Sparkles,
    title: "Création rapide",
    description:
      "Créez un devis complet en moins de 2 minutes grâce à l'interface intuitive et l'assistance IA.",
  },
];

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string>("start");

  const sections = [
    { id: "start", label: "Démarrage", icon: Rocket },
    { id: "features", label: "Fonctionnalités", icon: Sparkles },
    { id: "contact", label: "Contact", icon: Mail },
    { id: "cgu", label: "CGU", icon: FileText },
    { id: "mentions", label: "Mentions légales", icon: Scale },
    { id: "privacy", label: "Confidentialité", icon: BookOpen },
    { id: "cookies", label: "Cookies", icon: HelpCircle },
  ];

  return (
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
      <div className="min-h-screen flex flex-col bg-white text-zinc-950">
        {/* Header */}
        <header className="h-16 border-b border-zinc-200/80 flex items-center justify-between px-4 lg:px-8 sticky top-0 bg-white/80 backdrop-blur-lg z-50">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl"
            >
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
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/#fonctionnalites"
                className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                Fonctionnalités
              </Link>
              <Link
                href="/#tarifs"
                className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                Tarifs
              </Link>
              <Link
                href="/#faq"
                className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/help"
                className="text-sm text-zinc-950 font-medium transition-colors"
              >
                Aide
              </Link>
            </nav>
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
          {/* Page Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-4">
              <HelpCircle className="h-4 w-4" />
              Centre d&apos;aide
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              Comment pouvons-nous vous aider ?
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Retrouvez toutes les ressources pour utiliser Buildify
              efficacement
            </p>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-8 max-w-6xl mx-auto">
            {/* Navigation Sidebar */}
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                      isActive ? "bg-orange-50/50" : "hover:bg-muted/50",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-all",
                        isActive ? "text-orange-600" : "text-zinc-400",
                      )}
                    />
                    <span
                      className={cn(
                        "font-medium",
                        isActive ? "text-zinc-950" : "text-zinc-600",
                      )}
                    >
                      {section.label}
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 ml-auto text-muted-foreground/50",
                        isActive && "text-orange-500",
                      )}
                    />
                  </button>
                );
              })}
            </nav>

            {/* Content */}
            <div className="rounded-xl border bg-card p-8 lg:p-10">
              {activeSection === "start" && <StartSection />}
              {activeSection === "features" && <FeaturesSection />}
              {activeSection === "contact" && <ContactSection />}
              {activeSection === "cgu" && <CGUSection />}
              {activeSection === "mentions" && <MentionsSection />}
              {activeSection === "privacy" && <PrivacySection />}
              {activeSection === "cookies" && <CookiesSection />}
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
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveSection("cgu")}
                  className="text-sm text-zinc-500 hover:text-zinc-700"
                >
                  CGU
                </button>
                <button
                  onClick={() => setActiveSection("privacy")}
                  className="text-sm text-zinc-500 hover:text-zinc-700"
                >
                  Confidentialité
                </button>
                <button
                  onClick={() => setActiveSection("contact")}
                  className="text-sm text-zinc-500 hover:text-zinc-700"
                >
                  Contact
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}

function StartSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Démarrage rapide</h2>
        <p className="text-muted-foreground">
          Commencez à utiliser Buildify en quelques étapes simples
        </p>
      </div>

      <div className="grid gap-6">
        <div className="flex gap-4 p-4 rounded-lg border bg-muted/30">
          <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
            1
          </div>
          <div>
            <h3 className="font-semibold mb-1">Créez votre compte</h3>
            <p className="text-sm text-muted-foreground">
              Inscrivez-vous gratuitement en quelques secondes. 14 jours
              d&apos;essai sans engagement ni carte bancaire.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-lg border bg-muted/30">
          <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
            2
          </div>
          <div>
            <h3 className="font-semibold mb-1">Configurez votre entreprise</h3>
            <p className="text-sm text-muted-foreground">
              Renseignez vos informations (SIRET, adresse, logo) dans les
              Paramètres. Elles seront automatiquement ajoutées à vos documents.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-lg border bg-muted/30">
          <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
            3
          </div>
          <div>
            <h3 className="font-semibold mb-1">Créez votre premier devis</h3>
            <p className="text-sm text-muted-foreground">
              Rendez-vous sur la page Édition et utilisez l&apos;assistant IA.
              Tapez ou dictez vos instructions naturellement.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-lg border bg-muted/30">
          <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
            4
          </div>
          <div>
            <h3 className="font-semibold mb-1">Exportez et envoyez</h3>
            <p className="text-sm text-muted-foreground">
              Générez un PDF professionnel en un clic et partagez-le directement
              avec votre client par email ou SMS.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button asChild>
          <Link href="/onboarding">
            Créer mon compte gratuitement
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function FeaturesSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Fonctionnalités</h2>
        <p className="text-muted-foreground">
          Découvrez tout ce que Buildify peut faire pour vous
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="p-4 rounded-lg border bg-muted/30 space-y-3"
            >
              <Icon className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContactSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Nous contacter</h2>
        <p className="text-muted-foreground">
          Notre équipe est là pour vous aider
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border bg-muted/30 space-y-4">
          <Mail className="h-5 w-5 text-orange-600" />
          <div>
            <h3 className="font-semibold mb-1">Email</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Envoyez-nous un message, nous répondons sous 24h.
            </p>
            <a
              href="mailto:contact@buildify.app"
              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              contact@buildify.app
            </a>
          </div>
        </div>

        <div className="p-6 rounded-lg border bg-muted/30 space-y-4">
          <Phone className="h-5 w-5 text-orange-600" />
          <div>
            <h3 className="font-semibold mb-1">Téléphone</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Du lundi au vendredi, 9h-18h.
            </p>
            <a
              href="tel:+33610490637"
              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              06 10 49 06 37
            </a>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button asChild variant="outline">
          <Link href="/help/contact">
            Envoyer un message
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function CGUSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          Conditions Générales d&apos;Utilisation
        </h2>
        <p className="text-sm text-muted-foreground">
          Dernière mise à jour : 15 janvier 2025
        </p>
      </div>
      <article className="prose prose-neutral max-w-none prose-headings:text-lg prose-headings:font-semibold prose-p:text-muted-foreground prose-li:text-muted-foreground">
        <h3>1. Objet</h3>
        <p>
          Les présentes Conditions Générales d&apos;Utilisation ont pour objet
          de définir les modalités et conditions d&apos;utilisation des services
          proposés par Buildify, ainsi que de définir les droits et obligations
          des parties dans ce cadre.
        </p>
        <h3>2. Acceptation des CGU</h3>
        <p>
          L&apos;utilisation du Service implique l&apos;acceptation pleine et
          entière des présentes CGU. En vous inscrivant sur Buildify, vous
          reconnaissez avoir pris connaissance des présentes CGU et les accepter
          sans réserve.
        </p>
        <h3>3. Description du Service</h3>
        <p>
          Buildify est une plateforme en ligne permettant aux professionnels de
          créer, gérer et envoyer des devis et factures. Le Service comprend
          notamment :
        </p>
        <ul>
          <li>La création et la gestion de devis professionnels</li>
          <li>La création et la gestion de factures</li>
          <li>La gestion d&apos;une base de données clients</li>
          <li>Un assistant IA pour faciliter la création de documents</li>
          <li>L&apos;export des documents en format PDF</li>
        </ul>
        <h3>4. Inscription et compte utilisateur</h3>
        <p>
          Pour utiliser le Service, vous devez créer un compte en fournissant
          des informations exactes et complètes. Vous êtes responsable de la
          confidentialité de vos identifiants de connexion et de toutes les
          activités effectuées sous votre compte.
        </p>
        <h3>5. Obligations de l&apos;utilisateur</h3>
        <p>L&apos;utilisateur s&apos;engage à :</p>
        <ul>
          <li>Utiliser le Service conformément à sa destination</li>
          <li>
            Ne pas utiliser le Service à des fins illégales ou frauduleuses
          </li>
          <li>
            Respecter les droits de propriété intellectuelle de Buildify et des
            tiers
          </li>
          <li>
            Ne pas tenter de porter atteinte au bon fonctionnement du Service
          </li>
        </ul>
        <h3>6. Propriété intellectuelle</h3>
        <p>
          L&apos;ensemble des éléments composant le Service (textes, graphiques,
          logiciels, images, etc.) sont la propriété exclusive de Buildify et
          sont protégés par les lois relatives à la propriété intellectuelle.
        </p>
        <h3>7. Responsabilité</h3>
        <p>
          Buildify s&apos;efforce d&apos;assurer la disponibilité et le bon
          fonctionnement du Service. Toutefois, Buildify ne saurait être tenu
          responsable des interruptions de service, des pertes de données ou des
          dommages indirects résultant de l&apos;utilisation du Service.
        </p>
        <h3>8. Modification des CGU</h3>
        <p>
          Buildify se réserve le droit de modifier les présentes CGU à tout
          moment. Les utilisateurs seront informés de toute modification
          substantielle par email ou via le Service.
        </p>
      </article>
    </div>
  );
}

function MentionsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Mentions Légales</h2>
        <p className="text-sm text-muted-foreground">
          Dernière mise à jour : 15 janvier 2025
        </p>
      </div>
      <article className="prose prose-neutral max-w-none prose-headings:text-lg prose-headings:font-semibold prose-p:text-muted-foreground prose-li:text-muted-foreground">
        <h3>Éditeur du site</h3>
        <p>
          <strong>Buildify SAS</strong>
          <br />
          Société par Actions Simplifiée au capital de 10 000 €<br />
          Siège social : 123 Avenue de l&apos;Innovation, 75001 Paris, France
          <br />
          RCS Paris : 123 456 789
          <br />
          N° TVA intracommunautaire : FR12345678901
        </p>
        <h3>Directeur de la publication</h3>
        <p>
          Monsieur Jean Dupont, en qualité de Président de Buildify SAS.
          <br />
          Contact : contact@buildify.app
        </p>
        <h3>Hébergement</h3>
        <p>
          Le site est hébergé par :<br />
          <strong>Vercel Inc.</strong>
          <br />
          340 S Lemon Ave #4133
          <br />
          Walnut, CA 91789, États-Unis
        </p>
        <h3>Données personnelles</h3>
        <p>
          Les données stockées sont hébergées par :<br />
          <strong>Supabase Inc.</strong>
          <br />
          970 Toa Payoh North, Singapore 318992
        </p>
        <h3>Propriété intellectuelle</h3>
        <p>
          L&apos;ensemble de ce site relève de la législation française et
          internationale sur le droit d&apos;auteur et la propriété
          intellectuelle. Tous les droits de reproduction sont réservés.
        </p>
        <h3>Contact</h3>
        <p>
          Pour toute question ou demande d&apos;information concernant le site :
        </p>
        <ul>
          <li>Par email : contact@buildify.app</li>
          <li>Par courrier : 123 Avenue de l&apos;Innovation, 75001 Paris</li>
          <li>Par téléphone : 06 10 49 06 37</li>
        </ul>
      </article>
    </div>
  );
}

function PrivacySection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          Politique de Confidentialité
        </h2>
        <p className="text-sm text-muted-foreground">
          Dernière mise à jour : 15 janvier 2025
        </p>
      </div>
      <article className="prose prose-neutral max-w-none prose-headings:text-lg prose-headings:font-semibold prose-p:text-muted-foreground prose-li:text-muted-foreground">
        <h3>1. Introduction</h3>
        <p>
          Chez Buildify, nous accordons une grande importance à la protection de
          vos données personnelles. Cette politique de confidentialité décrit
          comment nous collectons, utilisons, stockons et protégeons vos
          informations.
        </p>
        <h3>2. Données collectées</h3>
        <p>Nous collectons les types de données suivants :</p>
        <ul>
          <li>
            <strong>Données d&apos;identification</strong> : nom, prénom,
            adresse email
          </li>
          <li>
            <strong>Données professionnelles</strong> : nom de
            l&apos;entreprise, SIRET, adresse professionnelle
          </li>
          <li>
            <strong>Données de connexion</strong> : adresse IP, type de
            navigateur, pages visitées
          </li>
          <li>
            <strong>Données relatives aux clients</strong> : informations que
            vous saisissez concernant vos propres clients
          </li>
        </ul>
        <h3>3. Finalités du traitement</h3>
        <p>Vos données sont utilisées pour :</p>
        <ul>
          <li>Fournir et améliorer nos services</li>
          <li>Gérer votre compte utilisateur</li>
          <li>Vous envoyer des communications relatives au service</li>
          <li>Assurer la sécurité de la plateforme</li>
          <li>Respecter nos obligations légales</li>
        </ul>
        <h3>4. Base légale du traitement</h3>
        <p>
          Le traitement de vos données repose sur l&apos;exécution du contrat de
          service, votre consentement, notre intérêt légitime à améliorer nos
          services, et le respect de nos obligations légales.
        </p>
        <h3>5. Durée de conservation</h3>
        <p>
          Vos données personnelles sont conservées pendant toute la durée de
          votre utilisation du service, puis pendant une durée de 3 ans à
          compter de la suppression de votre compte.
        </p>
        <h3>6. Vos droits</h3>
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li>Droit d&apos;accès à vos données</li>
          <li>Droit de rectification</li>
          <li>Droit à l&apos;effacement</li>
          <li>Droit à la limitation du traitement</li>
          <li>Droit à la portabilité</li>
          <li>Droit d&apos;opposition</li>
        </ul>
        <p>Pour exercer ces droits, contactez-nous à : contact@buildify.app</p>
        <h3>7. Sécurité</h3>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles
          appropriées pour protéger vos données contre tout accès non autorisé,
          modification, divulgation ou destruction.
        </p>
      </article>
    </div>
  );
}

function CookiesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Politique de Cookies</h2>
        <p className="text-sm text-muted-foreground">
          Dernière mise à jour : 15 janvier 2025
        </p>
      </div>
      <article className="prose prose-neutral max-w-none prose-headings:text-lg prose-headings:font-semibold prose-p:text-muted-foreground prose-li:text-muted-foreground">
        <h3>1. Qu&apos;est-ce qu&apos;un cookie ?</h3>
        <p>
          Un cookie est un petit fichier texte déposé sur votre terminal
          (ordinateur, tablette, smartphone) lors de votre visite sur notre
          site. Il permet de stocker des informations relatives à votre
          navigation.
        </p>
        <h3>2. Cookies utilisés</h3>
        <p>Notre site utilise différents types de cookies :</p>
        <h4>Cookies strictement nécessaires</h4>
        <p>
          Ces cookies sont essentiels au fonctionnement du site. Ils permettent
          notamment de maintenir votre session connectée et de sécuriser votre
          navigation.
        </p>
        <ul>
          <li>
            <strong>session_token</strong> : Authentification utilisateur (durée
            : session)
          </li>
          <li>
            <strong>csrf_token</strong> : Protection contre les attaques CSRF
            (durée : session)
          </li>
        </ul>
        <h4>Cookies de préférences</h4>
        <p>
          Ces cookies permettent de mémoriser vos préférences
          d&apos;utilisation.
        </p>
        <ul>
          <li>
            <strong>theme</strong> : Préférence de thème clair/sombre (durée : 1
            an)
          </li>
          <li>
            <strong>locale</strong> : Langue préférée (durée : 1 an)
          </li>
        </ul>
        <h3>3. Gestion des cookies</h3>
        <p>
          Vous pouvez à tout moment gérer vos préférences en matière de cookies
          :
        </p>
        <ul>
          <li>
            Via les paramètres de votre navigateur pour supprimer ou bloquer les
            cookies
          </li>
          <li>
            En utilisant notre outil de gestion des cookies accessible depuis le
            bandeau de consentement
          </li>
        </ul>
        <h3>4. Conséquences du refus des cookies</h3>
        <p>
          Si vous refusez certains cookies, certaines fonctionnalités du site
          pourraient ne pas fonctionner correctement. Les cookies strictement
          nécessaires ne peuvent pas être désactivés.
        </p>
        <h3>5. Plus d&apos;informations</h3>
        <p>
          Pour en savoir plus sur les cookies et leur gestion, vous pouvez
          consulter le site de la CNIL : www.cnil.fr
        </p>
      </article>
    </div>
  );
}
