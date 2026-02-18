"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, CheckCircle2, AlertCircle, Mail, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const POLL_INTERVAL_MS = 5_000;

export function RunConfigButton({
  configId,
  isRunning: initialIsRunning = false,
}: {
  configId: string;
  isRunning?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("Runs");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runActive, setRunActive] = useState(initialIsRunning);
  const [dialogState, setDialogState] = useState<
    "closed" | "started" | "error"
  >("closed");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRunActive(initialIsRunning);
  }, [initialIsRunning]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (runActive) {
      pollRef.current = setInterval(() => {
        router.refresh();
      }, POLL_INTERVAL_MS);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [runActive, router]);

  const busy = isSubmitting || runActive;

  const handleRun = async () => {
    if (busy) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tracking/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId }),
      });
      if (res.ok) {
        setRunActive(true);
        setDialogState("started");
      } else {
        setDialogState("error");
      }
    } catch {
      setDialogState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogState("closed");
    router.refresh();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRun}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Play className="h-4 w-4 mr-1" />
        )}
        {busy ? t("running") : t("runNow")}
      </Button>

      <Dialog
        open={dialogState !== "closed"}
        onOpenChange={(open) => {
          if (!open) handleCloseDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          {dialogState === "started" && (
            <>
              <DialogHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <DialogTitle className="text-center">
                  {t("backgroundRunStartedTitle")}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {t("backgroundRunStartedDesc")}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4 mt-2">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {t("backgroundRunEmailHint")}
                </p>
              </div>
              <DialogFooter className="mt-4 sm:justify-center">
                <Button onClick={handleCloseDialog}>
                  {t("backgroundRunOk")}
                </Button>
              </DialogFooter>
            </>
          )}

          {dialogState === "error" && (
            <>
              <DialogHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <DialogTitle className="text-center">
                  {t("backgroundRunErrorTitle")}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {t("backgroundRunErrorDesc")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 sm:justify-center">
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  {t("backgroundRunOk")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
