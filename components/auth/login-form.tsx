"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, ArrowRight } from "lucide-react";

const MAX_AVATAR_URL =
  "https://ckvcijpgohqlnvoinwmc.supabase.co/storage/v1/object/public/buildify-assets/Logo/Agent%20IA.png";

function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    "Invalid login credentials": "Email ou mot de passe incorrect",
    "Email not confirmed":
      "Veuillez confirmer votre email avant de vous connecter",
    "Invalid email or password": "Email ou mot de passe incorrect",
    "User not found": "Aucun compte trouvé avec cet email",
    "Too many requests": "Trop de tentatives. Veuillez réessayer plus tard",
    "Network error": "Erreur de connexion. Vérifiez votre connexion internet",
  };

  for (const [english, french] of Object.entries(translations)) {
    if (message.toLowerCase().includes(english.toLowerCase())) {
      return french;
    }
  }
  return message;
}

const subscribe = () => () => {};
const getSnapshot = () => localStorage.getItem("buildify-user-name");
const getServerSnapshot = () => null;

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const savedName = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(translateAuthError(error.message));
      setLoading(false);
      return;
    }

    // Sauvegarder le prénom pour la prochaine visite
    if (data.user?.user_metadata?.first_name) {
      localStorage.setItem(
        "buildify-user-name",
        data.user.user_metadata.first_name,
      );
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="w-full max-w-md">
      {/* Header avec message de bienvenue */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4 overflow-hidden">
          <Image
            src={MAX_AVATAR_URL}
            alt="Max"
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
        {savedName ? (
          <>
            <h1 className="text-2xl font-bold text-zinc-900">
              Bon retour, {savedName} !
            </h1>
            <p className="text-zinc-500 mt-2">
              Connectez-vous pour accéder à votre espace
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-zinc-900">Bon retour !</h1>
            <p className="text-zinc-500 mt-2">
              Connectez-vous pour accéder à votre espace Buildify
            </p>
          </>
        )}
      </div>

      {/* Formulaire */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-zinc-700"
              >
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-11 pl-10 pr-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-zinc-700"
              >
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-11 pl-10 pr-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <p className="text-sm text-zinc-500 text-center mt-6">
        Pas encore de compte ?{" "}
        <Link
          href="/onboarding"
          className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
