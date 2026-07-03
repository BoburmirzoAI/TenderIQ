"use client";

import { useEffect, useState } from "react";
import { Newspaper, Eye, Pin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [selected, setSelected] = useState<any>(null);

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
        <button onClick={() => setSelected(null)} className="text-sm text-blue-600 hover:underline">
          &larr; Orqaga
        </button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{selected.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selected.author_name && `${selected.author_name} | `}
              {new Date(selected.created_at).toLocaleDateString("uz")}
            </p>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selected.content) }} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Yangiliklar va e'lonlar</h1>
        <p className="text-muted-foreground">Platformadagi so'nggi yangiliklar</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : news.length === 0 ? (
        <Card className="py-16 text-center">
          <Newspaper className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Hozircha yangiliklar yo'q</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-blue-200"
              onClick={() => openArticle(item.slug)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {item.is_pinned && <Pin className="h-3.5 w-3.5 text-blue-600" />}
                  {item.category && <Badge variant="secondary" className="text-xs">{item.category}</Badge>}
                </div>
                <CardTitle className="text-base leading-snug mt-2">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {item.summary && <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>}
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(item.created_at).toLocaleDateString("uz")}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {item.view_count}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
