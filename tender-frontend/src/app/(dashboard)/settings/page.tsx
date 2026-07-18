"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { AdminPanel } from "@/components/admin/admin-panel";
import {
  User as UserIcon,
  Bell,
  Shield,
  Key,
  Globe,
  Palette,
  Smartphone,
  Mail,
  MessageSquare,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  LogOut,
  Trash2,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Wallet,
  CreditCard,
  Clock,
  CheckCircle,

  ArrowUpRight,
  Crown,
  Zap,
  Building2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { formatAmount, formatDateTime } from "@/lib/format";
import type { PaymentRead, PlanInfo, Subscription, UsageStats } from "@/types";

const TABS = [
  { key: "profile", label: "Profil", icon: UserIcon, color: "text-sky-400" },
  { key: "security", label: "Xavfsizlik", icon: Shield, color: "text-green-500" },
  { key: "notifications", label: "Bildirishnomalar", icon: Bell, color: "text-amber-500" },
  { key: "subscription", label: "Obuna", icon: CreditCard, color: "text-indigo-500" },
  { key: "payments", label: "To'lovlar", icon: Wallet, color: "text-emerald-500" },
  { key: "preferences", label: "Sozlamalar", icon: Palette, color: "text-purple-500" },
  { key: "api", label: "API & Integratsiya", icon: Key, color: "text-cyan-500" },
  { key: "admin", label: "Admin", icon: Crown, color: "text-orange-500", adminOnly: true },
  { key: "danger", label: "Xavfli zona", icon: Trash2, color: "text-red-500" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const { setTheme: applyTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifyNewTenders, setNotifyNewTenders] = useState(true);
  const [notifyMatch, setNotifyMatch] = useState(true);
  const [notifyDeadline, setNotifyDeadline] = useState(true);
  const [notifyResults, setNotifyResults] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifyTelegram, setNotifyTelegram] = useState(true);
  const [savingNotify, setSavingNotify] = useState(false);

  const [language, setLanguage] = useState("uz");
  const [theme, setTheme] = useState("system");
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [linkingTelegram, setLinkingTelegram] = useState(false);
  const [unlinkingTelegram, setUnlinkingTelegram] = useState(false);

  const [paymentsData, setPaymentsData] = useState<PaymentRead[]>([]);
  const [plansData, setPlansData] = useState<PlanInfo[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null);
  const [usageData, setUsageData] = useState<UsageStats | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setPhone(user.phone ?? "");
      setTelegramUsername(user.telegram_username ?? "");
      setNotifyNewTenders(user.notify_new_tenders ?? true);
      setNotifyMatch(user.notify_match ?? true);
      setNotifyDeadline(user.notify_deadline ?? true);
      setNotifyResults(user.notify_results ?? true);
      setNotifyEmail(user.notify_email ?? false);
      setNotifyTelegram(user.notify_telegram ?? true);
      setLanguage(user.language ?? "uz");
      setTheme(user.theme ?? "system");
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "payments" || activeTab === "subscription") {
      Promise.allSettled([
        api.get("/v1/payments/history"),
        api.get("/v1/subscriptions/plans"),
        api.get("/v1/subscriptions/current"),
        api.get("/v1/subscriptions/usage"),
      ]).then(([paymentsRes, plansRes, subRes, usageRes]) => {
        if (paymentsRes.status === "fulfilled") setPaymentsData(paymentsRes.value.data.data);
        if (plansRes.status === "fulfilled") setPlansData(plansRes.value.data.data);
        if (subRes.status === "fulfilled") setSubscriptionData(subRes.value.data.data);
        if (usageRes.status === "fulfilled") setUsageData(usageRes.value.data.data);
      });
    }
  }, [activeTab]);

  const handlePayment = async () => {
    if (!selectedPlan || !selectedProvider) { toast.error("Reja va to'lov tizimini tanlang"); return; }
    setPaying(true);
    try {
      const { data } = await api.post("/v1/payments/create", { plan: selectedPlan, provider: selectedProvider, return_url: window.location.href });
      const result = data.data;
      if (result.payment_url) {
        const allowed = ["click.uz", "payme.uz", "uzum.uz", "localhost"];
        try {
          const host = new URL(result.payment_url).hostname;
          if (allowed.some((d) => host === d || host.endsWith(`.${d}`))) { window.location.href = result.payment_url; }
          else { toast.error("Noto'g'ri to'lov havolasi"); }
        } catch { toast.error("Noto'g'ri to'lov havolasi"); }
      } else {
        toast.info("To'lov tizimi hali ulanmagan. Tez orada Click.uz va Payme orqali to'lash imkoniyati qo'shiladi.");
      }
    } catch { toast.error("To'lov yaratishda xatolik"); }
    finally { setPaying(false); }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await api.patch("/v1/auth/me", { full_name: fullName, phone: phone || null, telegram_username: telegramUsername || null });
      setUser(data.data);
      toast.success("Profil yangilandi");
    } catch { toast.error("Saqlashda xatolik"); }
    finally { setSavingProfile(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) { toast.error("Yangi parollar mos kelmaydi"); return; }
    if (passwords.new_password.length < 8) { toast.error("Parol kamida 8 ta belgidan iborat bo'lishi kerak"); return; }
    setSavingPassword(true);
    try {
      await api.post("/v1/auth/change-password", { current_password: passwords.current_password, new_password: passwords.new_password });
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
    } catch { toast.error("Joriy parol noto'g'ri"); }
    finally { setSavingPassword(false); }
  };

  const saveNotifications = async () => {
    setSavingNotify(true);
    try {
      const { data } = await api.patch("/v1/auth/me", { notify_new_tenders: notifyNewTenders, notify_match: notifyMatch, notify_deadline: notifyDeadline, notify_results: notifyResults, notify_email: notifyEmail, notify_telegram: notifyTelegram });
      setUser(data.data);
      toast.success("Bildirishnoma sozlamalari saqlandi");
    } catch { toast.error("Saqlashda xatolik"); }
    finally { setSavingNotify(false); }
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const { data } = await api.patch("/v1/auth/me", { language, theme });
      setUser(data.data);
      applyTheme(theme);
      toast.success("Sozlamalar saqlandi");
    } catch { toast.error("Saqlashda xatolik"); }
    finally { setSavingPrefs(false); }
  };

  const generateApiKey = async () => {
    setGeneratingKey(true);
    try {
      const { data } = await api.post("/v1/auth/api-key");
      setApiKey(data.data.api_key);
      toast.success("API kalit yaratildi");
    } catch { toast.error("API kalit yaratishda xatolik"); }
    finally { setGeneratingKey(false); }
  };

  const copyApiKey = () => {
    if (apiKey) { navigator.clipboard.writeText(apiKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const linkTelegram = async () => {
    setLinkingTelegram(true);
    try {
      const { data } = await api.post("/v1/auth/telegram-link-token");
      window.open(data.data.deep_link, "_blank");
      toast.success("Telegram bot ochildi. Ulangandan so'ng sahifani yangilang.");
    } catch { toast.error("Telegram ulash tokenini yaratishda xatolik"); }
    finally { setLinkingTelegram(false); }
  };

  const unlinkTelegram = async () => {
    setUnlinkingTelegram(true);
    try {
      await api.post("/v1/auth/telegram-unlink");
      const { data } = await api.get("/v1/auth/me");
      setUser(data.data);
      toast.success("Telegram uzildi");
    } catch { toast.error("Telegram uzishda xatolik"); }
    finally { setUnlinkingTelegram(false); }
  };

  const [sendingVerification, setSendingVerification] = useState(false);
  const handleSendVerification = async () => {
    setSendingVerification(true);
    try {
      await api.post("/v1/auth/send-verification");
      toast.success("Tasdiqlash xati yuborildi. Email manzilingizni tekshiring.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Xatolik yuz berdi");
    } finally { setSendingVerification(false); }
  };

  const handleLogoutAll = async () => {
    try {
      const { data } = await api.post("/v1/auth/logout-all");
      localStorage.setItem("access_token", data.data.access_token);
      localStorage.setItem("refresh_token", data.data.refresh_token);
      toast.success("Barcha qurilmalardan chiqildi.");
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Sozlamalar</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Hisob va platforma sozlamalaringizni boshqaring</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-60 shrink-0">
          <GlassCard className="p-2">
            <nav className="flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-visible">
              {TABS.filter((tab) => !("adminOnly" in tab && tab.adminOnly) || user?.is_admin).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all w-full text-left ${
                    activeTab === tab.key
                      ? "bg-[#1d1d1f] text-white shadow-md dark:bg-white dark:text-[#1d1d1f]"
                      : "hover:bg-black/[0.03] text-muted-foreground dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    activeTab === tab.key ? "bg-white/20" : `bg-black/[0.04] dark:bg-white/[0.06]`
                  }`}>
                    <tab.icon className={`h-3.5 w-3.5 ${activeTab === tab.key ? "" : tab.color}`} />
                  </div>
                  {tab.label}
                  <ChevronRight className={`h-3 w-3 ml-auto ${activeTab === tab.key ? "opacity-80" : "opacity-0"}`} />
                </button>
              ))}
            </nav>
          </GlassCard>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">
          {activeTab === "profile" && (
            <>
              <GlassCard className="p-6">
                <h3 className="text-[16px] font-bold mb-1">Shaxsiy ma&apos;lumotlar</h3>
                <p className="text-[12px] text-muted-foreground mb-5">Ism, telefon va boshqa ma&apos;lumotlaringizni yangilang</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">To&apos;liq ism</label>
                    <AppleInput value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Email</label>
                    <AppleInput value={user?.email ?? ""} disabled />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Telefon raqam</label>
                    <AppleInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Telegram username</label>
                    <AppleInput value={telegramUsername} onChange={(e) => setTelegramUsername(e.target.value)} placeholder="@username" />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-[16px] font-bold mb-4">Hisob holati</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { label: "Holat", value: user?.is_active ? "Faol" : "Nofaol", active: user?.is_active, color: "green" },
                    { label: "Tasdiqlangan", value: user?.is_verified ? "Ha" : "Yo'q", active: user?.is_verified, color: "blue" },
                    { label: "Telegram", value: user?.telegram_id ? "Ulangan" : "Ulanmagan", active: !!user?.telegram_id, color: "cyan" },
                    { label: "Ro'yxatdan o'tgan", value: user?.created_at ? new Date(user.created_at).toLocaleDateString("uz-UZ") : "—", active: true, color: "purple" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-black/[0.04] px-4 py-3 dark:border-white/[0.04]">
                      <span className="text-[12px] text-muted-foreground">{item.label}</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                        item.active ? `bg-${item.color}-500/10 text-${item.color}-600` : "bg-gray-100 text-gray-500 dark:bg-white/5"
                      }`}>
                        {item.active && <span className={`h-1.5 w-1.5 rounded-full bg-${item.color}-500`} />}
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
                {!user?.is_verified && (
                  <button onClick={handleSendVerification} disabled={sendingVerification} className="mt-3 text-[12px] font-semibold text-sky-500 dark:text-sky-400 hover:text-sky-600 transition-colors">
                    {sendingVerification ? "Yuborilmoqda..." : "Tasdiqlash xatini yuborish →"}
                  </button>
                )}
              </GlassCard>

              <div className="flex justify-end">
                <SaveButton onClick={saveProfile} loading={savingProfile} label="Profilni saqlash" />
              </div>
            </>
          )}

          {activeTab === "security" && (
            <>
              <GlassCard className="p-6">
                <h3 className="text-[16px] font-bold mb-1">Parolni o&apos;zgartirish</h3>
                <p className="text-[12px] text-muted-foreground mb-5">Xavfsizlik uchun parolni muntazam o&apos;zgartiring</p>
                <form onSubmit={changePassword} className="space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Joriy parol</label>
                    <div className="relative">
                      <AppleInput
                        type={showPasswords ? "text" : "password"}
                        value={passwords.current_password}
                        onChange={(e) => setPasswords((p) => ({ ...p, current_password: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Yangi parol</label>
                      <AppleInput
                        type={showPasswords ? "text" : "password"}
                        value={passwords.new_password}
                        onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Parolni tasdiqlang</label>
                      <AppleInput
                        type={showPasswords ? "text" : "password"}
                        value={passwords.confirm_password}
                        onChange={(e) => setPasswords((p) => ({ ...p, confirm_password: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                    {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showPasswords ? "Yashirish" : "Ko'rsatish"}
                  </button>
                  <SaveButton onClick={() => {}} loading={savingPassword} label="Parolni o'zgartirish" />
                </form>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-[16px] font-bold mb-1">Sessiyalar</h3>
                <p className="text-[13px] text-muted-foreground mb-4">Barcha qurilmalardan hisobingizdan chiqing</p>
                <button onClick={handleLogoutAll} className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5">
                  <LogOut className="h-3.5 w-3.5" />
                  Barcha qurilmalardan chiqish
                </button>
              </GlassCard>
            </>
          )}

          {activeTab === "notifications" && (
            <>
              <GlassCard className="p-6">
                <h3 className="text-[16px] font-bold mb-1">Bildirishnoma turlari</h3>
                <p className="text-[12px] text-muted-foreground mb-5">Qaysi hodisalar haqida xabar olishni tanlang</p>
                <div className="space-y-0">
                  {[
                    { label: "Yangi tenderlar", desc: "Sizning sohangizdagi yangi tenderlar", checked: notifyNewTenders, onChange: setNotifyNewTenders },
                    { label: "Mos tenderlar", desc: "Kompaniyangizga mos tender topilganda", checked: notifyMatch, onChange: setNotifyMatch },
                    { label: "Muddat eslatmalari", desc: "Tender muddati yaqinlashganda (3 kun oldin)", checked: notifyDeadline, onChange: setNotifyDeadline },
                    { label: "Natijalar", desc: "Tender g'olibi e'lon qilinganda", checked: notifyResults, onChange: setNotifyResults },
                  ].map((item, i, arr) => (
                    <div key={item.label} className={`flex items-center justify-between py-4 ${i < arr.length - 1 ? "border-b border-black/[0.04] dark:border-white/[0.04]" : ""}`}>
                      <div>
                        <p className="text-[13px] font-semibold">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <Switch checked={item.checked} onCheckedChange={item.onChange} />
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-[16px] font-bold mb-1">Yetkazish kanallari</h3>
                <p className="text-[12px] text-muted-foreground mb-5">Bildirishnomalar qaysi kanal orqali kelsin</p>
                <div className="space-y-0">
                  {[
                    { icon: MessageSquare, iconColor: "text-sky-400", label: "Telegram", desc: user?.telegram_id ? "Telegram bot orqali" : "Avval Telegram botga ulanish kerak", checked: notifyTelegram, onChange: setNotifyTelegram, disabled: !user?.telegram_id },
                    { icon: Mail, iconColor: "text-amber-500", label: "Email", desc: `${user?.email} manziliga`, checked: notifyEmail, onChange: setNotifyEmail, disabled: false },
                  ].map((item, i, arr) => (
                    <div key={item.label} className={`flex items-center justify-between py-4 ${i < arr.length - 1 ? "border-b border-black/[0.04] dark:border-white/[0.04]" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.05]">
                          <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <Switch checked={item.checked} onCheckedChange={item.onChange} disabled={item.disabled} />
                    </div>
                  ))}
                </div>
              </GlassCard>

              <div className="flex justify-end">
                <SaveButton onClick={saveNotifications} loading={savingNotify} label="Saqlash" />
              </div>
            </>
          )}

          {activeTab === "preferences" && (
            <>
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-[16px] font-bold">Til</h3>
                </div>
                <Select value={language} onValueChange={(v) => setLanguage(v ?? language)}>
                  <SelectTrigger className="w-full md:w-64 h-11 rounded-xl border-black/10 text-[13px] dark:border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uz">O&apos;zbek tili</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-[16px] font-bold">Mavzu (Tema)</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {[
                    { key: "light", label: "Yorug'", icon: Sun, gradient: "from-amber-100 to-orange-100" },
                    { key: "dark", label: "Qorong'u", icon: Moon, gradient: "from-slate-700 to-slate-900" },
                    { key: "system", label: "Tizim", icon: Monitor, gradient: "from-sky-100 to-purple-100" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => { setTheme(t.key); applyTheme(t.key); }}
                      className={`rounded-2xl border-2 p-4 text-center transition-all hover:shadow-md ${
                        theme === t.key
                          ? "border-[#0071e3] shadow-lg shadow-sky-400/10"
                          : "border-black/[0.06] hover:border-black/10 dark:border-white/[0.06]"
                      }`}
                    >
                      <div className={`h-10 rounded-xl bg-gradient-to-br ${t.gradient} mb-3 flex items-center justify-center`}>
                        <t.icon className={`h-5 w-5 ${t.key === "dark" ? "text-white" : "text-gray-600"}`} />
                      </div>
                      <span className="text-[12px] font-semibold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </GlassCard>

              <div className="flex justify-end">
                <SaveButton onClick={savePreferences} loading={savingPrefs} label="Saqlash" />
              </div>
            </>
          )}

          {activeTab === "api" && (
            <>
              <GlassCard className="p-6">
                <h3 className="text-[16px] font-bold mb-1">API kalit</h3>
                <p className="text-[13px] text-muted-foreground mb-4">Tashqi tizimlar bilan integratsiya uchun</p>
                {apiKey && (
                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 mb-4">
                    <p className="text-[11px] text-muted-foreground mb-2">Bu kalitni xavfsiz joyda saqlang</p>
                    <div className="flex items-center gap-2">
                      <code className="text-[12px] break-all flex-1 bg-white/80 dark:bg-white/5 rounded-lg px-3 py-2 font-mono">{apiKey}</code>
                      <button onClick={copyApiKey} className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white/70 hover:bg-white transition-all dark:border-white/10 dark:bg-white/5">
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <button onClick={generateApiKey} disabled={generatingKey} className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5">
                  {generatingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                  {apiKey ? "Yangi kalit yaratish" : "API kalit yaratish"}
                </button>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-[16px] font-bold mb-1">Telegram bot</h3>
                <p className="text-[13px] text-muted-foreground mb-4">@TendersIQbot orqali bildirishnomalar oling</p>
                <div className="flex items-center gap-3 rounded-xl border border-black/[0.04] p-4 mb-4 dark:border-white/[0.04]">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    user?.telegram_id ? "bg-gradient-to-br from-sky-400 to-cyan-500" : "bg-black/[0.04] dark:bg-white/[0.06]"
                  }`}>
                    <Smartphone className={`h-5 w-5 ${user?.telegram_id ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-[13px] font-semibold ${user?.telegram_id ? "text-green-600" : ""}`}>
                      {user?.telegram_id ? "Ulangan" : "Ulanmagan"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {user?.telegram_id ? `ID: ${user.telegram_id}${user.telegram_username ? ` (@${user.telegram_username})` : ""}` : "Telegram botga ulanib bildirishnomalar oling"}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                    user?.telegram_id ? "bg-green-500/10 text-green-600" : "bg-gray-100 text-gray-500 dark:bg-white/5"
                  }`}>
                    {user?.telegram_id && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                    {user?.telegram_id ? "Faol" : "Nofaol"}
                  </span>
                </div>
                {user?.telegram_id ? (
                  <button onClick={unlinkTelegram} disabled={unlinkingTelegram} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-600 transition-all hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10">
                    {unlinkingTelegram ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Telegramni uzish
                  </button>
                ) : (
                  <button onClick={linkTelegram} disabled={linkingTelegram} className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5">
                    {linkingTelegram ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                    Telegramni ulash
                  </button>
                )}
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-[16px] font-bold mb-1">API hujjatlari</h3>
                <p className="text-[13px] text-muted-foreground mb-4">REST API orqali tenderlarni qidiring</p>
                <div className="rounded-xl border border-black/[0.04] p-4 space-y-2 text-[13px] dark:border-white/[0.04]">
                  <p>
                    <span className="text-muted-foreground">Base URL:</span>{" "}
                    <code className="bg-black/[0.03] dark:bg-white/[0.05] px-2 py-0.5 rounded-lg text-[12px]">
                      {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1
                    </code>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Auth:</span>{" "}
                    <code className="bg-black/[0.03] dark:bg-white/[0.05] px-2 py-0.5 rounded-lg text-[12px]">
                      Authorization: Bearer &lt;token&gt;
                    </code>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Docs:</span>{" "}
                    <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/docs`} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline text-[12px] font-medium">
                      Swagger UI →
                    </a>
                  </p>
                </div>
              </GlassCard>
            </>
          )}

          {activeTab === "admin" && user?.is_admin && (
            <AdminPanel />
          )}

          {activeTab === "danger" && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 backdrop-blur-xl p-6 dark:border-red-500/20 dark:bg-red-500/5">
              <h3 className="text-[16px] font-bold text-red-600 mb-1">Hisobni o&apos;chirish</h3>
              <p className="text-[12px] text-muted-foreground mb-5">Hisobingiz va barcha ma&apos;lumotlaringiz butunlay o&apos;chiriladi. Bu amalni qaytarib bo&apos;lmaydi.</p>
              <div className="rounded-xl border border-red-200 bg-white/60 p-4 text-[13px] mb-5 dark:bg-white/5 dark:border-red-500/20">
                <p className="font-semibold text-red-600 mb-2">Diqqat! O&apos;chirilganidan keyin:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[12px]">
                  <li>Barcha shaxsiy ma&apos;lumotlaringiz o&apos;chiriladi</li>
                  <li>Kompaniya profilingiz o&apos;chiriladi</li>
                  <li>Saqlangan tenderlar va arizalar yo&apos;qoladi</li>
                  <li>To&apos;lov tarixi saqlanib qoladi (qonun talabi)</li>
                </ul>
              </div>
              <div className="mb-4">
                <label className="text-[12px] font-semibold text-red-600 mb-1.5 block">
                  Tasdiqlash uchun &quot;HISOBNI O&apos;CHIRISH&quot; deb yozing
                </label>
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="HISOBNI O'CHIRISH"
                  className="w-full h-11 rounded-xl border border-red-200 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:bg-white/5 dark:border-red-500/20"
                />
              </div>
              <button
                disabled={deleteConfirm !== "HISOBNI O'CHIRISH"}
                onClick={async () => {
                  try { await api.delete("/v1/auth/me"); toast.success("Hisobingiz o'chirildi"); logout(); }
                  catch { toast.error("Hisobni o'chirishda xatolik"); }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hisobni butunlay o&apos;chirish
              </button>
            </div>
          )}

          {activeTab === "subscription" && (
            <>
              {usageData && (
                <GlassCard className="p-6">
                  <h3 className="text-[16px] font-bold mb-4">Joriy foydalanish</h3>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Kunlik so&apos;rovlar</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{usageData.daily_requests_used}</span>
                        <span className="text-muted-foreground">/ {usageData.daily_requests_limit}</span>
                      </div>
                      <Progress value={Math.round((usageData.daily_requests_used / usageData.daily_requests_limit) * 100)} className="mt-2" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Saqlangan tenderlar</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{usageData.saved_tenders}</span>
                        <span className="text-muted-foreground">/ {usageData.max_saved_tenders === -1 ? "∞" : usageData.max_saved_tenders}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Qolgan kunlar</p>
                      <span className="text-2xl font-bold">{usageData.days_remaining ?? "∞"}</span>
                    </div>
                  </div>
                </GlassCard>
              )}

              <div className="grid gap-6 md:grid-cols-3">
                {plansData.map((plan) => {
                  const isCurrent = plan.name === (subscriptionData?.plan ?? "free");
                  const planIcons: Record<string, React.ReactNode> = { free: <Zap className="h-6 w-6" />, pro: <Crown className="h-6 w-6" />, business: <Building2 className="h-6 w-6" /> };
                  const planColors: Record<string, string> = { free: "bg-muted", pro: "bg-primary text-primary-foreground", business: "bg-gradient-to-br from-amber-500 to-orange-600 text-white" };
                  return (
                    <div key={plan.name} className="relative pt-4">
                      {plan.name === "pro" && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 z-10 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] px-2.5 py-0.5 text-[12px] font-semibold">Mashhur</span>
                      )}
                      <GlassCard className={`p-6 h-full flex flex-col ${plan.name === "pro" ? "border-primary shadow-lg ring-2 ring-primary/20" : ""}`}>
                        <div className="text-center pt-6">
                          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl ${planColors[plan.name] ?? "bg-muted"}`}>
                            {planIcons[plan.name]}
                          </div>
                          <h3 className="text-xl font-bold capitalize mt-3">{plan.name}</h3>
                          <p className="text-muted-foreground mb-4">
                            <span className="text-3xl font-bold text-foreground">{plan.price_uzs === 0 ? "Bepul" : formatAmount(plan.price_uzs)}</span>
                            {plan.price_uzs > 0 && <span className="text-muted-foreground"> /oy</span>}
                          </p>
                        </div>
                        <div className="flex-1">
                          <Separator className="mb-4" />
                          <ul className="space-y-3">
                            {[
                              { label: `${plan.daily_requests} kunlik so'rov`, included: true },
                              { label: "ML tahlil", included: plan.ml_access },
                              { label: "API kirish", included: plan.api_access },
                              { label: "Hujjat tahlili", included: plan.document_analysis },
                              { label: `${plan.max_saved_tenders === -1 ? "Cheksiz" : plan.max_saved_tenders} saqlangan tender`, included: true },
                              { label: `${plan.max_team_members} jamoa a'zosi`, included: true },
                            ].map((f) => (
                              <li key={f.label} className="flex items-center gap-2 text-sm">
                                <Check className={`h-4 w-4 ${f.included ? "text-primary" : "text-muted-foreground/30"}`} />
                                <span className={f.included ? "" : "text-muted-foreground line-through"}>{f.label}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-4">
                          <button
                            className={`w-full rounded-full px-6 py-2.5 text-[13px] font-semibold transition-all active:scale-[0.97] ${isCurrent ? "border border-black/10 bg-white/70 backdrop-blur hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5" : "bg-[#1d1d1f] text-white hover:bg-[#333] hover:shadow-lg dark:bg-white dark:text-[#1d1d1f]"}`}
                            disabled={isCurrent}
                            onClick={() => toast.info("To'lov tizimi tez orada ishga tushadi.")}
                          >
                            {isCurrent ? "Joriy reja" : "Tanlash"}
                          </button>
                        </div>
                      </GlassCard>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === "payments" && (() => {
            const statusMap: Record<string, string> = { pending: "Kutilmoqda", completed: "To'langan", failed: "Xatolik", refunded: "Qaytarilgan", cancelled: "Bekor qilingan" };
            const totalPaid = paymentsData.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
            const paidPlans = plansData.filter((p: PlanInfo) => p.price_uzs > 0);
            return (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-sm font-medium">Jami to&apos;langan</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">{formatAmount(totalPaid)}</div>
                  </GlassCard>
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-sm font-medium">To&apos;lovlar soni</span>
                      <CreditCard className="h-4 w-4 text-sky-400" />
                    </div>
                    <div className="text-2xl font-bold">{paymentsData.length}</div>
                  </GlassCard>
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-sm font-medium">Kutilmoqda</span>
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold">{paymentsData.filter((p) => p.status === "pending").length}</div>
                  </GlassCard>
                </div>

                <GlassCard className="p-6">
                  <h3 className="text-[16px] font-bold mb-1">Yangi to&apos;lov</h3>
                  <p className="text-[13px] text-muted-foreground mb-4">Obuna rejangizni yangilash uchun to&apos;lov qiling</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v ?? "")}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Reja tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {paidPlans.map((plan) => (
                          <SelectItem key={plan.name} value={plan.name}>
                            {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} — {formatAmount(plan.price_uzs)}/oy
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v ?? "")}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="To'lov tizimi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="click">Click.uz</SelectItem>
                        <SelectItem value="payme">Payme</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      className="rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] disabled:opacity-50"
                      onClick={handlePayment}
                      disabled={paying || !selectedPlan || !selectedProvider}
                    >
                      {paying ? "Yaratilmoqda..." : "To'lov qilish"}
                      <ArrowUpRight className="ml-1 h-4 w-4 inline" />
                    </button>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="text-[16px] font-bold mb-1">To&apos;lov tarixi</h3>
                  <p className="text-[13px] text-muted-foreground mb-4">Barcha o&apos;tgan to&apos;lovlar</p>
                  {paymentsData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sana</TableHead>
                            <TableHead>Reja</TableHead>
                            <TableHead>Tizim</TableHead>
                            <TableHead>Tranzaksiya ID</TableHead>
                            <TableHead className="text-right">Summa</TableHead>
                            <TableHead>Holat</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentsData.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="text-sm">{formatDateTime(payment.created_at)}</TableCell>
                              <TableCell className="capitalize font-medium">{payment.plan}</TableCell>
                              <TableCell className="capitalize">{payment.provider}</TableCell>
                              <TableCell className="text-xs font-mono">{payment.transaction_id ?? "---"}</TableCell>
                              <TableCell className="text-right font-medium">{formatAmount(payment.amount)}</TableCell>
                              <TableCell>
                                <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-semibold">
                                  {statusMap[payment.status] ?? payment.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Wallet className="h-12 w-12 mb-3 opacity-30" />
                      <p className="font-medium">To&apos;lovlar mavjud emas</p>
                      <p className="text-sm">Birinchi to&apos;lovingizni yuqorida amalga oshiring</p>
                    </div>
                  )}
                </GlassCard>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg ${className}`}>
      {children}
    </div>
  );
}

function AppleInput({ id, value, onChange, placeholder, type = "text", disabled = false, className = "" }: {
  id?: string; value: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string; disabled?: boolean; className?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:border-white/10 ${className}`}
    />
  );
}

function SaveButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] disabled:opacity-50 dark:bg-white dark:text-[#1d1d1f]"
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {loading ? "Saqlanmoqda..." : label}
    </button>
  );
}
