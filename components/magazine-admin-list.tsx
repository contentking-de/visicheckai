"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, ExternalLink, Loader2 } from "lucide-react";

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean | null;
  publishedAt: string | null;
  createdAt: string | null;
  authorName: string | null;
};

export function MagazineAdminList() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/magazine")
      .then((res) => res.json())
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Artikel wirklich löschen?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/magazine/${id}`, { method: "DELETE" });
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Löschen fehlgeschlagen");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Magazin-Beiträge</h2>
          <p className="text-sm text-muted-foreground">
            {articles.length} {articles.length === 1 ? "Artikel" : "Artikel"}
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/admin/magazin/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Artikel
        </Button>
      </div>

      {articles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          <p>Noch keine Artikel vorhanden.</p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin/magazin/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ersten Artikel erstellen
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Titel</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead className="w-24">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    {article.coverImage ? (
                      <img
                        src={article.coverImage}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {article.authorName ?? "–"}
                  </TableCell>
                  <TableCell>
                    {article.published ? (
                      <Badge variant="default">Veröffentlicht</Badge>
                    ) : (
                      <Badge variant="secondary">Entwurf</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {article.createdAt
                      ? new Date(article.createdAt).toLocaleDateString("de-DE")
                      : "–"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {article.published && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(`/magazin/${article.slug}`, "_blank")
                          }
                          title="Im Magazin anzeigen"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/admin/magazin/${article.id}`)
                        }
                        title="Bearbeiten"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(article.id)}
                        disabled={deleting === article.id}
                        title="Löschen"
                      >
                        {deleting === article.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
