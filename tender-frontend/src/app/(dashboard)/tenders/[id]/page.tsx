"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Building,
  MapPin,
  Tag,
  ExternalLink,
  FileText,
  Kanban,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { TenderNotes } from "@/components/tender-notes";
import {
  formatAmount,
  formatDate,
  formatDateTime,
  getCategoryLabel,
  getRegionLabel,
  getStatusColor,
  getStatusLabel,
} from "@/lib/format";
import type { TenderDetail } from "@/types";

export default function TenderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/v1/tenders/${params.id}`);
        setTender(data.data);
      } catch {
        toast.error("Tender topilmadi");
        router.push("/tenders");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!tender) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight line-clamp-2">
            {tender.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ID: {tender.external_id} &bull; Manba: {tender.source}
          </p>
        </div>
        <Badge variant={getStatusColor(tender.status)} className="text-sm">
          {getStatusLabel(tender.status)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asosiy ma&apos;lumotlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tender.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Tavsif
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">
                    {tender.description}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tashkilot</p>
                    <p className="text-sm font-medium">
                      {tender.organization ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Kategoriya</p>
                    <p className="text-sm font-medium">
                      {getCategoryLabel(tender.category)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Viloyat</p>
                    <p className="text-sm font-medium">
                      {getRegionLabel(tender.region)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Muddat
                    </p>
                    <p className="text-sm font-medium">
                      {formatDate(tender.deadline)}
                    </p>
                  </div>
                </div>
              </div>

              {tender.requirements && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Talablar
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">
                      {tender.requirements}
                    </p>
                  </div>
                </>
              )}

              {tender.contact_info && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Aloqa ma&apos;lumotlari
                    </h4>
                    <p className="text-sm">{tender.contact_info}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Moliyaviy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Summa</p>
                <p className="text-2xl font-bold">
                  {formatAmount(tender.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valyuta</p>
                <p className="text-sm font-medium">{tender.currency}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">E&apos;lon qilingan</p>
                <p className="text-sm">{formatDateTime(tender.published_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tizimga qo&apos;shilgan</p>
                <p className="text-sm">{formatDateTime(tender.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {tender.match_score != null && (
            <Card>
              <CardHeader>
                <CardTitle>Moslik bali</CardTitle>
                <CardDescription>
                  Kompaniyangizga mosligi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center mb-2">
                  {Math.round(tender.match_score)}%
                </div>
                <Progress value={tender.match_score} />
              </CardContent>
            </Card>
          )}

          <TenderNotes tenderId={tender.id} />

          <div className="flex flex-col gap-2">
            {tender.url && (
              <a href={tender.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manbaga o&apos;tish
                </Button>
              </a>
            )}
            {tender.document_urls && (
              <a
                href={tender.document_urls}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Hujjatlarni ko&apos;rish
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await api.post("/v1/applications/", {
                    tender_id: tender.id,
                  });
                  toast.success("Pipeline'ga qo'shildi!");
                } catch (err: unknown) {
                  const status =
                    err &&
                    typeof err === "object" &&
                    "response" in err &&
                    (err as { response?: { status?: number } }).response?.status;
                  if (status === 409) {
                    toast.info("Bu tender allaqachon pipeline'da");
                  } else {
                    toast.error("Xatolik yuz berdi");
                  }
                }
              }}
            >
              <Kanban className="mr-2 h-4 w-4" />
              Pipeline&apos;ga qo&apos;shish
            </Button>
            <Button
              variant={tender.is_saved ? "default" : "outline"}
              onClick={async () => {
                try {
                  const { data } = await api.post(
                    `/v1/tenders/save/${tender.id}`
                  );
                  setTender((prev) =>
                    prev
                      ? { ...prev, is_saved: data.data.is_saved }
                      : prev
                  );
                  toast.success(
                    data.data.is_saved ? "Saqlandi" : "Olib tashlandi"
                  );
                } catch {
                  toast.error("Xatolik yuz berdi");
                }
              }}
            >
              {tender.is_saved ? (
                <BookmarkCheck className="mr-2 h-4 w-4" />
              ) : (
                <Bookmark className="mr-2 h-4 w-4" />
              )}
              {tender.is_saved ? "Saqlangan" : "Saqlash"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
