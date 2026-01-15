import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validation des variables d'environnement
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "❌ Variables d'environnement Supabase manquantes. Vérifiez votre fichier .env.local",
    );
    return supabaseResponse;
  }

  if (
    supabaseUrl === "your-project-url" ||
    supabaseAnonKey === "your-anon-key" ||
    !supabaseUrl.startsWith("http")
  ) {
    console.error(
      "❌ URL Supabase invalide. Assurez-vous d'avoir rempli correctement votre fichier .env.local avec vos vraies valeurs Supabase.",
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedRoutes = [
    "/dashboard",
    "/documents",
    "/clients",
    "/settings",
    "/edition",
    "/setup",
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Check company completeness for authenticated users
  const isSetupPage = request.nextUrl.pathname.startsWith("/setup");
  if (isProtectedRoute && user) {
    const { data: company } = await supabase
      .from("companies")
      .select("address, phone, email, siret")
      .eq("user_id", user.id)
      .single();

    const isCompanyComplete =
      company &&
      company.address &&
      company.phone &&
      company.email &&
      company.siret;

    if (!isCompanyComplete && !isSetupPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/setup";
      return NextResponse.redirect(url);
    }

    if (isCompanyComplete && isSetupPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from auth pages
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
