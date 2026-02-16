"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signIn("resend", {
        email,
        callbackUrl: "/dashboard",
        redirect: false,
      });
      window.location.href = "/login/verify";
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="text-2xl font-semibold text-foreground">
            Visicheck
          </Link>
          <h1 className="mt-4 text-xl font-medium">Mit E-Mail anmelden</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wir senden Ihnen einen Magic Link zum Anmelden
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              placeholder="ihre@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-11"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Wird gesendet…" : "Magic Link senden"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">
            Zurück zur Startseite
          </Link>
        </p>
      </div>
    </div>
  );
}
