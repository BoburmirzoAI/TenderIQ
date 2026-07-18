"use client";

import { useEffect, useState } from "react";
import { Newspaper, Eye, Pin, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import DOMPurify from "dompurify";
import api from "@/lib/api";

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  category: string | null;
  is_pinned: boolean;
  view_count: number;
  created_at: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<(NewsItem & { content?: string; author_name?: string }) | null>(null);

  useEffect(() => {
    api.get("/v1/news").then((r) => setNews(r.data.data)).finally(() => setLoading(false));
  }, []);

  const openArticle = async (slug: string) => {
    const r = await api.get(`/v1/news/${slug}`);
    setSelected(r.data.data);
  };

  if (selected) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-sky-500 dark:text-sky-400 hover:text-sky-600 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Orqaga
        </button>
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-8 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
          <h1 className="text-[24px] font-extrabold tracking-[-0.03em] mb-2">{selected.title}</h1>
          <p className="text-[13px] text-muted-foreground mb-6">
            {selected.author_name && `${selected.author_name} · `}
            {new Date(selected.created_at).toLocaleDateString("uz")}
          </p>
          <div className="prose max-w-none text-[14px] leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selected.content ?? "") }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Yangiliklar va e&apos;lonlar</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Platformadagi so&apos;nggi yangiliklar</p>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : news.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl py-16 text-center dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
          <Newspaper className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Hozircha yangiliklar yo&apos;q</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] group dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]"
              onClick={() => openArticle(item.slug)}
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  {item.is_pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/10 text-sky-500 px-2 py-0.5 text-[10px] font-semibold">
                      <Pin className="h-2.5 w-2.5" /> Muhim
                    </span>
                  )}
                  {item.category && (
                    <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{item.category}</span>
                  )}
                </div>
                <h3 className="text-[16px] font-bold leading-snug group-hover:text-sky-500 dark:hover:text-sky-400 transition-colors">{item.title}</h3>
                {item.summary && <p className="text-[14px] text-muted-foreground mt-2 line-clamp-2">{item.summary}</p>}
                <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{new Date(item.created_at).toLocaleDateString("uz")}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {item.view_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
