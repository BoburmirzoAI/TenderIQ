"use client";

import { useEffect, useState } from "react";
import { GraduationCap, BookOpen, Search, Eye, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import DOMPurify from "dompurify";
import api from "@/lib/api";

interface Category { id: number; name: string; slug: string; description: string | null; icon: string | null; article_count: number; }
interface Article { id: number; title: string; slug: string; summary: string | null; category_name: string | null; view_count: number; created_at: string; }
interface FullArticle extends Article { content: string; author_name: string | null; tags: string | null; updated_at: string; }

export default function KnowledgeBasePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [article, setArticle] = useState<FullArticle | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/v1/knowledge-base/categories"),
      api.get("/v1/knowledge-base/articles"),
    ]).then(([cats, arts]) => {
      setCategories(cats.data.data);
      setArticles(arts.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const loadArticles = async (catSlug?: string, q?: string) => {
    const params: any = {};
    if (catSlug) params.category = catSlug;
    if (q) params.q = q;
    const r = await api.get("/v1/knowledge-base/articles", { params });
    setArticles(r.data.data);
  };

  const openArticle = async (slug: string) => {
    const r = await api.get(`/v1/knowledge-base/articles/${slug}`);
    setArticle(r.data.data);
  };

  if (article) {
    return (
      <div className="space-y-6">
        <button onClick={() => setArticle(null)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Orqaga
        </button>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              {article.category_name && <Badge variant="secondary">{article.category_name}</Badge>}
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> {article.view_count}</span>
            </div>
            <CardTitle className="text-2xl">{article.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {article.author_name && `${article.author_name} | `}
              {new Date(article.updated_at).toLocaleDateString("uz")}
            </p>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bilimlar bazasi</h1>
        <p className="text-muted-foreground">Qo'llanmalar, maqolalar va darsliklar</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Maqola qidirish..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); loadArticles(selectedCat || undefined, e.target.value); }}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      ) : (
        <>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCat === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => { setSelectedCat(null); loadArticles(undefined, search); }}
              >
                Barchasi
              </Badge>
              {categories.map((c) => (
                <Badge
                  key={c.id}
                  variant={selectedCat === c.slug ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => { setSelectedCat(c.slug); loadArticles(c.slug, search); }}
                >
                  {c.name} ({c.article_count})
                </Badge>
              ))}
            </div>
          )}

          {articles.length === 0 ? (
            <Card className="py-16 text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">Maqolalar topilmadi</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <Card
                  key={a.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-blue-200"
                  onClick={() => openArticle(a.slug)}
                >
                  <CardContent className="p-5">
                    {a.category_name && <Badge variant="secondary" className="text-xs mb-2">{a.category_name}</Badge>}
                    <h3 className="font-semibold leading-snug">{a.title}</h3>
                    {a.summary && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{a.summary}</p>}
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(a.created_at).toLocaleDateString("uz")}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.view_count}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
