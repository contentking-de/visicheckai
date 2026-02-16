import { PromptSetForm } from "@/components/prompt-set-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewPromptSetPage() {
  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/prompt-sets" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-bold">Prompt-Set erstellen</h1>
        <p className="text-muted-foreground">
          Definieren Sie Prompts, die an ChatGPT, Claude, Gemini und Perplexity
          gesendet werden
        </p>
      </div>
      <PromptSetForm />
    </div>
  );
}
