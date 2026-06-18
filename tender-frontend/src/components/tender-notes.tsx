"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  StickyNote,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Check,
} from "lucide-react";
import api from "@/lib/api";

interface Note {
  id: number;
  tender_id: number;
  user_id: number;
  content: string;
  color: string;
  created_at: string;
  updated_at: string;
  user_name: string | null;
}

const NOTE_COLORS: { value: string; label: string; bg: string }[] = [
  { value: "default", label: "Oddiy", bg: "bg-card" },
  { value: "yellow", label: "Sariq", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  { value: "green", label: "Yashil", bg: "bg-green-50 dark:bg-green-950/30" },
  { value: "blue", label: "Ko'k", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { value: "red", label: "Qizil", bg: "bg-red-50 dark:bg-red-950/30" },
];

export function TenderNotes({ tenderId }: { tenderId: number }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [color, setColor] = useState("default");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const fetchNotes = useCallback(async () => {
    try {
      const { data: res } = await api.get(`/v1/notes/tender/${tenderId}`);
      setNotes(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreate = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const { data: res } = await api.post(`/v1/notes/tender/${tenderId}`, {
        content: content.trim(),
        color,
      });
      setNotes((prev) => [res.data, ...prev]);
      setContent("");
      setColor("default");
      setShowForm(false);
      toast.success("Izoh qo'shildi");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (noteId: number) => {
    if (!editContent.trim()) return;
    try {
      const { data: res } = await api.patch(`/v1/notes/${noteId}`, {
        content: editContent.trim(),
      });
      setNotes((prev) => prev.map((n) => (n.id === noteId ? res.data : n)));
      setEditingId(null);
      toast.success("Izoh yangilandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDelete = async (noteId: number) => {
    try {
      await api.delete(`/v1/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Izoh o'chirildi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const getColorBg = (c: string) =>
    NOTE_COLORS.find((nc) => nc.value === c)?.bg ?? "bg-card";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Izohlar
            </CardTitle>
            <CardDescription>
              Tender haqida shaxsiy qaydlaringiz
            </CardDescription>
          </div>
          {!showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Qo&apos;shish
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* New note form */}
        {showForm && (
          <div className="space-y-2 rounded-lg border p-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Izoh yozing..."
              rows={3}
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={`w-5 h-5 rounded-full border-2 transition-colors ${c.bg} ${
                    color === c.value ? "border-primary" : "border-transparent"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setContent("");
                }}
              >
                Bekor
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={saving || !content.trim()}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Saqlash"}
              </Button>
            </div>
          </div>
        )}

        {/* Notes list */}
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Hali izoh yo&apos;q
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`rounded-lg border p-3 space-y-1 ${getColorBg(note.color)}`}
            >
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdate(note.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString("uz-UZ")}{" "}
                      {new Date(note.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditingId(note.id);
                          setEditContent(note.content);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-destructive"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
