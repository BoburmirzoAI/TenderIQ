"use client";

import { useEffect, useState } from "react";
import { HelpCircle, ChevronDown, Search } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Ko&apos;p so&apos;raladigan savollar</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Savollaringizga javob toping</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Savol qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 rounded-xl border border-black/10 bg-white/80 pl-10 pr-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl py-16 text-center dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Savollar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((faq) => (
            <div
              key={faq.id}
              className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl cursor-pointer transition-all hover:shadow-lg dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]"
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[15px] pr-4">{faq.question}</p>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
                      openId === faq.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {openId === faq.id && (
                  <div className="mt-3 border-t border-black/[0.04] dark:border-white/[0.04] pt-3 text-[13px] text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
