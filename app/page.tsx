"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";
import {
  Check,
  FileCheck,
  Sparkles,
  Twitter,
  Linkedin,
  ArrowRight,
  Send,
  Mic,
  Star,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BorderBeam } from "@/components/ui/border-beam";

const pricingPlans = [
  {
    id: "standard",
    name: "Standard",
    description: "Parfait pour les artisans indépendants",
    monthlyPrice: "29,90",
    yearlyPrice: "299,90",
    yearlyMonthlyPrice: "24,90",
    features: [
      "50 documents/mois",
      "Création et édition devis/factures",
      "Dictée vocale IA",
      "PDF export et génération automatique",
      "Gestion clients & contacts",
      "Support par email",
    ],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Pour les artisans avec plus de volume",
    monthlyPrice: "49,90",
    yearlyPrice: "499,90",
    yearlyMonthlyPrice: "41,90",
    features: [
      "100 documents/mois",
      "Création et édition devis/factures",
      "Dictée vocale IA",
      "PDF export et génération automatique",
      "Gestion clients & contacts",
      "Support prioritaire",
    ],
    cta: "Essai gratuit 14 jours",
    popular: true,
  },
];

const faqItems = [
  {
    question: "Comment créer mon premier devis ?",
    answer:
      'Rendez-vous sur la page Édition et parlez à Max, notre assistant IA. Dictez simplement vos instructions comme "Nouveau devis pour M. Dupont, installation chauffe-eau 800€". L\'IA structure automatiquement le document.',
  },
  {
    question: "Puis-je utiliser Buildify sur mobile ?",
    answer:
      "Oui, Buildify est conçu mobile-first. Vous pouvez créer vos devis directement sur chantier depuis votre smartphone ou tablette.",
  },
  {
    question: "Je ne suis pas à l'aise avec la technologie, c'est compliqué ?",
    answer:
      "C'est justement pour ça que Buildify existe. Pas de menu compliqué, pas de formation. Vous parlez comme à un collègue, Max comprend et fait le travail. Si vous savez dicter un SMS, vous savez utiliser Buildify.",
  },
  {
    question: "Qu'est-ce que la facturation électronique obligatoire ?",
    answer:
      "Une réforme française qui impose d'émettre les factures au format électronique. Dès septembre 2027, les artisans et PME devront s'y conformer. Buildify génère déjà vos factures au format Factur-X conforme.",
  },
  {
    question: "Mes documents sont-ils conformes aux obligations légales ?",
    answer:
      "Oui, tous les documents générés incluent les mentions obligatoires : numérotation, TVA, délais de paiement, conditions de règlement. Export Factur-X compatible avec les plateformes de dématérialisation.",
  },
  {
    question: "Y a-t-il une période d'essai ?",
    answer:
      "Oui, 14 jours d'essai gratuit sans carte bancaire. Testez toutes les fonctionnalités sans restriction ni engagement.",
  },
  {
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer:
      "Oui, sans engagement. Annulation possible à tout moment depuis votre espace client. Vos documents restent accessibles jusqu'à la fin de la période payée.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Vos données sont hébergées en Europe avec chiffrement SSL. Conformes au RGPD, jamais partagées avec des tiers. Vous restez propriétaire de vos données.",
  },
];

const testimonials = [
  {
    name: "Laurent M.",
    role: "Plombier-chauffagiste",
    location: "Annecy",
    rating: 5,
    content:
      "Avant Buildify, je passais mes soirées à faire mes devis sur Excel. Maintenant, je dicte tout dans le camion entre deux chantiers. Ma femme me remercie !",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
  },
  {
    name: "Stéphane R.",
    role: "Carreleur",
    location: "Perpignan",
    rating: 4,
    content:
      "Au début je me suis dit \"encore un gadget\"... Mais au final je l'utilise tous les jours. Ça me fait gagner facilement 1h par jour sur l'administratif.",
    avatar:
      "https://ui-avatars.com/api/?name=SR&background=ea580c&color=fff&size=128&bold=true",
  },
  {
    name: "Marc B.",
    role: "Maçon",
    location: "Valence",
    rating: 5,
    content:
      "Avec mon équipe de 3 gars, on perdait un temps fou sur la paperasse. Buildify nous a changé la vie. On facture plus vite, on est payé plus vite.",
    avatar: "https://randomuser.me/api/portraits/men/41.jpg",
  },
];

const themeColors = [
  { primary: "#ea580c", name: "Orange" },
  { primary: "#2563eb", name: "Bleu" },
  { primary: "#059669", name: "Vert" },
];

const MAX_AVATAR_URL =
  "https://ckvcijpgohqlnvoinwmc.supabase.co/storage/v1/object/public/buildify-assets/Logo/Agent%20IA.png";

const heroChatMessages = [
  { type: "ai", text: "Bonjour ! Que souhaitez-vous créer ?", delay: 0.6 },
  {
    type: "user",
    text: "Devis pour M. Dupont, rénovation salle de bain : dépose 15m² à 25€/m², faïence 25m² à 85€/m², douche 1 550€",
    delay: 2.2,
  },
  { type: "typing", delay: 3.5 },
  {
    type: "ai",
    text: "Parfait ! Devis créé : 3 postes, total 4 455 € TTC. Modifier quelque chose ?",
    delay: 4.2,
  },
  {
    type: "user",
    text: "Mets la couleur en bleu et monte la douche à 1 800€",
    delay: 6,
  },
  { type: "typing", delay: 7 },
  {
    type: "ai",
    text: "C'est fait ! Couleur bleue et douche à 1 800€. Nouveau total : 4 730 € TTC",
    delay: 7.8,
  },
];

const heroQuoteData = {
  section: {
    num: "1",
    label: "Rénovation salle de bain",
    total: "4 050,00 €",
    delay: 3.5,
  },
  subsection: {
    num: "1.1",
    label: "Prestations",
    total: "4 050,00 €",
    delay: 3.7,
  },
  lines: [
    {
      num: "1.1.1",
      title: "Dépose carrelage",
      desc: "Retrait ancien carrelage sur 15m²",
      qty: "15",
      price: "25,00 €",
      tva: "10 %",
      total: "375,00 €",
      delay: 3.9,
    },
    {
      num: "1.1.2",
      title: "Pose faïence",
      desc: "Pose faïence nouvelle sur 25m²",
      qty: "25",
      price: "85,00 €",
      tva: "10 %",
      total: "2 125,00 €",
      delay: 4.1,
    },
    {
      num: "1.1.3",
      title: "Douche italienne",
      desc: "Installation complète douche italienne",
      qty: "1",
      price: "1 550,00 €",
      tva: "10 %",
      total: "1 550,00 €",
      delay: 4.3,
    },
  ],
};

function HeroDemo() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showClient, setShowClient] = useState(false);
  const [showSection, setShowSection] = useState(false);
  const [showSubsection, setShowSubsection] = useState(false);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [showTotals, setShowTotals] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [priceUpdated, setPriceUpdated] = useState(false);

  const currentTheme = themeColors[colorIndex];

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    timers.push(
      setTimeout(() => {
        setVisibleMessages([]);
        setShowClient(false);
        setShowSection(false);
        setShowSubsection(false);
        setVisibleLines([]);
        setShowTotals(false);
        setShowTyping(false);
        setShowRecording(false);
        setPriceUpdated(false);
        setColorIndex(0);
      }, 0),
    );

    // Recording animation before first user message (at 2.2s)
    timers.push(setTimeout(() => setShowRecording(true), 1.0 * 1000));
    timers.push(setTimeout(() => setShowRecording(false), 2.2 * 1000));

    // Recording animation before second user message (at 6s)
    timers.push(setTimeout(() => setShowRecording(true), 4.8 * 1000));
    timers.push(setTimeout(() => setShowRecording(false), 6.0 * 1000));

    heroChatMessages.forEach((msg, index) => {
      if (msg.type === "typing") {
        timers.push(setTimeout(() => setShowTyping(true), msg.delay * 1000));
        timers.push(
          setTimeout(() => setShowTyping(false), (msg.delay + 0.5) * 1000),
        );
      } else {
        timers.push(
          setTimeout(() => {
            setVisibleMessages((prev) => [...prev, index]);
          }, msg.delay * 1000),
        );
      }
    });

    timers.push(setTimeout(() => setShowClient(true), 2.2 * 1000));

    timers.push(
      setTimeout(
        () => setShowSection(true),
        heroQuoteData.section.delay * 1000,
      ),
    );
    timers.push(
      setTimeout(
        () => setShowSubsection(true),
        heroQuoteData.subsection.delay * 1000,
      ),
    );

    heroQuoteData.lines.forEach((line, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines((prev) => [...prev, index]);
        }, line.delay * 1000),
      );
    });

    timers.push(setTimeout(() => setShowTotals(true), 4.6 * 1000));
    timers.push(
      setTimeout(() => {
        setColorIndex(1);
        setPriceUpdated(true);
      }, 7.8 * 1000),
    );
    timers.push(
      setTimeout(() => {
        setAnimationKey((prev) => prev + 1);
      }, 10.5 * 1000),
    );

    return () => timers.forEach((t) => clearTimeout(t));
  }, [animationKey]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[700px] lg:min-h-[520px]">
      {/* Left: Chat Interface */}
      <div className="border-b lg:border-b-0 lg:border-r border-zinc-100 flex flex-col min-h-[320px] lg:min-h-0">
        <div className="px-4 py-3 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src={MAX_AVATAR_URL}
                alt="Max"
                width={40}
                height={40}
                className="rounded-full object-cover"
                unoptimized
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Max</p>
              <p className="text-xs text-zinc-500">Assistant IA</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
          {heroChatMessages.map((msg, index) => {
            if (msg.type === "typing") return null;

            const isVisible = visibleMessages.includes(index);

            if (msg.type === "ai") {
              return (
                <motion.div
                  key={`msg-${animationKey}-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={
                    isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }
                  }
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex gap-2"
                  style={{ display: isVisible ? "flex" : "none" }}
                >
                  <Image
                    src={MAX_AVATAR_URL}
                    alt="Max"
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                    unoptimized
                  />
                  <div className="bg-zinc-100 rounded-2xl rounded-tl-md px-3 py-2 max-w-[85%]">
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={`msg-${animationKey}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={
                  isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }
                }
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex gap-2 justify-end"
                style={{ display: isVisible ? "flex" : "none" }}
              >
                <div className="bg-primary text-white rounded-2xl rounded-tr-md px-3 py-2 max-w-[85%]">
                  <p className="text-sm">{msg.text}</p>
                </div>
              </motion.div>
            );
          })}

          {showTyping && (
            <motion.div
              key={`typing-${animationKey}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex gap-2"
            >
              <Image
                src={MAX_AVATAR_URL}
                alt="Max"
                width={28}
                height={28}
                className="w-7 h-7 rounded-full object-cover shrink-0"
                unoptimized
              />
              <div className="bg-zinc-100 rounded-2xl rounded-tl-md px-3 py-2.5">
                <div className="flex gap-1.5 items-center h-4">
                  <motion.span
                    className="w-2 h-2 bg-zinc-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: 0,
                    }}
                  />
                  <motion.span
                    className="w-2 h-2 bg-zinc-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: 0.15,
                    }}
                  />
                  <motion.span
                    className="w-2 h-2 bg-zinc-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: 0.3,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-100">
          <div className="flex gap-2">
            <motion.button
              className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                showRecording
                  ? "border-red-300 bg-red-50 text-red-500"
                  : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
              }`}
              animate={showRecording ? { scale: [1, 1.05, 1] } : {}}
              transition={{
                duration: 0.5,
                repeat: showRecording ? Infinity : 0,
              }}
            >
              <Mic className="w-4 h-4" />
            </motion.button>
            <div
              className={`flex-1 h-10 px-4 rounded-lg border flex items-center ${
                showRecording
                  ? "border-red-300 bg-red-50"
                  : "border-zinc-200 bg-zinc-50"
              }`}
            >
              {showRecording ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[16, 24, 12, 20, 14, 22, 10].map((height, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-red-400 rounded-full"
                        animate={{ height: [4, height, 4] }}
                        transition={{
                          duration: 0.4,
                          repeat: Infinity,
                          delay: i * 0.05,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-red-500 ml-1">Écoute...</span>
                </div>
              ) : (
                <span className="text-sm text-zinc-400">
                  Tapez ou dictez...
                </span>
              )}
            </div>
            <button className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right: Document Preview */}
      <div className="bg-zinc-50/80 p-2 lg:p-3 overflow-hidden min-h-[380px] lg:min-h-0">
        <div className="bg-white rounded-lg shadow-sm h-full overflow-hidden text-[10px] lg:text-[11px] border border-zinc-200/60 min-h-[420px] lg:min-h-[494px]">
          {/* Header - Always visible */}
          <div className="px-4 pt-4 pb-2">
            <div className="mb-1">
              <h3 className="font-bold text-base text-zinc-900">
                Devis n° 2024-0047
              </h3>
              <p className="text-zinc-400 text-[10px]">Réalisé le 15/01/2024</p>
              <p className="text-zinc-400 text-[10px]">
                Valable jusqu&apos;au 1 mois
              </p>
            </div>
          </div>

          {/* Company & Client Info */}
          <div className="grid grid-cols-2 gap-4 px-4 pb-3">
            <div>
              <p className="font-bold text-zinc-900 text-[11px] mb-1">
                Martin Rénovation
              </p>
              <p className="text-zinc-400 text-[9px] leading-relaxed">
                12 rue des Artisans
                <br />
                75011 Paris
                <br />
                06 12 34 56 78
                <br />
                SIRET: 123 456 789 00012
              </p>
            </div>
            <div>
              <AnimatePresence>
                {showClient ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="font-bold text-zinc-900 text-[11px] mb-1">
                      M. Dupont
                    </p>
                    <p className="text-zinc-400 text-[9px] leading-relaxed italic">
                      Téléphone
                      <br />
                      Email
                    </p>
                  </motion.div>
                ) : (
                  <div>
                    <p className="font-bold text-zinc-300 text-[11px] mb-1 italic">
                      Client
                    </p>
                    <p className="text-zinc-300 text-[9px] leading-relaxed italic">
                      Aucun client sélectionné
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Project Title - Always visible */}
          <div className="px-4 pb-2">
            <h4 className="font-bold text-zinc-900 text-sm">
              Rénovation salle de bain
            </h4>
          </div>

          {/* Table - Header always visible */}
          <div className="px-4 pb-2">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-1 py-1.5 text-left text-[9px] font-medium text-zinc-500 uppercase tracking-wider w-8">
                    N°
                  </th>
                  <th className="px-1 py-1.5 text-left text-[9px] font-medium text-zinc-500 uppercase tracking-wider">
                    Désignation
                  </th>
                  <th className="px-1 py-1.5 text-center text-[9px] font-medium text-zinc-500 uppercase tracking-wider w-10">
                    Qté
                  </th>
                  <th className="px-1 py-1.5 text-center text-[9px] font-medium text-zinc-500 uppercase tracking-wider w-14">
                    Prix U.
                  </th>
                  <th className="px-1 py-1.5 text-center text-[9px] font-medium text-zinc-500 uppercase tracking-wider w-10">
                    TVA
                  </th>
                  <th className="px-1 py-1.5 text-right text-[9px] font-medium text-zinc-500 uppercase tracking-wider w-16">
                    Total HT
                  </th>
                </tr>
              </thead>
              <tbody className="text-[9px]">
                {/* Section Row */}
                <AnimatePresence>
                  {showSection && (
                    <motion.tr
                      initial={{ opacity: 0, backgroundColor: "#fef9c3" }}
                      animate={{ opacity: 1, backgroundColor: "#ffffff" }}
                      transition={{ duration: 0.4 }}
                      style={{
                        borderBottom: `2px solid ${currentTheme.primary}`,
                      }}
                    >
                      <td
                        className="px-1 py-2 font-bold"
                        style={{ color: currentTheme.primary }}
                      >
                        {heroQuoteData.section.num}
                      </td>
                      <td
                        className="px-1 py-2 font-bold"
                        colSpan={4}
                        style={{ color: currentTheme.primary }}
                      >
                        {heroQuoteData.section.label}
                      </td>
                      <td
                        className="px-1 py-2 text-right font-bold"
                        style={{ color: currentTheme.primary }}
                      >
                        {priceUpdated
                          ? "4 300,00 €"
                          : heroQuoteData.section.total}
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>

                {/* Subsection Row */}
                <AnimatePresence>
                  {showSubsection && (
                    <motion.tr
                      initial={{ opacity: 0, backgroundColor: "#fef9c3" }}
                      animate={{ opacity: 1, backgroundColor: "#ffffff" }}
                      transition={{ duration: 0.4 }}
                      style={{
                        borderBottom: `1px solid ${currentTheme.primary}80`,
                      }}
                    >
                      <td
                        className="px-1 py-1.5 font-medium"
                        style={{ color: `${currentTheme.primary}CC` }}
                      >
                        {heroQuoteData.subsection.num}
                      </td>
                      <td
                        className="px-1 py-1.5 font-medium"
                        colSpan={4}
                        style={{ color: `${currentTheme.primary}CC` }}
                      >
                        {heroQuoteData.subsection.label}
                      </td>
                      <td
                        className="px-1 py-1.5 text-right font-semibold"
                        style={{ color: `${currentTheme.primary}CC` }}
                      >
                        {priceUpdated
                          ? "4 300,00 €"
                          : heroQuoteData.subsection.total}
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>

                {/* Line Rows */}
                <AnimatePresence>
                  {heroQuoteData.lines.map(
                    (line, index) =>
                      visibleLines.includes(index) && (
                        <motion.tr
                          key={line.num}
                          initial={{ opacity: 0, backgroundColor: "#fef9c3" }}
                          animate={{ opacity: 1, backgroundColor: "#ffffff" }}
                          transition={{ duration: 0.4 }}
                          className="border-b border-zinc-100"
                        >
                          <td className="px-1 py-2 text-zinc-400">
                            {line.num}
                          </td>
                          <td className="px-1 py-2">
                            <div className="font-medium text-zinc-900">
                              {line.title}
                            </div>
                            <div className="text-zinc-400 text-[8px]">
                              {line.desc}
                            </div>
                          </td>
                          <td className="px-1 py-2 text-center text-zinc-500">
                            {line.qty}
                          </td>
                          <td className="px-1 py-2 text-center text-zinc-500">
                            {line.num === "1.1.3" && priceUpdated
                              ? "1 800,00 €"
                              : line.price}
                          </td>
                          <td className="px-1 py-2 text-center text-zinc-500">
                            {line.tva}
                          </td>
                          <td className="px-1 py-2 text-right font-medium text-zinc-900">
                            {line.num === "1.1.3" && priceUpdated
                              ? "1 800,00 €"
                              : line.total}
                          </td>
                        </motion.tr>
                      ),
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <AnimatePresence>
            {showTotals && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex justify-end px-4 pb-3"
              >
                <div className="w-36 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total HT</span>
                    <span className="text-zinc-700">
                      {priceUpdated ? "4 300,00 €" : "4 050,00 €"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total TVA</span>
                    <span className="text-zinc-700">
                      {priceUpdated ? "430,00 €" : "405,00 €"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Acompte versé</span>
                    <span className="text-zinc-700">-0,00 €</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                    className="flex justify-between font-bold border-t border-zinc-200 pt-1 mt-1"
                  >
                    <span className="text-zinc-900">Total TTC</span>
                    <span style={{ color: currentTheme.primary }}>
                      {priceUpdated ? "4 730,00 €" : "4 455,00 €"}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [isYearly, setIsYearly] = useState(true);

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
                href="#fonctionnalites"
                className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                Fonctionnalités
              </Link>
              <Link
                href="#tarifs"
                className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                Tarifs
              </Link>
              <Link
                href="#faq"
                className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/help"
                className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors"
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

        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-16 lg:py-24 px-4 relative overflow-hidden">
            <div className="max-w-6xl mx-auto">
              {/* Centered Hero Content */}
              <div className="text-center space-y-6 mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex justify-center"
                >
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-sm font-medium border-zinc-200 bg-white/80 backdrop-blur-sm text-zinc-600 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                    Nouveau : Créez vos devis et factures à la voix
                  </Badge>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight max-w-4xl mx-auto"
                >
                  Artisans : Créez vos devis et factures{" "}
                  <span className="text-primary">en un temps record.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-lg lg:text-xl text-zinc-600 max-w-2xl mx-auto"
                >
                  Dictez, notre IA fait le reste : mise en page pro, calculs
                  automatiques, PDF prêt à envoyer.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex justify-center"
                >
                  <Link
                    href="/onboarding"
                    className="group relative inline-flex items-center justify-center h-14 px-10 text-lg font-semibold text-white bg-gradient-to-r from-primary to-orange-500 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Tester gratuitement maintenant
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </motion.div>
              </div>

              {/* App Mockup - Chat + Document Preview */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="relative"
              >
                <div className="relative rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-300/50 overflow-hidden">
                  <BorderBeam size={400} duration={12} />

                  {/* Browser Header */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-zinc-50/80">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="flex items-center gap-2 px-4 py-1 bg-zinc-100 rounded-md">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-xs text-zinc-500">
                          buildify.app/edition
                        </span>
                      </div>
                    </div>
                  </div>

                  <HeroDemo />
                </div>

                {/* Decorative elements */}
                <div className="absolute -z-10 -top-20 -right-20 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-60" />
                <div className="absolute -z-10 -bottom-20 -left-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40" />
              </motion.div>
            </div>
          </section>

          {/* Features Section - Modern Bento Grid */}
          <section
            id="fonctionnalites"
            className="py-16 lg:py-24 px-4 bg-zinc-50 overflow-hidden"
          >
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                  Tout ce qu&apos;il vous faut pour facturer sereinement
                </h2>
                <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                  Chaque fonctionnalité répond à un vrai problème du quotidien.
                </p>
              </motion.div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
                {/* Dictée Vocale - Large Card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  whileHover={{ scale: 1.01 }}
                  className="feature-card md:col-span-7 group relative bg-card rounded-2xl border border-orange-200/60 p-6 lg:p-8 overflow-hidden min-h-[340px] shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),_0_4px_12px_-2px_rgb(0_0_0_/_0.06)]"
                >
                  <div className="feature-card-inner relative z-10 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="max-w-[65%]">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-full mb-4 shadow-sm">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                          </span>
                          <span className="text-xs font-medium text-zinc-600">
                            IA Active
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-zinc-900">
                          Dictée vocale IA
                        </h3>
                        <p className="text-zinc-600">
                          Parlez naturellement, notre IA transcrit et structure
                          automatiquement vos devis et factures.
                        </p>
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="mt-2"
                    >
                      <div className="inline-block max-w-[180px] sm:max-w-none px-4 py-2.5 bg-white/90 backdrop-blur rounded-xl rounded-bl-none shadow-sm border border-orange-200/60 text-sm text-zinc-700">
                        &ldquo;Crée un devis pour M. Dupont, rénovation salle de
                        bain...&rdquo;
                      </div>
                    </motion.div>

                    <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col items-center gap-2 sm:gap-3">
                      <div className="p-3 bg-white/90 backdrop-blur rounded-full shadow-sm border border-orange-200/60">
                        <Mic className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex items-end gap-1.5">
                        {[32, 44, 28, 48, 36, 40, 30].map((height, i) => (
                          <motion.div
                            key={i}
                            className="w-2 bg-gradient-to-t from-orange-500 to-amber-400 rounded-full"
                            animate={{
                              height: [12, height, 12],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.1,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-br from-orange-400 to-orange-300 rounded-full blur-3xl opacity-40" />
                </motion.div>

                {/* Facture Électronique - NEW Card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="feature-card md:col-span-5 group relative bg-card rounded-2xl border border-orange-200/60 p-6 lg:p-8 overflow-hidden min-h-[340px] shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),_0_4px_12px_-2px_rgb(0_0_0_/_0.06)]"
                >
                  <div className="feature-card-inner relative z-10 h-full flex flex-col">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-full mb-4 w-fit shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-xs font-medium text-zinc-600">
                        Conforme 2026
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-zinc-900">
                      Facture électronique
                    </h3>
                    <p className="text-zinc-600 mb-4">
                      Format Factur-X intégré. Vos factures sont conformes aux
                      nouvelles obligations françaises dès maintenant.
                    </p>

                    {/* E-Invoice Document - Processor Style */}
                    <div className="mt-auto relative flex justify-center items-center py-6">
                      {/* Circuit traces radiating from center */}
                      <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 280 200"
                        fill="none"
                      >
                        {/* Left traces */}
                        <motion.path
                          d="M0 70 H30 L45 55 H60"
                          stroke="#fdba74"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                        />
                        <motion.path
                          d="M0 100 H60"
                          stroke="#fdba74"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.35, duration: 0.4 }}
                        />
                        <motion.path
                          d="M0 130 H30 L45 145 H60"
                          stroke="#fdba74"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4, duration: 0.4 }}
                        />
                        {/* Right traces */}
                        <motion.path
                          d="M280 70 H250 L235 55 H220"
                          stroke="#fdba74"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                        />
                        <motion.path
                          d="M280 100 H220"
                          stroke="#fdba74"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.35, duration: 0.4 }}
                        />
                        <motion.path
                          d="M280 130 H250 L235 145 H220"
                          stroke="#fdba74"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4, duration: 0.4 }}
                        />
                        {/* Top traces */}
                        <motion.path
                          d="M110 0 V25 L100 35 V50"
                          stroke="#fdba74"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.45, duration: 0.4 }}
                        />
                        <motion.path
                          d="M140 0 V50"
                          stroke="#fdba74"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5, duration: 0.4 }}
                        />
                        <motion.path
                          d="M170 0 V25 L180 35 V50"
                          stroke="#fdba74"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.55, duration: 0.4 }}
                        />
                        {/* Bottom traces */}
                        <motion.path
                          d="M110 200 V175 L100 165 V150"
                          stroke="#fdba74"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.45, duration: 0.4 }}
                        />
                        <motion.path
                          d="M140 200 V150"
                          stroke="#fdba74"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5, duration: 0.4 }}
                        />
                        <motion.path
                          d="M170 200 V175 L180 165 V150"
                          stroke="#fdba74"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.55, duration: 0.4 }}
                        />
                        {/* Connection dots */}
                        {[
                          [60, 55],
                          [60, 100],
                          [60, 145],
                          [220, 55],
                          [220, 100],
                          [220, 145],
                          [100, 50],
                          [140, 50],
                          [180, 50],
                          [100, 150],
                          [140, 150],
                          [180, 150],
                        ].map(([cx, cy], i) => (
                          <motion.circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r="3"
                            fill="#f97316"
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{
                              delay: 0.6 + i * 0.03,
                              type: "spring",
                            }}
                          />
                        ))}
                      </svg>

                      {/* Central Document */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10"
                      >
                        <div className="w-28 h-36 bg-white rounded-xl shadow-lg border border-orange-200 p-2.5 relative">
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-6 h-1.5 bg-orange-200 rounded" />
                            <span className="text-[6px] font-bold text-orange-500 bg-orange-50 px-1 rounded">
                              XML
                            </span>
                          </div>
                          <div className="space-y-1 mb-2">
                            <div className="w-full h-1 bg-zinc-100 rounded" />
                            <div className="w-3/4 h-1 bg-zinc-100 rounded" />
                            <div className="w-1/2 h-1 bg-zinc-100 rounded" />
                          </div>
                          <div className="grid grid-cols-3 gap-0.5">
                            {[...Array(6)].map((_, i) => (
                              <div
                                key={i}
                                className="h-1.5 bg-orange-50 rounded-sm"
                              />
                            ))}
                          </div>
                          <div className="absolute bottom-2 left-2.5 right-2.5 pt-1.5 border-t border-zinc-100">
                            <div className="flex justify-between items-center">
                              <span className="text-[6px] text-zinc-400">
                                TTC
                              </span>
                              <span className="text-[8px] font-bold text-zinc-700">
                                4 455 €
                              </span>
                            </div>
                          </div>
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.7, type: "spring" }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>

                  <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-gradient-to-br from-orange-400 to-amber-300 rounded-full blur-3xl opacity-30" />
                </motion.div>

                {/* Calculs Automatiques - Medium Card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                  className="feature-card md:col-span-6 group relative bg-card rounded-2xl border border-orange-200/60 p-6 lg:p-8 overflow-hidden min-h-[280px] shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),_0_4px_12px_-2px_rgb(0_0_0_/_0.06)]"
                >
                  <div className="feature-card-inner relative z-10">
                    <h3 className="text-2xl font-bold mb-2 text-zinc-900">
                      Calculs automatiques
                    </h3>
                    <p className="text-zinc-600 mb-6">
                      Totaux, marges, TVA BTP... Tout est calculé en temps réel.
                    </p>

                    {/* Calculator Illustration */}
                    <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-orange-200/60 shadow-sm">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500">Sous-total HT</span>
                          <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="font-medium"
                          >
                            3 712,50 €
                          </motion.span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500">TVA (10%)</span>
                          <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="font-medium"
                          >
                            371,25 €
                          </motion.span>
                        </div>
                        <div className="h-px bg-zinc-200" />
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-900 font-semibold">
                            Total TTC
                          </span>
                          <motion.span
                            className="text-2xl font-bold text-orange-600"
                            initial={{ scale: 0.5, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5, type: "spring" }}
                          >
                            4 083,75 €
                          </motion.span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 flex-wrap">
                        {["TVA 5.5%", "TVA 10%", "TVA 20%"].map((rate, i) => (
                          <motion.span
                            key={rate}
                            initial={{ y: 10, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 + i * 0.1 }}
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              i === 1
                                ? "bg-orange-100 text-orange-700"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {rate}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-gradient-to-br from-orange-400 to-orange-300 rounded-full blur-3xl opacity-40" />
                </motion.div>

                {/* PDF Automatiques - Medium Card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  whileHover={{ scale: 1.01 }}
                  className="feature-card md:col-span-6 group relative bg-card rounded-2xl border border-orange-200/60 p-6 lg:p-8 overflow-hidden min-h-[280px] shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),_0_4px_12px_-2px_rgb(0_0_0_/_0.06)]"
                >
                  <div className="feature-card-inner relative z-10">
                    <h3 className="text-2xl font-bold mb-2 text-zinc-900">
                      PDF professionnels
                    </h3>
                    <p className="text-zinc-600">
                      Documents prêts à envoyer, générés en un clic.
                    </p>

                    {/* Stacked Documents Animation */}
                    <div className="relative h-40 mt-8 flex items-center justify-center">
                      {[2, 1, 0].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute left-1/2 top-1/2"
                          initial={{ y: 40, opacity: 0, rotate: -5 + i * 5 }}
                          whileInView={{
                            y: `calc(-50% + ${i * -8}px)`,
                            opacity: 1,
                            rotate: -5 + i * 5,
                            x: "-50%",
                          }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                          style={{ zIndex: 3 - i }}
                        >
                          <div
                            className={`w-24 h-32 bg-white rounded-lg shadow-lg border border-orange-200/60 p-2.5 ${i === 0 ? "shadow-xl" : ""}`}
                          >
                            <div className="w-full h-1.5 bg-orange-200 rounded mb-1.5" />
                            <div className="w-3/4 h-1.5 bg-orange-100 rounded mb-2" />
                            <div className="space-y-1">
                              <div className="w-full h-1 bg-zinc-100 rounded" />
                              <div className="w-full h-1 bg-zinc-100 rounded" />
                              <div className="w-2/3 h-1 bg-zinc-100 rounded" />
                            </div>
                            {i === 0 && (
                              <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.8, type: "spring" }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
                              >
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                          {i === 0 && (
                            <div className="absolute inset-0 overflow-hidden rounded-lg">
                              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-orange-200/70 to-transparent" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-gradient-to-br from-orange-400 to-orange-300 rounded-full blur-3xl opacity-40" />
                </motion.div>

                {/* Gestion Clients - Compact Horizontal Card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  whileHover={{ scale: 1.01 }}
                  className="feature-card md:col-span-12 group relative bg-card rounded-2xl border border-orange-200/60 p-6 lg:p-8 overflow-hidden shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),_0_4px_12px_-2px_rgb(0_0_0_/_0.06)]"
                >
                  <div className="feature-card-inner relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold mb-2 text-zinc-900">
                        Gestion clients intégrée
                      </h3>
                      <p className="text-zinc-600">
                        Tous vos contacts au même endroit. Historique des devis
                        et factures accessible en un clic.
                      </p>
                    </div>

                    {/* Client Cards Illustration */}
                    <div className="flex gap-2 sm:gap-3 w-full lg:w-auto lg:flex-shrink-0">
                      {[
                        { name: "M. Dupont", color: "bg-orange-500" },
                        { name: "Mme Martin", color: "bg-amber-500" },
                        { name: "SCI Habitat", color: "bg-red-400" },
                      ].map((client, i) => (
                        <motion.div
                          key={client.name}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="bg-white rounded-xl p-2.5 sm:p-3 shadow-sm border border-zinc-200 flex-1 lg:flex-none lg:min-w-[100px]"
                        >
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 ${client.color} rounded-full mb-2 flex items-center justify-center text-white text-xs font-bold`}
                          >
                            {client.name.charAt(0)}
                          </div>
                          <p className="text-xs font-medium text-zinc-900 truncate">
                            {client.name}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            3 documents
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-br from-orange-400 to-orange-300 rounded-full blur-3xl opacity-30" />
                </motion.div>
              </div>
            </div>
          </section>

          {/* Max AI Assistant Section */}
          <section className="py-16 lg:py-24 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 via-orange-50/40 to-white" />
            <div className="max-w-6xl mx-auto relative">
              {/* Mobile: Title first */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8 lg:hidden"
              >
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-sm font-medium border-zinc-200 bg-white/80 backdrop-blur-sm text-zinc-600 shadow-sm mb-4"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                  Assistant IA
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight mt-4">
                  Rencontrez <span className="text-primary">Max</span>
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                {/* Max Image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative flex justify-center lg:justify-start"
                >
                  <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-300 rounded-full blur-3xl opacity-30 scale-110" />

                    {/* Main image container */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="relative"
                    >
                      <div className="relative w-64 h-64 lg:w-80 lg:h-80">
                        <Image
                          src={MAX_AVATAR_URL}
                          alt="Max - Assistant IA Buildify"
                          fill
                          className="object-cover rounded-3xl shadow-2xl shadow-orange-500/20"
                          unoptimized
                        />

                        {/* Online indicator */}
                        <div className="absolute -bottom-2 -right-2 lg:-bottom-3 lg:-right-3 bg-white rounded-full p-2 shadow-lg">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-medium text-green-700">
                              En ligne
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Decorative elements */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                      className="absolute -left-4 top-1/4 bg-white rounded-xl p-3 shadow-lg border border-orange-100 hidden lg:block"
                    >
                      <Sparkles className="w-5 h-5 text-orange-500" />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                      className="absolute -right-4 bottom-1/4 bg-white rounded-xl p-3 shadow-lg border border-orange-100 hidden lg:block"
                    >
                      <FileCheck className="w-5 h-5 text-orange-500" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center lg:text-left"
                >
                  {/* Desktop: Title here */}
                  <div className="hidden lg:block">
                    <Badge
                      variant="outline"
                      className="px-4 py-2 text-sm font-medium border-zinc-200 bg-white/80 backdrop-blur-sm text-zinc-600 shadow-sm mb-4"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                      Assistant IA
                    </Badge>
                    <h2 className="text-4xl xl:text-5xl font-bold tracking-tight mt-4 mb-4">
                      Rencontrez <span className="text-primary">Max</span>
                    </h2>
                  </div>

                  <p className="text-lg lg:text-xl text-zinc-600 mb-8">
                    Votre assistant personnel qui transforme vos paroles en
                    documents professionnels. Disponible 24h/24, Max ne dort
                    jamais et ne fait pas d&apos;erreurs de calcul.
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      "Crée vos devis et factures en 30 secondes",
                      "Remplit les lignes, quantités et prix",
                      "Structure avec sections et sous-sections",
                    ].map((text, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-start gap-3 text-left"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0 mt-2" />
                        <span className="text-zinc-700 text-sm sm:text-base">
                          {text}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full text-sm text-orange-700"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    Plus de 1 000 devis créés ce mois
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="tarifs" className="py-16 lg:py-24 px-4">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                  Des prix simples, sans surprise
                </h2>
                <p className="text-lg text-zinc-600 max-w-2xl mx-auto mb-8">
                  14 jours d&apos;essai gratuit. Pas d&apos;engagement, annulez
                  quand vous voulez.
                </p>

                {/* Toggle Mensuel/Annuel */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-sm font-medium transition-colors ${!isYearly ? "text-zinc-950" : "text-zinc-500"}`}
                    >
                      Mensuel
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsYearly(!isYearly)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${isYearly ? "bg-primary" : "bg-zinc-300"}`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isYearly ? "translate-x-7" : "translate-x-0"}`}
                      />
                    </button>
                    <span
                      className={`text-sm font-medium transition-colors ${isYearly ? "text-zinc-950" : "text-zinc-500"}`}
                    >
                      Annuel
                    </span>
                  </div>
                  <AnimatePresence>
                    {isYearly && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary to-orange-500 text-white rounded-full text-sm font-medium shadow-lg shadow-primary/25"
                      >
                        <Sparkles className="w-4 h-4" />2 mois offerts
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {pricingPlans.map((plan, index) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`relative rounded-2xl border p-8 ${
                      plan.popular
                        ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                        Le plus populaire
                      </Badge>
                    )}

                    <div className="text-center mb-8">
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-zinc-600 text-sm mb-4">
                        {plan.description}
                      </p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">
                          {isYearly
                            ? plan.yearlyMonthlyPrice
                            : plan.monthlyPrice}
                          €
                        </span>
                        <span className="text-zinc-500">HT /mois</span>
                      </div>
                      {isYearly && (
                        <p className="text-sm text-zinc-500 mt-2">
                          soit {plan.yearlyPrice}€ HT /an
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm text-zinc-700">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      asChild
                    >
                      <Link
                        href={`/onboarding?plan=${plan.id}&billing=${isYearly ? "yearly" : "monthly"}`}
                      >
                        {plan.cta}
                      </Link>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="py-16 lg:py-24 px-4 bg-zinc-50">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                  Ils ont adopté Buildify
                </h2>
                <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                  Découvrez ce que les artisans pensent de notre solution.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.name}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative bg-white rounded-2xl border border-zinc-200 p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Quote className="absolute top-6 right-6 w-8 h-8 text-orange-100" />

                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < testimonial.rating ? "fill-orange-400 text-orange-400" : "fill-zinc-200 text-zinc-200"}`}
                        />
                      ))}
                    </div>

                    <p className="text-zinc-700 mb-6 relative z-10 leading-relaxed">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>

                    <div className="flex items-center gap-4">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                        unoptimized
                      />
                      <div>
                        <p className="font-semibold text-zinc-900">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {testimonial.role} • {testimonial.location}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="py-16 lg:py-24 px-4">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                  Questions fréquentes
                </h2>
                <p className="text-lg text-zinc-600">
                  Tout ce que vous devez savoir avant de commencer.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Accordion type="single" collapsible className="space-y-4">
                  {faqItems.map((item, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="bg-white rounded-xl border border-zinc-200 px-6 data-[state=open]:shadow-lg transition-shadow"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-5">
                        <span className="font-medium">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-zinc-600 pb-5">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-16 lg:py-24 px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                Prêt à gagner 1 heure par jour ?
              </h2>
              <p className="text-lg text-zinc-600 mb-8 max-w-2xl mx-auto">
                Rejoignez les artisans qui ont déjà simplifié leur facturation.
                14 jours d&apos;essai gratuit, sans engagement.
              </p>
              <Button size="lg" className="text-base h-12 px-8" asChild>
                <Link href="/onboarding">
                  Créer mon compte gratuitement
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-200 bg-zinc-50">
          <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <Link
                  href="/"
                  className="flex items-center gap-2 font-bold text-xl mb-4"
                >
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buildify-assets/Logo/Logo02.svg`}
                    alt="Buildify"
                    width={28}
                    height={28}
                    className="flex-shrink-0 drop-shadow-sm"
                    unoptimized
                  />
                  Buildify
                </Link>
                <p className="text-sm text-zinc-500 mb-4">
                  La facturation vocale pour les artisans du BTP.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="#"
                    className="w-9 h-9 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                  >
                    <Twitter className="w-4 h-4 text-zinc-600" />
                  </Link>
                  <Link
                    href="#"
                    className="w-9 h-9 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                  >
                    <Linkedin className="w-4 h-4 text-zinc-600" />
                  </Link>
                </div>
              </div>

              {/* Produit */}
              <div>
                <h4 className="font-semibold mb-4">Produit</h4>
                <ul className="space-y-3 text-sm text-zinc-600">
                  <li>
                    <Link
                      href="#fonctionnalites"
                      className="hover:text-zinc-900"
                    >
                      Fonctionnalités
                    </Link>
                  </li>
                  <li>
                    <Link href="#tarifs" className="hover:text-zinc-900">
                      Tarifs
                    </Link>
                  </li>
                  <li>
                    <Link href="#faq" className="hover:text-zinc-900">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Ressources */}
              <div>
                <h4 className="font-semibold mb-4">Ressources</h4>
                <ul className="space-y-3 text-sm text-zinc-600">
                  <li>
                    <Link href="/help" className="hover:text-zinc-900">
                      Centre d&apos;aide
                    </Link>
                  </li>
                  <li>
                    <Link href="/help/contact" className="hover:text-zinc-900">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal" className="hover:text-zinc-900">
                      Informations légales
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Légal */}
              <div>
                <h4 className="font-semibold mb-4">Légal</h4>
                <ul className="space-y-3 text-sm text-zinc-600">
                  <li>
                    <Link
                      href="/legal?section=cgu"
                      className="hover:text-zinc-900"
                    >
                      Conditions générales
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/legal?section=mentions"
                      className="hover:text-zinc-900"
                    >
                      Mentions légales
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/legal?section=privacy"
                      className="hover:text-zinc-900"
                    >
                      Confidentialité
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/legal?section=cookies"
                      className="hover:text-zinc-900"
                    >
                      Cookies
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom */}
            <div className="pt-8 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-zinc-500">
                © {new Date().getFullYear()} Buildify. Tous droits réservés.
              </p>
              <p className="text-sm text-zinc-500">
                Fait avec passion en France
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
