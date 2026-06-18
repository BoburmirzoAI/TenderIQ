"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Kanban,
  Plus,
  GripVertical,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Trophy,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Edit3,
  Loader2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import {
  formatAmount,
  formatDate,
  getCategoryLabel,
  getRegionLabel,
} from "@/lib/format";
import type { TenderApplication, ApplicationStats } from "@/types";

const STAGES = [
  {
    key: "discovered",
    label: "Topilgan",
    icon: "🔍",
    color: "bg-slate-100 border-slate-300",
  },
  {
    key: "analyzing",
    label: "Tahlil qilinmoqda",
    icon: "📊",
    color: "bg-blue-50 border-blue-300",
  },
  {
    key: "preparing",
    label: "Tayyorlanmoqda",
    icon: "📝",
    color: "bg-amber-50 border-amber-300",
  },
  {
    key: "submitted",
    label: "Topshirilgan",
    icon: "📤",
    color: "bg-purple-50 border-purple-300",
  },
  {
    key: "under_review",
    label: "Ko'rib chiqilmoqda",
    icon: "⏳",
    color: "bg-cyan-50 border-cyan-300",
  },
  {
    key: "won",
    label: "Yutilgan",
    icon: "🏆",
    color: "bg-green-50 border-green-300",
  },
  {
    key: "lost",
    label: "Yutqazilgan",
    icon: "❌",
    color: "bg-red-50 border-red-300",
  },
] as const;

const PRIORITIES = [
  { key: "urgent", label: "Shoshilinch", color: "destructive" as const },
  { key: "high", label: "Yuqori", color: "default" as const },
  { key: "medium", label: "O'rta", color: "secondary" as const },
  { key: "low", label: "Past", color: "outline" as const },
];

function getPriorityBadge(priority: string) {
  const p = PRIORITIES.find((pr) => pr.key === priority);
  return p ?? { label: priority, color: "secondary" as const };
}

export default function PipelinePage() {
  const [apps, setApps] = useState<TenderApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingApp, setEditingApp] = useState<TenderApplication | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editBid, setEditBid] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editAssigned, setEditAssigned] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const fetchAll = useCallback(async () => {
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get("/v1/applications/", { params: { per_page: 100 } }),
        api.get("/v1/applications/stats"),
      ]);
      setApps(appsRes.data.data);
      setStats(statsRes.data.data);
    } catch {
      // 401 is handled by axios interceptor (redirects to /login)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const moveStage = async (app: TenderApplication, direction: 1 | -1) => {
    const currentIdx = STAGES.findIndex((s) => s.key === app.stage);
    const newIdx = currentIdx + direction;
    if (newIdx < 0 || newIdx >= STAGES.length) return;

    const newStage = STAGES[newIdx].key;
    try {
      const { data } = await api.patch(`/v1/applications/${app.id}`, {
        stage: newStage,
      });
      setApps((prev) =>
        prev.map((a) =>
          a.id === app.id
            ? { ...a, stage: data.data.stage, submitted_at: data.data.submitted_at }
            : a
        )
      );
      toast.success(`"${STAGES[newIdx].label}" bosqichiga o'tkazildi`);
      fetchAll();
    } catch {
      toast.error("Bosqichni o'zgartirishda xatolik");
    }
  };

  const deleteApp = async (id: number) => {
    try {
      await api.delete(`/v1/applications/${id}`);
      setApps((prev) => prev.filter((a) => a.id !== id));
      toast.success("Ariza o'chirildi");
      fetchAll();
    } catch {
      toast.error("O'chirishda xatolik");
    }
  };

  const openEdit = (app: TenderApplication) => {
    setEditingApp(app);
    setEditNotes(app.notes ?? "");
    setEditBid(app.bid_amount?.toString() ?? "");
    setEditPriority(app.priority);
    setEditAssigned(app.assigned_to ?? "");
  };

  const saveEdit = async () => {
    if (!editingApp) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/v1/applications/${editingApp.id}`, {
        notes: editNotes || undefined,
        bid_amount: editBid ? parseFloat(editBid) : undefined,
        priority: editPriority,
        assigned_to: editAssigned || undefined,
      });
      setApps((prev) =>
        prev.map((a) => (a.id === editingApp.id ? { ...a, ...data.data } : a))
      );
      setEditingApp(null);
      toast.success("Saqlandi");
      fetchAll();
    } catch {
      toast.error("Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const getStageApps = (stageKey: string) =>
    apps.filter((a) => a.stage === stageKey);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Kanban className="h-6 w-6" />
            Ariza pipeline
          </h1>
          <p className="text-muted-foreground">
            Tender arizalarini bosqichma-bosqich kuzating
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            Kanban
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            Ro&apos;yxat
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami arizalar</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Yutilgan</CardTitle>
              <Trophy className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.won_count}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Yutish foizi
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.win_rate != null ? `${stats.win_rate}%` : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami bid</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(stats.total_bid_amount)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">O&apos;rtacha bid</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avg_bid_amount
                  ? formatAmount(stats.avg_bid_amount)
                  : "—"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {apps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Kanban className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-1">
              Pipeline bo&apos;sh
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tender sahifasidan tender tanlang va pipeline&apos;ga qo&apos;shing
            </p>
            <Link href="/tenders">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tenderlarni ko&apos;rish
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === "kanban" ? (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageApps = getStageApps(stage.key);
            return (
              <div
                key={stage.key}
                className={`flex-shrink-0 w-72 rounded-xl border-2 ${stage.color}`}
              >
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <span>{stage.icon}</span>
                      {stage.label}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {stageApps.length}
                    </Badge>
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[120px] max-h-[60vh] overflow-y-auto">
                  {stageApps.map((app) => {
                    const pBadge = getPriorityBadge(app.priority);
                    const stageIdx = STAGES.findIndex(
                      (s) => s.key === app.stage
                    );
                    return (
                      <div
                        key={app.id}
                        className="bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <Link
                            href={`/tenders/${app.tender_id}`}
                            className="text-sm font-medium leading-tight hover:underline line-clamp-2 flex-1"
                          >
                            {app.tender_title ?? `Tender #${app.tender_id}`}
                          </Link>
                          <Badge
                            variant={pBadge.color}
                            className="text-[10px] shrink-0"
                          >
                            {pBadge.label}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-0.5 mb-2">
                          {app.tender_organization && (
                            <p className="truncate">{app.tender_organization}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span>{getCategoryLabel(app.tender_category)}</span>
                            <span>&bull;</span>
                            <span>{getRegionLabel(app.tender_region)}</span>
                          </div>
                          {app.tender_amount && (
                            <p className="font-medium text-foreground">
                              {formatAmount(app.tender_amount)}
                            </p>
                          )}
                          {app.tender_deadline && (
                            <p>Muddat: {formatDate(app.tender_deadline)}</p>
                          )}
                        </div>

                        {app.bid_amount && (
                          <div className="text-xs mb-2">
                            <span className="text-muted-foreground">Bid: </span>
                            <span className="font-semibold">
                              {formatAmount(app.bid_amount)}
                            </span>
                          </div>
                        )}

                        {app.notes && (
                          <p className="text-xs text-muted-foreground italic line-clamp-2 mb-2">
                            {app.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={stageIdx <= 0}
                              onClick={() => moveStage(app, -1)}
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={stageIdx >= STAGES.length - 1}
                              onClick={() => moveStage(app, 1)}
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => openEdit(app)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => deleteApp(app.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Tender</th>
                    <th className="text-left p-3 font-medium">Bosqich</th>
                    <th className="text-left p-3 font-medium">Muhimlik</th>
                    <th className="text-right p-3 font-medium">Bid</th>
                    <th className="text-left p-3 font-medium">Muddat</th>
                    <th className="text-left p-3 font-medium">Mas&apos;ul</th>
                    <th className="text-center p-3 font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => {
                    const pBadge = getPriorityBadge(app.priority);
                    const stageDef = STAGES.find((s) => s.key === app.stage);
                    const stageIdx = STAGES.findIndex(
                      (s) => s.key === app.stage
                    );
                    return (
                      <tr key={app.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <Link
                            href={`/tenders/${app.tender_id}`}
                            className="hover:underline font-medium"
                          >
                            {app.tender_title ?? `#${app.tender_id}`}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {app.tender_organization}
                          </p>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {stageDef?.icon} {stageDef?.label ?? app.stage}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={pBadge.color} className="text-xs">
                            {pBadge.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {app.bid_amount
                            ? formatAmount(app.bid_amount)
                            : "—"}
                        </td>
                        <td className="p-3 text-xs">
                          {formatDate(app.tender_deadline)}
                        </td>
                        <td className="p-3 text-xs">
                          {app.assigned_to ?? "—"}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={stageIdx <= 0}
                              onClick={() => moveStage(app, -1)}
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={stageIdx >= STAGES.length - 1}
                              onClick={() => moveStage(app, 1)}
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEdit(app)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => deleteApp(app.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingApp}
        onOpenChange={(open) => !open && setEditingApp(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arizani tahrirlash</DialogTitle>
            <DialogDescription>
              {editingApp?.tender_title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Muhimlik</Label>
              <Select
                value={editPriority}
                onValueChange={(v) => setEditPriority(v ?? editPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bid summasi (UZS)</Label>
              <Input
                type="number"
                value={editBid}
                onChange={(e) => setEditBid(e.target.value)}
                placeholder="Tender uchun taklif summasi"
              />
            </div>
            <div className="space-y-2">
              <Label>Mas&apos;ul shaxs</Label>
              <Input
                value={editAssigned}
                onChange={(e) => setEditAssigned(e.target.value)}
                placeholder="Kim javobgar?"
              />
            </div>
            <div className="space-y-2">
              <Label>Izoh</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                placeholder="Qo'shimcha ma'lumot..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingApp(null)}>
              Bekor qilish
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                "Saqlash"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
