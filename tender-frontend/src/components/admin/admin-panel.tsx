"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/api";

interface FeatureFlags {
  [key: string]: boolean;
}

const FLAG_LABELS: Record<string, { label: string; description: string }> = {
  uzex_auth: {
    label: "UZEX autentifikatsiya rejimi",
    description: "Yoqilsa, login va register sahifalari UZEX uslubiga o'zgaradi (ERI kalit, INN, tashkilot ma'lumotlari)",
  },
  ai_matching: {
    label: "AI matching",
    description: "AI asosida tender moslashtirish",
  },
  email_notifications: {
    label: "Email bildirishnomalar",
    description: "Email orqali bildirishnomalar jo'natish",
  },
  telegram_notifications: {
    label: "Telegram bildirishnomalar",
    description: "Telegram bot orqali bildirishnomalar",
  },
  maintenance_mode: {
    label: "Texnik ishlar rejimi",
    description: "Sayt texnik ishlar rejimiga o'tadi",
  },
};

export function AdminPanel() {
  const [flags, setFlags] = useState<FeatureFlags>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      const { data } = await api.get<{ data: FeatureFlags }>("/v1/admin/settings/flags");
      setFlags(data.data);
    } catch {
      toast.error("Feature flaglarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagName: string, value: boolean) => {
    setUpdating(flagName);
    try {
      await api.patch(`/v1/admin/settings/flags/${flagName}`, { value });
      setFlags((prev) => ({ ...prev, [flagName]: value }));
      toast.success(`${FLAG_LABELS[flagName]?.label || flagName} ${value ? "yoqildi" : "o'chirildi"}`);
    } catch {
      toast.error("Yangilashda xatolik");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const uzexEnabled = flags.uzex_auth ?? false;

  return (
    <div className="space-y-6">
      {/* UZEX Auth — highlighted */}
      <div className={`rounded-2xl border-2 p-6 backdrop-blur-xl transition-all ${
        uzexEnabled
          ? "border-sky-400/40 bg-sky-50/50 dark:bg-sky-500/5 dark:border-sky-400/20"
          : "border-black/[0.06] bg-white/60 dark:bg-white/[0.02] dark:border-white/[0.06]"
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              uzexEnabled ? "bg-sky-400/20 text-sky-500" : "bg-black/[0.04] text-muted-foreground dark:bg-white/[0.06]"
            }`}>
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold">UZEX autentifikatsiya rejimi</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5 max-w-md">
                Yoqilsa, oddiy email/parol login o&apos;rniga UZEX uslubidagi login/register sahifalari
                ishga tushadi — ERI kalit, USB token, INN, tashkilot ma&apos;lumotlari bilan
              </p>
              {uzexEnabled && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-400/10 px-2.5 py-1 text-[11px] font-semibold text-sky-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                  Faol
                </span>
              )}
            </div>
          </div>
          <Switch
            checked={uzexEnabled}
            onCheckedChange={(v) => toggleFlag("uzex_auth", v)}
            disabled={updating === "uzex_auth"}
          />
        </div>
      </div>

      {/* Other flags */}
      <div className="rounded-2xl border border-black/[0.06] bg-white/60 backdrop-blur-xl p-6 dark:bg-white/[0.02] dark:border-white/[0.06]">
        <h3 className="text-[15px] font-bold mb-4">Feature flaglar</h3>
        <div className="space-y-4">
          {Object.entries(flags)
            .filter(([key]) => key !== "uzex_auth")
            .map(([key, value]) => {
              const meta = FLAG_LABELS[key];
              return (
                <div key={key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[13px] font-semibold">{meta?.label || key}</p>
                    {meta?.description && (
                      <p className="text-[11px] text-muted-foreground">{meta.description}</p>
                    )}
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(v) => toggleFlag(key, v)}
                    disabled={updating === key}
                  />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
