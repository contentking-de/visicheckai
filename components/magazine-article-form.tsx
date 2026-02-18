"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageIcon, Loader2, Trash2, ArrowLeft, Eye } from "lucide-react";

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
  const coverInputRef = useRef<HTMLInputElement>(null);

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
        </div>
      </div>
    </form>
  );
}
