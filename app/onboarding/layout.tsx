import Link from "next/link";
import Image from "next/image";
import { ThemeProvider } from "next-themes";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-50 to-orange-50/30">
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white/80 backdrop-blur-sm border-b border-zinc-100">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buildify-assets/Logo/icon (1).svg`}
              alt="Buildify"
              width={32}
              height={32}
              className="flex-shrink-0"
              unoptimized
            />
            Buildify
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            Retour au site
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
