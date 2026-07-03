"use client";

import { useEffect, useState } from "react";
import { HelpCircle, ChevronDown, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string | null;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    api.get("/v1/faq").then((r) => setFaqs(r.data.data)).finally(() => setLoading(false));
  }, []);

  const filtered = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ko'p so'raladigan savollar</h1>
        <p className="text-muted-foreground">Savollaringizga javob toping</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Savol qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Savollar topilmadi</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((faq) => (
            <Card
              key={faq.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium pr-4">{faq.question}</p>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform ${
                      openId === faq.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {openId === faq.id && (
                  <div className="mt-3 border-t pt-3 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
