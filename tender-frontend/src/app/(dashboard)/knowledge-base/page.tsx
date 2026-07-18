"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Search, Eye, ArrowLeft } from "lucide-react";
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
    const params: Record<string, string> = {};
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
        <button onClick={() => setArticle(null)} className="text-sm text-sky-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Orqaga
        </button>
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            {article.category_name && <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-semibold">{article.category_name}</span>}
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> {article.view_count}</span>
          </div>
          <h3 className="text-[16px] font-bold mb-1 text-2xl">{article.title}</h3>
          <p className="text-sm text-muted-foreground">
            {article.author_name && `${article.author_name} | `}
            {new Date(article.updated_at).toLocaleDateString("uz")}
          </p>
          <div className="mt-6">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Bilimlar bazasi</h1>
        <p className="text-sm text-muted-foreground mt-1">Qo&apos;llanmalar, maqolalar va darsliklar</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full h-11 rounded-xl border border-black/10 bg-white/80 pl-10 pr-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
          placeholder="Maqola qidirish..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); loadArticles(selectedCat || undefined, e.target.value); }}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      ) : (
        <>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span
                className={"rounded-full px-2.5 py-0.5 text-[12px] font-semibold cursor-pointer " + (selectedCat === null ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f]" : "border border-black/10 dark:border-white/10")}
                onClick={() => { setSelectedCat(null); loadArticles(undefined, search); }}
              >
                Barchasi
              </span>
              {categories.map((c) => (
                <span
                  key={c.id}
                  className={"rounded-full px-2.5 py-0.5 text-[12px] font-semibold cursor-pointer " + (selectedCat === c.slug ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f]" : "border border-black/10 dark:border-white/10")}
                  onClick={() => { setSelectedCat(c.slug); loadArticles(c.slug, search); }}
                >
                  {c.name} ({c.article_count})
                </span>
              ))}
            </div>
          )}

          {articles.length === 0 ? (
            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl py-16 text-center dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">Maqolalar topilmadi</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all cursor-pointer hover:shadow-md hover:border-sky-200"
                  onClick={() => openArticle(a.slug)}
                >
                  <div>
                    {a.category_name && <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-semibold text-xs mb-2 inline-block">{a.category_name}</span>}
                    <h3 className="font-semibold leading-snug">{a.title}</h3>
                    {a.summary && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{a.summary}</p>}
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(a.created_at).toLocaleDateString("uz")}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.view_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
