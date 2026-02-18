"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { TiptapEditor } from "@/components/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ImageIcon,
  Loader2,
  Trash2,
  ArrowLeft,
  Eye,
  Languages,
  Check,
  RefreshCw,
} from "lucide-react";

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  published: boolean | null;
  publishedAt: string | null;
};

type TranslationStatus = {
  locale: string;
  translated: boolean;
  updatedAt: string | null;
};

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
};

type Props = {
  article?: Article;
};

export function MagazineArticleForm({ article }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");
  const [published, setPublished] = useState(article?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus[]>([]);
  const [translating, setTranslating] = useState<string | null>(null);
  const [translatingAll, setTranslatingAll] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fetchTranslationStatus = useCallback(async () => {
    if (!article?.id) return;
    try {
      const res = await fetch(`/api/admin/magazine/${article.id}/translate`);
      if (res.ok) {
        const data = await res.json();
        setTranslationStatus(data);
      }
    } catch { /* ignore */ }
  }, [article?.id]);

  useEffect(() => {
    fetchTranslationStatus();
  }, [fetchTranslationStatus]);

  const translateLocale = async (locale: string) => {
    if (!article?.id) return;
    setTranslating(locale);
    try {
      const res = await fetch(`/api/admin/magazine/${article.id}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locales: [locale] }),
      });
      if (!res.ok) throw new Error("Translation failed");
      await fetchTranslationStatus();
    } catch {
      alert(`Übersetzung nach ${LOCALE_LABELS[locale] ?? locale} fehlgeschlagen`);
    } finally {
      setTranslating(null);
    }
  };

  const translateAll = async () => {
    if (!article?.id) return;
    const untranslated = translationStatus
      .filter((s) => !s.translated)
      .map((s) => s.locale);
    const allLocales = untranslated.length > 0 ? untranslated : translationStatus.map((s) => s.locale);
    if (allLocales.length === 0) return;

    setTranslatingAll(true);
    try {
      const res = await fetch(`/api/admin/magazine/${article.id}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locales: allLocales }),
      });
      if (!res.ok) throw new Error("Translation failed");
      await fetchTranslationStatus();
    } catch {
      alert("Übersetzung fehlgeschlagen");
    } finally {
      setTranslatingAll(false);
    }
  };

  const uploadCover = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/magazine/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        setCoverImage(url);
      } catch {
        alert("Bild-Upload fehlgeschlagen");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const url = article
        ? `/api/admin/magazine/${article.id}`
        : "/api/admin/magazine";
      const method = article ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt: excerpt || null,
          content,
          coverImage: coverImage || null,
          published,
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      router.push("/dashboard/admin/magazin");
      router.refresh();
    } catch {
      alert("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard/admin/magazin")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <div className="flex items-center gap-3">
          {article?.slug && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`/magazin/${article.slug}`, "_blank")}
            >
              <Eye className="mr-2 h-4 w-4" />
              Vorschau
            </Button>
          )}
          <Button type="submit" disabled={saving || !title.trim() || !content.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {article ? "Aktualisieren" : "Erstellen"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Artikel-Titel"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Kurzbeschreibung</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Kurze Zusammenfassung für die Übersicht…"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Inhalt</Label>
            <TiptapEditor content={content} onChange={setContent} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vorschaubild</CardTitle>
            </CardHeader>
            <CardContent>
              {coverImage ? (
                <div className="relative">
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => setCoverImage("")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <ImageIcon className="h-8 w-8" />
                  )}
                  <span className="text-sm">
                    {uploading ? "Wird hochgeladen…" : "Bild hochladen"}
                  </span>
                </button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={uploadCover}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Veröffentlichung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="published"
                  checked={published}
                  onCheckedChange={(checked) =>
                    setPublished(checked === true)
                  }
                />
                <Label htmlFor="published" className="font-normal">
                  Artikel veröffentlichen
                </Label>
              </div>
              {article?.publishedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Veröffentlicht am{" "}
                  {new Date(article.publishedAt).toLocaleDateString("de-DE")}
                </p>
              )}
            </CardContent>
          </Card>

          {article?.id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Languages className="h-4 w-4" />
                  Übersetzungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {translationStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Lade Status…</p>
                ) : (
                  <>
                    {translationStatus.map((ts) => (
                      <div
                        key={ts.locale}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {LOCALE_LABELS[ts.locale] ?? ts.locale}
                          </span>
                          {ts.translated ? (
                            <Badge
                              variant="default"
                              className="gap-1 text-xs"
                            >
                              <Check className="h-3 w-3" />
                              Übersetzt
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Ausstehend
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={translating === ts.locale || translatingAll}
                          onClick={() => translateLocale(ts.locale)}
                          title={
                            ts.translated
                              ? "Übersetzung aktualisieren"
                              : "Jetzt übersetzen"
                          }
                        >
                          {translating === ts.locale ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : ts.translated ? (
                            <RefreshCw className="h-3.5 w-3.5" />
                          ) : (
                            <Languages className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      disabled={translatingAll || !!translating}
                      onClick={translateAll}
                    >
                      {translatingAll ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Languages className="mr-2 h-4 w-4" />
                      )}
                      Alle übersetzen
                    </Button>
                  </>
                )}
                {translationStatus.some((ts) => ts.updatedAt) && (
                  <p className="text-xs text-muted-foreground">
                    Letzte Übersetzung:{" "}
                    {new Date(
                      translationStatus
                        .filter((ts) => ts.updatedAt)
                        .sort(
                          (a, b) =>
                            new Date(b.updatedAt!).getTime() -
                            new Date(a.updatedAt!).getTime()
                        )[0]?.updatedAt ?? ""
                    ).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}
