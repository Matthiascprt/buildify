"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ArrowRight, Loader2, Sparkles, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push("/onboarding");
      return;
    }

    async function verifyAndCreateSubscription() {
      try {
        const res = await fetch("/api/stripe/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok) {
          const data = await res.json();
          console.error("Session verification failed:", data);
          const errorMsg = data.details
            ? `${data.error}: ${data.details}`
            : data.error || "Erreur de vérification";
          setError(errorMsg);
        }
      } catch (err) {
        console.error("Error verifying session:", err);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAndCreateSubscription();
  }, [sessionId, router]);

  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (countdown === 0) {
      router.push("/login");
    }
  }, [countdown, router]);

  if (isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-10 text-center"
        >
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-orange-500 animate-spin" />
            <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-zinc-600 font-medium">
            Finalisation de votre inscription...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-10 text-center"
        >
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <Button onClick={() => router.push("/onboarding")}>
            Retourner à l&apos;inscription
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8 md:p-10 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative w-20 h-20 mx-auto mb-6"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-500" />
          <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-4">
            <Check className="w-4 h-4" />
            Paiement confirmé
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Paiement validé !
          </h1>

          <p className="text-zinc-500 mb-6">Votre compte a bien été créé</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 mb-6 border border-green-200"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="font-semibold text-zinc-900 mb-1">
            Confirmez votre e-mail
          </p>
          <p className="text-sm text-zinc-600">
            Un e-mail de confirmation vous a été envoyé. Veuillez cliquer sur le
            lien pour activer votre compte.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center justify-center gap-3 p-3 bg-zinc-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {countdown}
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              Redirection vers la connexion...
            </p>
          </div>
        </motion.div>

        <Button
          onClick={() => router.push("/login")}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-primary transition-all shadow-lg shadow-primary/20"
        >
          Accéder à la connexion
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-lg mx-auto py-20 text-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
    </div>
  );
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessPageContent />
    </Suspense>
  );
}
