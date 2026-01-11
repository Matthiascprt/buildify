"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Connexion</h1>
        <p className="text-sm text-zinc-500">
          Entrez vos identifiants pour accéder à votre compte
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-zinc-900"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-9 px-3 py-1 text-sm bg-white border border-zinc-300 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-900"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-9 px-3 py-1 text-sm bg-white border border-zinc-300 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex flex-col space-y-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          <p className="text-sm text-zinc-500 text-center">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-orange-600 hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
