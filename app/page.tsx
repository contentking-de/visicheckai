import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, Shield, Zap, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-xl font-semibold">Visicheck</span>
          <Button asChild variant="ghost">
            <Link href="/login">Anmelden</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-24">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Sichtbarkeit Ihrer Marken in AI-Chats tracken
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Überwachen Sie, wie ChatGPT, Claude, Gemini und Perplexity Ihre
            Domains und Marken erwähnen. Definieren Sie Prompts, wählen Sie
            Intervalle – täglich, wöchentlich oder monatlich.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-12 px-8">
              <Link href="/login">Mit E-Mail starten</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto mt-32 grid max-w-5xl gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">Domains & Marken</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Fügen Sie Ihre Domains und Marken hinzu und verknüpfen Sie sie mit
              Prompt-Sets.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">Definierbare Prompts</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Erstellen Sie Prompts, die Ihre Sichtbarkeit in den vier AI-Modellen
              messen.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">Flexible Intervalle</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Täglich, wöchentlich, monatlich oder on-demand – Sie entscheiden.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">Passwort-frei</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Sichere Anmeldung per Magic Link – kein Passwort nötig.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
