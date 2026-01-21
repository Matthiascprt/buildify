import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = requestUrl.origin;

  const supabase = await createClient();

  // Handle PKCE flow (login/signup with code)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Handle email change, password recovery, etc. (with token_hash)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Redirect based on type
      if (type === "email_change") {
        return NextResponse.redirect(`${origin}/settings?email_changed=true`);
      }
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      // Email confirmation after signup → redirect to setup
      if (type === "signup" || type === "email") {
        return NextResponse.redirect(`${origin}/setup`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si erreur ou pas de code/token, rediriger vers login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
