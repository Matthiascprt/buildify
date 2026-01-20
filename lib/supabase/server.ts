import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Variables d'environnement Supabase manquantes. Vérifiez votre fichier .env.local",
    );
  }

  // Vérification que les valeurs ne sont pas les placeholders
  if (
    supabaseUrl === "your-project-url" ||
    supabaseAnonKey === "your-anon-key"
  ) {
    throw new Error(
      "⚠️ Veuillez remplacer les valeurs placeholder dans .env.local par vos vraies clés Supabase.\n" +
        "Obtenez-les ici : https://supabase.com/dashboard/project/_/settings/api\n" +
        "Puis redémarrez le serveur avec 'pnpm dev'",
    );
  }

  // Vérification du format de l'URL
  if (
    !supabaseUrl.startsWith("http://") &&
    !supabaseUrl.startsWith("https://")
  ) {
    throw new Error(
      `URL Supabase invalide : "${supabaseUrl}". L'URL doit commencer par http:// ou https://`,
    );
  }

  // Validation de l'URL
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(
      `URL Supabase invalide : "${supabaseUrl}". Format attendu : https://votre-projet.supabase.co`,
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Variables d'environnement Supabase manquantes (URL ou SERVICE_ROLE_KEY)",
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}
