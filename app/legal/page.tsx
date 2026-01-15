"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Scale,
  FileText,
  Shield,
  Cookie,
  ScrollText,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type LegalSection = "cgu" | "mentions" | "privacy" | "cookies";

const sections = [
  {
    id: "cgu" as const,
    title: "Conditions Generales d'Utilisation",
    shortTitle: "CGU",
    icon: ScrollText,
    lastUpdate: "15 janvier 2025",
  },
  {
    id: "mentions" as const,
    title: "Mentions Legales",
    shortTitle: "Mentions",
    icon: Scale,
    lastUpdate: "15 janvier 2025",
  },
  {
    id: "privacy" as const,
    title: "Politique de Confidentialite",
    shortTitle: "Confidentialite",
    icon: Shield,
    lastUpdate: "15 janvier 2025",
  },
  {
    id: "cookies" as const,
    title: "Politique de Cookies",
    shortTitle: "Cookies",
    icon: Cookie,
    lastUpdate: "15 janvier 2025",
  },
];

function getInitialSection(param: string | null): LegalSection {
  if (param && sections.some((s) => s.id === param)) {
    return param as LegalSection;
  }
  return "cgu";
}

export default function PublicLegalPage() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const [activeSection, setActiveSection] = useState<LegalSection>(() =>
    getInitialSection(sectionParam),
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-lg">Buildify</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Informations Legales
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Consultez nos conditions d&apos;utilisation, mentions legales et
            politiques de confidentialite
          </p>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8 max-w-6xl mx-auto">
          {/* Navigation */}
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all border",
                    isActive
                      ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900"
                      : "hover:bg-muted/50 border-transparent",
                  )}
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-md border flex items-center justify-center shrink-0 transition-all",
                      isActive
                        ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900"
                        : "bg-orange-50/30 dark:bg-orange-950/10 text-orange-600/70 dark:text-orange-400/70 border-orange-200/50 dark:border-orange-900/50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{section.shortTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      Maj: {section.lastUpdate}
                    </p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform text-muted-foreground/50",
                    )}
                  />
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="rounded-lg border bg-card p-8 lg:p-10">
            <LegalContent section={activeSection} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20 py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Buildify. Tous droits reserves.
          </p>
        </div>
      </footer>
    </div>
  );
}

function LegalContent({ section }: { section: LegalSection }) {
  const sectionData = sections.find((s) => s.id === section);

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <div className="flex items-center gap-3 mb-8 not-prose">
        <div className="h-9 w-9 rounded-md border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
          <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{sectionData?.title}</h2>
          <p className="text-sm text-muted-foreground">
            Derniere mise a jour : {sectionData?.lastUpdate}
          </p>
        </div>
      </div>

      {section === "cgu" && <CGUContent />}
      {section === "mentions" && <MentionsContent />}
      {section === "privacy" && <PrivacyContent />}
      {section === "cookies" && <CookiesContent />}
    </article>
  );
}

function CGUContent() {
  return (
    <>
      <h3>1. Objet</h3>
      <p>
        Les presentes Conditions Generales d&apos;Utilisation (ci-apres
        &quot;CGU&quot;) ont pour objet de definir les modalites et conditions
        d&apos;utilisation des services proposes par Buildify (ci-apres &quot;le
        Service&quot;), ainsi que de definir les droits et obligations des
        parties dans ce cadre.
      </p>

      <h3>2. Acceptation des CGU</h3>
      <p>
        L&apos;utilisation du Service implique l&apos;acceptation pleine et
        entiere des presentes CGU. En vous inscrivant sur Buildify, vous
        reconnaissez avoir pris connaissance des presentes CGU et les accepter
        sans reserve.
      </p>

      <h3>3. Description du Service</h3>
      <p>
        Buildify est une plateforme en ligne permettant aux professionnels de
        creer, gerer et envoyer des devis et factures. Le Service comprend
        notamment :
      </p>
      <ul>
        <li>La creation et la gestion de devis professionnels</li>
        <li>La creation et la gestion de factures</li>
        <li>La gestion d&apos;une base de donnees clients</li>
        <li>Un assistant IA pour faciliter la creation de documents</li>
        <li>L&apos;export des documents en format PDF</li>
      </ul>

      <h3>4. Inscription et compte utilisateur</h3>
      <p>
        Pour utiliser le Service, vous devez creer un compte en fournissant des
        informations exactes et completes. Vous etes responsable de la
        confidentialite de vos identifiants de connexion et de toutes les
        activites effectuees sous votre compte.
      </p>

      <h3>5. Obligations de l&apos;utilisateur</h3>
      <p>L&apos;utilisateur s&apos;engage a :</p>
      <ul>
        <li>Utiliser le Service conformement a sa destination</li>
        <li>Ne pas utiliser le Service a des fins illegales ou frauduleuses</li>
        <li>
          Respecter les droits de propriete intellectuelle de Buildify et des
          tiers
        </li>
        <li>
          Ne pas tenter de porter atteinte au bon fonctionnement du Service
        </li>
      </ul>

      <h3>6. Propriete intellectuelle</h3>
      <p>
        L&apos;ensemble des elements composant le Service (textes, graphiques,
        logiciels, images, etc.) sont la propriete exclusive de Buildify et sont
        proteges par les lois relatives a la propriete intellectuelle.
      </p>

      <h3>7. Responsabilite</h3>
      <p>
        Buildify s&apos;efforce d&apos;assurer la disponibilite et le bon
        fonctionnement du Service. Toutefois, Buildify ne saurait etre tenu
        responsable des interruptions de service, des pertes de donnees ou des
        dommages indirects resultant de l&apos;utilisation du Service.
      </p>

      <h3>8. Modification des CGU</h3>
      <p>
        Buildify se reserve le droit de modifier les presentes CGU a tout
        moment. Les utilisateurs seront informes de toute modification
        substantielle par email ou via le Service.
      </p>
    </>
  );
}

function MentionsContent() {
  return (
    <>
      <h3>Editeur du site</h3>
      <p>
        <strong>Buildify SAS</strong>
        <br />
        Societe par Actions Simplifiee au capital de 10 000 EUR
        <br />
        Siege social : 123 Avenue de l&apos;Innovation, 75001 Paris, France
        <br />
        RCS Paris : 123 456 789
        <br />
        N&deg; TVA intracommunautaire : FR12345678901
      </p>

      <h3>Directeur de la publication</h3>
      <p>
        Monsieur Jean Dupont, en qualite de President de Buildify SAS.
        <br />
        Contact : contact@buildify.fr
      </p>

      <h3>Hebergement</h3>
      <p>
        Le site est heberge par :
        <br />
        <strong>Vercel Inc.</strong>
        <br />
        340 S Lemon Ave #4133
        <br />
        Walnut, CA 91789
        <br />
        Etats-Unis
      </p>

      <h3>Donnees personnelles</h3>
      <p>
        Les donnees stockees sont hebergees par :
        <br />
        <strong>Supabase Inc.</strong>
        <br />
        970 Toa Payoh North, Singapore 318992
      </p>

      <h3>Propriete intellectuelle</h3>
      <p>
        L&apos;ensemble de ce site releve de la legislation francaise et
        internationale sur le droit d&apos;auteur et la propriete
        intellectuelle. Tous les droits de reproduction sont reserves, y compris
        pour les documents telechargeables et les representations
        iconographiques et photographiques.
      </p>

      <h3>Contact</h3>
      <p>
        Pour toute question ou demande d&apos;information concernant le site,
        vous pouvez nous contacter :
      </p>
      <ul>
        <li>Par email : contact@buildify.fr</li>
        <li>Par courrier : 123 Avenue de l&apos;Innovation, 75001 Paris</li>
        <li>Par telephone : +33 1 23 45 67 89</li>
      </ul>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <h3>1. Introduction</h3>
      <p>
        Chez Buildify, nous accordons une grande importance a la protection de
        vos donnees personnelles. Cette politique de confidentialite decrit
        comment nous collectons, utilisons, stockons et protegeons vos
        informations.
      </p>

      <h3>2. Donnees collectees</h3>
      <p>Nous collectons les types de donnees suivants :</p>
      <ul>
        <li>
          <strong>Donnees d&apos;identification</strong> : nom, prenom, adresse
          email
        </li>
        <li>
          <strong>Donnees professionnelles</strong> : nom de l&apos;entreprise,
          SIRET, adresse professionnelle
        </li>
        <li>
          <strong>Donnees de connexion</strong> : adresse IP, type de
          navigateur, pages visitees
        </li>
        <li>
          <strong>Donnees relatives aux clients</strong> : informations que vous
          saisissez concernant vos propres clients
        </li>
      </ul>

      <h3>3. Finalites du traitement</h3>
      <p>Vos donnees sont utilisees pour :</p>
      <ul>
        <li>Fournir et ameliorer nos services</li>
        <li>Gerer votre compte utilisateur</li>
        <li>Vous envoyer des communications relatives au service</li>
        <li>Assurer la securite de la plateforme</li>
        <li>Respecter nos obligations legales</li>
      </ul>

      <h3>4. Base legale du traitement</h3>
      <p>
        Le traitement de vos donnees repose sur l&apos;execution du contrat de
        service, votre consentement, notre interet legitime a ameliorer nos
        services, et le respect de nos obligations legales.
      </p>

      <h3>5. Duree de conservation</h3>
      <p>
        Vos donnees personnelles sont conservees pendant toute la duree de votre
        utilisation du service, puis pendant une duree de 3 ans a compter de la
        suppression de votre compte, sauf obligation legale de conservation plus
        longue.
      </p>

      <h3>6. Vos droits</h3>
      <p>Conformement au RGPD, vous disposez des droits suivants :</p>
      <ul>
        <li>Droit d&apos;acces a vos donnees</li>
        <li>Droit de rectification</li>
        <li>Droit a l&apos;effacement</li>
        <li>Droit a la limitation du traitement</li>
        <li>Droit a la portabilite</li>
        <li>Droit d&apos;opposition</li>
      </ul>
      <p>Pour exercer ces droits, contactez-nous a : privacy@buildify.fr</p>

      <h3>7. Securite</h3>
      <p>
        Nous mettons en oeuvre des mesures techniques et organisationnelles
        appropriees pour proteger vos donnees contre tout acces non autorise,
        modification, divulgation ou destruction.
      </p>
    </>
  );
}

function CookiesContent() {
  return (
    <>
      <h3>1. Qu&apos;est-ce qu&apos;un cookie ?</h3>
      <p>
        Un cookie est un petit fichier texte depose sur votre terminal
        (ordinateur, tablette, smartphone) lors de votre visite sur notre site.
        Il permet de stocker des informations relatives a votre navigation.
      </p>

      <h3>2. Cookies utilises</h3>
      <p>Notre site utilise differents types de cookies :</p>

      <h4>Cookies strictement necessaires</h4>
      <p>
        Ces cookies sont essentiels au fonctionnement du site. Ils permettent
        notamment de maintenir votre session connectee et de securiser votre
        navigation.
      </p>
      <ul>
        <li>
          <strong>session_token</strong> : Authentification utilisateur (duree :
          session)
        </li>
        <li>
          <strong>csrf_token</strong> : Protection contre les attaques CSRF
          (duree : session)
        </li>
      </ul>

      <h4>Cookies de preferences</h4>
      <p>
        Ces cookies permettent de memoriser vos preferences d&apos;utilisation.
      </p>
      <ul>
        <li>
          <strong>theme</strong> : Preference de theme clair/sombre (duree : 1
          an)
        </li>
        <li>
          <strong>locale</strong> : Langue preferee (duree : 1 an)
        </li>
      </ul>

      <h4>Cookies analytiques</h4>
      <p>
        Ces cookies nous permettent de mesurer l&apos;audience de notre site et
        d&apos;analyser les parcours de navigation pour ameliorer nos services.
      </p>
      <ul>
        <li>
          <strong>_ga</strong> : Google Analytics - Identification des visiteurs
          (duree : 2 ans)
        </li>
        <li>
          <strong>_gid</strong> : Google Analytics - Identification des sessions
          (duree : 24h)
        </li>
      </ul>

      <h3>3. Gestion des cookies</h3>
      <p>
        Vous pouvez a tout moment gerer vos preferences en matiere de cookies :
      </p>
      <ul>
        <li>
          Via les parametres de votre navigateur pour supprimer ou bloquer les
          cookies
        </li>
        <li>
          En utilisant notre outil de gestion des cookies accessible depuis le
          bandeau de consentement
        </li>
      </ul>

      <h3>4. Consequences du refus des cookies</h3>
      <p>
        Si vous refusez certains cookies, certaines fonctionnalites du site
        pourraient ne pas fonctionner correctement. Les cookies strictement
        necessaires ne peuvent pas etre desactives car ils sont indispensables
        au fonctionnement du site.
      </p>

      <h3>5. Plus d&apos;informations</h3>
      <p>
        Pour en savoir plus sur les cookies et leur gestion, vous pouvez
        consulter le site de la CNIL : www.cnil.fr
      </p>
    </>
  );
}
