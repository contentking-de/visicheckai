"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Zap, FileText, CreditCard, Check } from "lucide-react";

export default function SignUpPage() {
  const t = useTranslations("SignUp");
  const tc = useTranslations("Common");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignUp = () => {
    setIsGoogleLoading(true);
    document.cookie = "signup_intent=true; path=/; max-age=600; samesite=lax";
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "AlreadyRegistered") {
          setError(t("alreadyRegistered"));
        } else {
          setError(tc("errorGeneric"));
        }
        return;
      }

      await signIn("resend", {
        email,
        callbackUrl: "/dashboard",
        redirect: false,
      });
      window.location.href = "/login/verify";
    } catch {
      setError(tc("errorGeneric"));
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: BarChart3, text: t("feature1") },
    { icon: Zap, text: t("feature2") },
    { icon: FileText, text: t("feature3") },
    { icon: CreditCard, text: t("feature4") },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left side – Marketing panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div>
          <Link href="/" className="text-2xl font-semibold">
            visicheck.ai
          </Link>
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight">
              {t("marketingTitle")}
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              {t("marketingDescription")}
            </p>
          </div>
          <ul className="space-y-4">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Check className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} visicheck.ai
        </div>
      </div>

      {/* Right side – Sign-up form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <Link href="/" className="text-2xl font-semibold text-foreground">
              visicheck.ai
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
          </div>

          {/* Google Sign-up */}
          <Button
            variant="outline"
            className="w-full h-12 gap-3 text-base"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t("signUpWithGoogle")}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("or")}
              </span>
            </div>
          </div>

          {/* Email sign-up form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("nameLabel")}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t("namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
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
            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? t("submitting") : t("submit")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline hover:text-primary/80"
            >
              {t("loginNow")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
