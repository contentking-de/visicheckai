import { ConfigForm } from "@/components/config-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewConfigPage() {
  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/configs" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-bold">Tracking konfigurieren</h1>
        <p className="text-muted-foreground">
          Wählen Sie Domain, Prompt-Set und Intervall
        </p>
      </div>
      <ConfigForm />
    </div>
  );
}
