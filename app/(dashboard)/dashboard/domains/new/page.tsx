import { DomainForm } from "@/components/domain-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewDomainPage() {
  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/domains" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-bold">Domain hinzufügen</h1>
        <p className="text-muted-foreground">
          Fügen Sie eine Domain oder Marke hinzu, die Sie tracken möchten
        </p>
      </div>
      <DomainForm />
    </div>
  );
}
