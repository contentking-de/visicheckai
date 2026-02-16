import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">E-Mail prüfen</h1>
          <p className="mt-2 text-muted-foreground">
            Wir haben Ihnen einen Magic Link gesendet. Klicken Sie auf den Link
            in der E-Mail, um sich anzumelden.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Den Link nicht erhalten? Prüfen Sie Ihren Spam-Ordner oder{" "}
          <Link href="/login" className="font-medium text-primary underline">
            erneut versuchen
          </Link>
          .
        </p>
        <Button asChild variant="outline">
          <Link href="/login">Andere E-Mail verwenden</Link>
        </Button>
      </div>
    </div>
  );
}
