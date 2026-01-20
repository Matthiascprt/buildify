"use client";

import {
  Suspense,
  useState,
  useTransition,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Send,
  Loader2,
  Check,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Mic,
  MicOff,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { DocumentContent } from "@/lib/supabase/types";

type OnboardingStep =
  | "questions"
  | "chat"
  | "loading"
  | "preview"
  | "signup"
  | "confirmation";

const MAX_AVATAR_URL =
  "https://ckvcijpgohqlnvoinwmc.supabase.co/storage/v1/object/public/buildify-assets/Logo/Agent%20IA.png";

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
    ],
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
    ],
    popular: true,
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const getLoadingMessages = (type: "quote" | "invoice") => {
  const docLabel = type === "invoice" ? "facture" : "devis";
  return [
    "Analyse de votre demande...",
    `Génération de votre ${docLabel}...`,
    "Calcul des montants...",
    "Finalisation...",
  ];
};

const detectDocumentTypeFromMessage = (
  message: string,
): "quote" | "invoice" => {
  const lowerMessage = message.toLowerCase();
  const invoiceKeywords = ["facture", "facturer", "à facturer", "facturé"];
  return invoiceKeywords.some((k) => lowerMessage.includes(k))
    ? "invoice"
    : "quote";
};

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const planFromUrl = searchParams.get("plan");
  const billingFromUrl = searchParams.get("billing");
  const initialPlan = planFromUrl === "standard" ? "standard" : "pro";
  const initialBilling = billingFromUrl === "monthly" ? false : true;

  const [step, setStep] = useState<OnboardingStep>("questions");
  const [selectedPlan, setSelectedPlan] = useState<"standard" | "pro">(
    initialPlan,
  );
  const [isYearly, setIsYearly] = useState(initialBilling);
  const [companyData, setCompanyData] = useState({
    activity: "",
    name: "",
  });
  const [chatMessage, setChatMessage] = useState("");
  const [generatedDocument, setGeneratedDocument] =
    useState<DocumentContent | null>(null);
  const [generatedClientName, setGeneratedClientName] = useState<string | null>(
    null,
  );
  const [documentType, setDocumentType] = useState<"quote" | "invoice">(
    "quote",
  );
  const [aiResponse, setAiResponse] = useState("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = getLoadingMessages(documentType);

  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown] = useState(5);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (step === "confirmation" && countdown === 0) {
      router.push("/login");
    }
  }, [step, countdown, router]);

  const startRecording = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert(
        "La reconnaissance vocale n'est pas supportée par votre navigateur",
      );
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setChatMessage((prev) => prev + (prev ? " " : "") + finalTranscript);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
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

  const handleQuestionsSubmit = () => {
    if (companyData.activity.trim() && companyData.name.trim()) {
      setStep("chat");
    }
  };

  const handleChatSubmit = async () => {
    if (!chatMessage.trim()) return;

    const detectedType = detectDocumentTypeFromMessage(chatMessage);
    setDocumentType(detectedType);
    setStep("loading");

    const currentLoadingMessages = getLoadingMessages(detectedType);
    const interval = setInterval(() => {
      setLoadingMessageIndex(
        (prev) => (prev + 1) % currentLoadingMessages.length,
      );
    }, 800);

    try {
      const response = await fetch("/api/onboarding/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatMessage,
          companyName: companyData.name,
          activity: companyData.activity,
        }),
      });

      const data = await response.json();

      if (data.document) {
        setGeneratedDocument(data.document);
        setGeneratedClientName(data.clientName || null);
        setDocumentType(data.documentType || "quote");
        const docLabel = data.documentType === "invoice" ? "facture" : "devis";
        setAiResponse(data.aiResponse || `Votre ${docLabel} a été généré !`);
      }
    } catch {
      setAiResponse("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      clearInterval(interval);
      setTimeout(() => setStep("preview"), 500);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupData.password !== signupData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (signupData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    startTransition(async () => {
      // Sign up user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/login`,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError(
            "Création impossible : cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.",
          );
        } else {
          setError(authError.message);
        }
        return;
      }

      // Check if user already exists (Supabase returns user with empty identities)
      if (authData.user && authData.user.identities?.length === 0) {
        setError(
          "Création impossible : ce compte existe déjà. Connectez-vous ou utilisez un autre email.",
        );
        return;
      }

      if (authData.user) {
        if (generatedDocument) {
          localStorage.setItem(
            "pendingOnboardingDocument",
            JSON.stringify({
              document: generatedDocument,
              documentType,
              companyName: companyData.name,
              activity: companyData.activity,
              clientName: generatedClientName,
            }),
          );
        }

        try {
          const response = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan: selectedPlan,
              isYearly,
              email: signupData.email,
              userId: authData.user.id,
            }),
          });

          const data = await response.json();

          if (data.url) {
            window.location.href = data.url;
            return;
          } else {
            setError("Erreur lors de la création de la session de paiement");
            return;
          }
        } catch {
          setError("Erreur de connexion au service de paiement");
          return;
        }
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {step === "questions" && (
          <motion.div
            key="questions"
            {...fadeInUp}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8 md:p-10"
          >
            <div className="flex items-center gap-4 mb-8">
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
                  Bonjour ! Je suis Max
                </h1>
                <p className="text-zinc-500">
                  Votre assistant devis & factures
                </p>
              </div>
            </div>

            <p className="text-zinc-600 mb-8">
              Avant de commencer, j&apos;ai besoin de quelques informations sur
              votre entreprise.
            </p>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="activity"
                  className="block text-sm font-medium text-zinc-700 mb-2"
                >
                  Quelle est votre activité ?
                </label>
                <Input
                  id="activity"
                  placeholder="Ex: Plombier, Électricien, Maçon..."
                  value={companyData.activity}
                  onChange={(e) =>
                    setCompanyData((prev) => ({
                      ...prev,
                      activity: e.target.value,
                    }))
                  }
                  className="h-12 text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-zinc-700 mb-2"
                >
                  Nom de votre société
                </label>
                <Input
                  id="companyName"
                  placeholder="Ex: Dupont Plomberie SARL"
                  value={companyData.name}
                  onChange={(e) =>
                    setCompanyData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="h-12 text-base"
                />
              </div>
            </div>

            <Button
              onClick={handleQuestionsSubmit}
              disabled={
                !companyData.activity.trim() || !companyData.name.trim()
              }
              className="w-full h-12 mt-8 text-base font-semibold bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-primary transition-all"
            >
              Continuer
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === "chat" && (
          <motion.div
            key="chat"
            {...fadeInUp}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8 md:p-10"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-orange-500 text-white rounded-full text-base font-semibold mb-6 shadow-lg shadow-primary/30">
                <Sparkles className="w-5 h-5" />
                Testez Max gratuitement
              </div>

              <div className="relative w-24 h-24 mx-auto mb-4">
                <Image
                  src={MAX_AVATAR_URL}
                  alt="Max"
                  width={96}
                  height={96}
                  className="rounded-full ring-4 ring-orange-100 shadow-lg"
                  unoptimized
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-zinc-900 mb-2">
                Créez votre premier document
              </h2>
              <p className="text-zinc-500 text-sm">
                Décrivez votre devis ou facture, Max s&apos;occupe du reste
              </p>
            </div>

            <div className="bg-zinc-50 rounded-xl p-4 mb-6">
              <p className="text-zinc-600 text-sm">
                <span className="font-medium text-zinc-700">Exemple : </span>
                &quot;Devis pour M. Dupont, rénovation salle de bain : dépose
                carrelage 15m² à 25€/m², pose faïence 25m² à 85€/m², douche
                italienne 1 550€&quot;
              </p>
            </div>

            <div className="relative">
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Décrivez votre devis ou facture..."
                className="w-full min-h-[120px] p-4 pr-28 text-base border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSubmit();
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleRecording}
                  className={`h-10 w-10 rounded-lg ${isRecording ? "animate-pulse" : ""}`}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  onClick={handleChatSubmit}
                  disabled={!chatMessage.trim()}
                  size="icon"
                  className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mt-3 text-center">
              {isRecording ? (
                <span className="text-red-500 font-medium">
                  Enregistrement en cours... Cliquez pour arrêter
                </span>
              ) : (
                "Dictez votre devis ou facture, puis tapez Entrée pour envoyer"
              )}
            </p>
          </motion.div>
        )}

        {step === "loading" && (
          <motion.div
            key="loading"
            {...fadeInUp}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-12 text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-orange-500 animate-spin" />
              <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMessageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-medium text-zinc-700"
              >
                {loadingMessages[loadingMessageIndex]}
              </motion.p>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === "preview" && (
          <motion.div
            key="preview"
            {...fadeInUp}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">
                  {documentType === "invoice"
                    ? "Votre facture est prête !"
                    : "Votre devis est prêt !"}
                </p>
                <p className="text-sm text-zinc-500">{aiResponse}</p>
              </div>
            </div>

            <div className="relative">
              <div className="p-6 bg-zinc-50">
                <div className="bg-white rounded-lg border border-zinc-200 p-6 filter blur-[3px] select-none pointer-events-none">
                  <div className="flex justify-between mb-6">
                    <div>
                      <p className="font-bold text-lg">{companyData.name}</p>
                      <p className="text-sm text-zinc-500">
                        {companyData.activity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-500">
                        {documentType === "invoice" ? "FACTURE" : "DEVIS"}
                      </p>
                      <p className="font-semibold">
                        N° {documentType === "invoice" ? "F" : "D"}-2025-001
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 pt-4">
                    {generatedDocument?.sections?.[0]?.subsections?.[0]?.lines
                      ?.slice(0, 3)
                      .map((line, i) => (
                        <div
                          key={i}
                          className="flex justify-between py-2 border-b border-zinc-50"
                        >
                          <span className="text-zinc-700">
                            {line.designation}
                          </span>
                          <span className="font-medium">
                            {line.total_ht?.toFixed(2)} €
                          </span>
                        </div>
                      )) || (
                      <>
                        <div className="flex justify-between py-2 border-b border-zinc-50">
                          <span className="text-zinc-700">Ligne exemple 1</span>
                          <span className="font-medium">250,00 €</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-zinc-50">
                          <span className="text-zinc-700">Ligne exemple 2</span>
                          <span className="font-medium">1 500,00 €</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-zinc-700">Ligne exemple 3</span>
                          <span className="font-medium">800,00 €</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-200">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total TTC</span>
                      <span className="text-primary">
                        {generatedDocument?.totals?.total_ttc?.toFixed(2) ||
                          "2 550,00"}{" "}
                        €
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-8">
                <Button
                  onClick={() => setStep("signup")}
                  className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  {documentType === "invoice"
                    ? "Créer un compte pour voir la facture complète"
                    : "Créer un compte pour voir le devis complet"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "signup" && (
          <motion.div
            key="signup"
            {...fadeInUp}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8 md:p-10 max-w-3xl w-full"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                14 jours d&apos;essai gratuit
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">
                Finalisez votre inscription
              </h2>
              <p className="text-zinc-500 mt-2">
                {documentType === "invoice"
                  ? "Accédez à votre facture et gérez vos documents"
                  : "Accédez à votre devis et commencez à facturer"}
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Prénom
                  </label>
                  <Input
                    value={signupData.firstName}
                    onChange={(e) =>
                      setSignupData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="Jean"
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Nom
                  </label>
                  <Input
                    value={signupData.lastName}
                    onChange={(e) =>
                      setSignupData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Dupont"
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={signupData.email}
                  onChange={(e) =>
                    setSignupData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="jean@exemple.com"
                  required
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Confirmer
                  </label>
                  <Input
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) =>
                      setSignupData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100">
                <div className="bg-green-50 rounded-xl p-5 mb-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900">
                          14 jours d&apos;essai gratuit
                        </p>
                        <p className="text-sm text-green-700">
                          Aucun paiement requis pour commencer
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-700">0€</p>
                      <p className="text-xs text-green-600">aujourd&apos;hui</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 mb-6">
                  <p className="text-sm font-medium text-zinc-700">
                    Choisissez votre formule
                  </p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pricingPlans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() =>
                        setSelectedPlan(plan.id as "standard" | "pro")
                      }
                      className={`relative text-left rounded-xl p-5 border-2 transition-all ${
                        selectedPlan === plan.id
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                          Le plus populaire
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-zinc-900">
                            {plan.name}
                          </h3>
                          <p className="text-xs text-zinc-500">
                            {plan.description}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPlan === plan.id
                              ? "border-primary bg-primary"
                              : "border-zinc-300"
                          }`}
                        >
                          {selectedPlan === plan.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-2xl font-bold text-zinc-900">
                          {isYearly
                            ? plan.yearlyMonthlyPrice
                            : plan.monthlyPrice}
                          €
                        </span>
                        <span className="text-sm text-zinc-500">HT /mois</span>
                      </div>
                      {isYearly && (
                        <p className="text-xs text-zinc-500 mb-3">
                          soit {plan.yearlyPrice}€ HT /an
                        </p>
                      )}

                      <div className="space-y-2">
                        {plan.features.map((feature) => (
                          <div
                            key={feature}
                            className="flex items-center gap-2 text-xs text-zinc-600"
                          >
                            <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-zinc-100">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <Sparkles className="w-3 h-3" />
                          14 jours d&apos;essai gratuit
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-50 rounded-lg p-4 text-center">
                <p className="text-sm text-zinc-600">
                  <strong className="text-zinc-900">
                    Commencez gratuitement
                  </strong>{" "}
                  - vous ne serez débité que dans 14 jours
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Annulation possible à tout moment, sans engagement
                </p>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-primary transition-all"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Procéder au paiement
                  </>
                )}
              </Button>

              <p className="text-xs text-zinc-400 text-center">
                En créant un compte, vous acceptez nos{" "}
                <a href="/legal/terms" className="text-primary hover:underline">
                  conditions d&apos;utilisation
                </a>{" "}
                et notre{" "}
                <a
                  href="/legal/privacy"
                  className="text-primary hover:underline"
                >
                  politique de confidentialité
                </a>
              </p>
            </form>
          </motion.div>
        )}

        {step === "confirmation" && (
          <motion.div
            key="confirmation"
            {...fadeInUp}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-10 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <Mail className="w-10 h-10 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-zinc-900 mb-3">
              Vérifiez votre boîte mail
            </h2>

            <p className="text-zinc-600 mb-2">
              Un email de confirmation a été envoyé à
            </p>
            <p className="font-semibold text-zinc-900 mb-6">
              {signupData.email}
            </p>

            <div className="bg-zinc-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-zinc-500">
                Cliquez sur le lien dans l&apos;email pour activer votre compte
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {countdown}
                </span>
              </div>
              <p className="text-sm text-zinc-500">
                Redirection vers la connexion...
              </p>
            </div>

            <Button
              onClick={() => router.push("/login")}
              variant="ghost"
              className="mt-6 text-primary hover:text-primary/80"
            >
              Aller à la page de connexion maintenant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {step !== "confirmation" && (
        <div className="flex justify-center gap-2 mt-8">
          {(["questions", "chat", "loading", "preview", "signup"] as const).map(
            (s, i) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === s
                    ? "w-8 bg-primary"
                    : i <
                        [
                          "questions",
                          "chat",
                          "loading",
                          "preview",
                          "signup",
                        ].indexOf(step)
                      ? "w-2 bg-primary/50"
                      : "w-2 bg-zinc-200"
                }`}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-2xl mx-auto animate-pulse">
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 p-8 h-96" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
