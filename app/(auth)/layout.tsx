import Link from "next/link";
import Image from "next/image";
import { ThemeProvider } from "next-themes";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
      <div className="min-h-screen flex flex-col bg-white text-zinc-950">
        <header className="h-16 border-b border-zinc-200 flex items-center px-4 lg:px-8">
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
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
