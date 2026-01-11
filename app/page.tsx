import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FileText, Mic, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 bg-background z-50">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
          <Image
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buildify-assets/Logo/logo.svg`}
            alt="Buildify"
            width={32}
            height={32}
            className="flex-shrink-0"
            unoptimized
          />
          Buildify
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Connexion</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Commencer</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-12 lg:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-3xl lg:text-5xl font-bold tracking-tight">
              Créez vos devis et factures
              <br />
              <span className="text-muted-foreground">
                en moins de 2 minutes
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Buildify utilise l&apos;IA pour vous aider à créer des documents
              professionnels rapidement. Dictez, et c&apos;est fait.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link href="/register">Essayer gratuitement</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 lg:py-24 px-4 bg-muted/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12">
              Simple. Rapide. Efficace.
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Dictée vocale</h3>
                <p className="text-muted-foreground text-sm">
                  Dictez vos devis naturellement, l&apos;IA structure tout pour
                  vous.
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Ultra rapide</h3>
                <p className="text-muted-foreground text-sm">
                  Créez un devis complet en moins de 2 minutes, même sur le
                  chantier.
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">PDF professionnel</h3>
                <p className="text-muted-foreground text-sm">
                  Exportez et envoyez des documents conformes aux normes
                  françaises.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 lg:py-24 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-2xl lg:text-3xl font-bold">
              Prêt à gagner du temps ?
            </h2>
            <p className="text-muted-foreground">
              14 jours d&apos;essai gratuit. Aucune carte bancaire requise.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">Créer mon compte gratuit</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Buildify. Tous droits réservés.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:underline">
              Mentions légales
            </Link>
            <Link href="#" className="hover:underline">
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
