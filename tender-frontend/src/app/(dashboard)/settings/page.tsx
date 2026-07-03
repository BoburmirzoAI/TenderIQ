"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Settings,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const TABS = [
  { key: "profile", label: "Profil", icon: UserIcon },
  { key: "security", label: "Xavfsizlik", icon: Shield },
  { key: "notifications", label: "Bildirishnomalar", icon: Bell },
  { key: "preferences", label: "Sozlamalar", icon: Palette },
  { key: "api", label: "API & Integratsiya", icon: Key },
  { key: "danger", label: "Xavfli zona", icon: Trash2 },
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

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
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

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await api.patch("/v1/auth/me", {
        full_name: fullName,
        phone: phone || null,
        telegram_username: telegramUsername || null,
      });
      setUser(data.data);
      toast.success("Profil yangilandi");
    } catch {
      toast.error("Saqlashda xatolik");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error("Yangi parollar mos kelmaydi");
      return;
    }
    if (passwords.new_password.length < 8) {
      toast.error("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setSavingPassword(true);
    try {
      await api.post("/v1/auth/change-password", {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
    } catch {
      toast.error("Joriy parol noto'g'ri");
    } finally {
      setSavingPassword(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotify(true);
    try {
      const { data } = await api.patch("/v1/auth/me", {
        notify_new_tenders: notifyNewTenders,
        notify_match: notifyMatch,
        notify_deadline: notifyDeadline,
        notify_results: notifyResults,
        notify_email: notifyEmail,
        notify_telegram: notifyTelegram,
      });
      setUser(data.data);
      toast.success("Bildirishnoma sozlamalari saqlandi");
    } catch {
      toast.error("Saqlashda xatolik");
    } finally {
      setSavingNotify(false);
    }
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const { data } = await api.patch("/v1/auth/me", {
        language,
        theme,
      });
      setUser(data.data);
      applyTheme(theme);
      toast.success("Sozlamalar saqlandi");
    } catch {
      toast.error("Saqlashda xatolik");
    } finally {
      setSavingPrefs(false);
    }
  };

  const generateApiKey = async () => {
    setGeneratingKey(true);
    try {
      const { data } = await api.post("/v1/auth/api-key");
      setApiKey(data.data.api_key);
      toast.success("API kalit yaratildi");
    } catch {
      toast.error("API kalit yaratishda xatolik");
    } finally {
      setGeneratingKey(false);
    }
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const linkTelegram = async () => {
    setLinkingTelegram(true);
    try {
      const { data } = await api.post("/v1/auth/telegram-link-token");
      window.open(data.data.deep_link, "_blank");
      toast.success("Telegram bot ochildi. Ulangandan so'ng sahifani yangilang.");
    } catch {
      toast.error("Telegram ulash tokenini yaratishda xatolik");
    } finally {
      setLinkingTelegram(false);
    }
  };

  const unlinkTelegram = async () => {
    setUnlinkingTelegram(true);
    try {
      await api.post("/v1/auth/telegram-unlink");
      const { data } = await api.get("/v1/auth/me");
      setUser(data.data);
      toast.success("Telegram uzildi");
    } catch {
      toast.error("Telegram uzishda xatolik");
    } finally {
      setUnlinkingTelegram(false);
    }
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
    } finally {
      setSendingVerification(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      const { data } = await api.post("/v1/auth/logout-all");
      localStorage.setItem("access_token", data.data.access_token);
      localStorage.setItem("refresh_token", data.data.refresh_token);
      toast.success("Barcha qurilmalardan chiqildi. Yangi token yaratildi.");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Sozlamalar
        </h1>
        <p className="text-muted-foreground">
          Hisob va platforma sozlamalaringizni boshqaring
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                } ${tab.key === "danger" ? "text-destructive hover:text-destructive" : ""}`}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* ===== PROFIL ===== */}
          {activeTab === "profile" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Shaxsiy ma&apos;lumotlar</CardTitle>
                  <CardDescription>
                    Ism, telefon va boshqa ma&apos;lumotlaringizni yangilang
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">To&apos;liq ism</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email ?? ""} disabled />
                      <p className="text-xs text-muted-foreground">
                        Email o&apos;zgartirib bo&apos;lmaydi
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon raqam</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegram">Telegram username</Label>
                      <Input
                        id="telegram"
                        value={telegramUsername}
                        onChange={(e) => setTelegramUsername(e.target.value)}
                        placeholder="@username"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hisob holati</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Holat:</span>
                      <Badge variant={user?.is_active ? "default" : "destructive"}>
                        {user?.is_active ? "Faol" : "Nofaol"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Tasdiqlangan:</span>
                      <Badge variant={user?.is_verified ? "default" : "secondary"}>
                        {user?.is_verified ? "Ha" : "Yo'q"}
                      </Badge>
                      {!user?.is_verified && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary"
                          onClick={handleSendVerification}
                          disabled={sendingVerification}
                        >
                          {sendingVerification ? "Yuborilmoqda..." : "Tasdiqlash xatini yuborish"}
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Telegram:</span>
                      <Badge variant={user?.telegram_id ? "default" : "outline"}>
                        {user?.telegram_id ? "Ulangan" : "Ulanmagan"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        Ro&apos;yxatdan o&apos;tgan:
                      </span>
                      <span>
                        {user?.created_at
                          ? new Date(user.created_at).toLocaleDateString("uz-UZ")
                          : "—"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    "Profilni saqlash"
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ===== XAVFSIZLIK ===== */}
          {activeTab === "security" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Parolni o&apos;zgartirish</CardTitle>
                  <CardDescription>
                    Xavfsizlik uchun parolni muntazam o&apos;zgartiring
                  </CardDescription>
                </CardHeader>
                <form onSubmit={changePassword}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Joriy parol</Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          type={showPasswords ? "text" : "password"}
                          value={passwords.current_password}
                          onChange={(e) =>
                            setPasswords((p) => ({ ...p, current_password: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="new_password">Yangi parol</Label>
                        <Input
                          id="new_password"
                          type={showPasswords ? "text" : "password"}
                          value={passwords.new_password}
                          onChange={(e) =>
                            setPasswords((p) => ({ ...p, new_password: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">Parolni tasdiqlang</Label>
                        <Input
                          id="confirm_password"
                          type={showPasswords ? "text" : "password"}
                          value={passwords.confirm_password}
                          onChange={(e) =>
                            setPasswords((p) => ({ ...p, confirm_password: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        {showPasswords ? "Parollarni yashirish" : "Parollarni ko'rsatish"}
                      </button>
                    </div>
                  </CardContent>
                  <div className="px-6 pb-6">
                    <Button type="submit" disabled={savingPassword}>
                      {savingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          O&apos;zgartirilmoqda...
                        </>
                      ) : (
                        "Parolni o'zgartirish"
                      )}
                    </Button>
                  </div>
                </form>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sessiyalar</CardTitle>
                  <CardDescription>
                    Barcha qurilmalardan hisobingizdan chiqing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={handleLogoutAll}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Barcha qurilmalardan chiqish
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* ===== BILDIRISHNOMALAR ===== */}
          {activeTab === "notifications" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Bildirishnoma turlari</CardTitle>
                  <CardDescription>
                    Qaysi hodisalar haqida xabar olishni tanlang
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Yangi tenderlar</p>
                      <p className="text-xs text-muted-foreground">
                        Sizning sohangizdagi yangi tenderlar qo&apos;shilganda
                      </p>
                    </div>
                    <Switch
                      checked={notifyNewTenders}
                      onCheckedChange={setNotifyNewTenders}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Mos tenderlar</p>
                      <p className="text-xs text-muted-foreground">
                        Kompaniyangizga mos tender topilganda
                      </p>
                    </div>
                    <Switch checked={notifyMatch} onCheckedChange={setNotifyMatch} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Muddat eslatmalari</p>
                      <p className="text-xs text-muted-foreground">
                        Tender muddati yaqinlashganda (3 kun oldin)
                      </p>
                    </div>
                    <Switch
                      checked={notifyDeadline}
                      onCheckedChange={setNotifyDeadline}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Natijalar</p>
                      <p className="text-xs text-muted-foreground">
                        Tender g&apos;olibi e&apos;lon qilinganda
                      </p>
                    </div>
                    <Switch
                      checked={notifyResults}
                      onCheckedChange={setNotifyResults}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Yetkazish kanallari</CardTitle>
                  <CardDescription>
                    Bildirishnomalar qaysi kanal orqali kelsin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Telegram</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.telegram_id
                            ? "Telegram bot orqali"
                            : "Avval Telegram botga ulanish kerak"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifyTelegram}
                      onCheckedChange={setNotifyTelegram}
                      disabled={!user?.telegram_id}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email} manziliga
                        </p>
                      </div>
                    </div>
                    <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={saveNotifications} disabled={savingNotify}>
                  {savingNotify ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    "Bildirishnomalarni saqlash"
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ===== SOZLAMALAR ===== */}
          {activeTab === "preferences" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Til
                  </CardTitle>
                  <CardDescription>Platforma tilini tanlang</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={language} onValueChange={(v) => setLanguage(v ?? language)}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uz">O&apos;zbek tili</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Mavzu (Tema)
                  </CardTitle>
                  <CardDescription>Interfeys rangini tanlang</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 max-w-sm">
                    {[
                      { key: "light", label: "Yorug'", preview: "bg-white border" },
                      { key: "dark", label: "Qorong'u", preview: "bg-zinc-900 border-zinc-700" },
                      { key: "system", label: "Tizim", preview: "bg-gradient-to-r from-white to-zinc-900 border" },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => {
                          setTheme(t.key);
                          applyTheme(t.key);
                        }}
                        className={`rounded-lg border-2 p-3 text-center text-sm transition-colors ${
                          theme === t.key
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-muted hover:border-muted-foreground/30"
                        }`}
                      >
                        <div
                          className={`h-8 rounded-md mb-2 ${t.preview}`}
                        />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={savePreferences} disabled={savingPrefs}>
                  {savingPrefs ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    "Sozlamalarni saqlash"
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ===== API & INTEGRATSIYA ===== */}
          {activeTab === "api" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>API kalit</CardTitle>
                  <CardDescription>
                    Tashqi tizimlar bilan integratsiya uchun API kalit yarating
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {apiKey && (
                    <div className="rounded-lg border bg-muted p-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        Bu kalitni xavfsiz joyda saqlang. U qayta ko&apos;rsatilmaydi.
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm break-all flex-1 bg-background rounded px-2 py-1">
                          {apiKey}
                        </code>
                        <Button variant="outline" size="icon" onClick={copyApiKey}>
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={generateApiKey}
                    disabled={generatingKey}
                  >
                    {generatingKey ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yaratilmoqda...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        {apiKey ? "Yangi kalit yaratish" : "API kalit yaratish"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Telegram bot</CardTitle>
                  <CardDescription>
                    @TenderIQBot orqali bildirishnomalar oling
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-8 w-8 text-blue-500" />
                    <div className="flex-1">
                      {user?.telegram_id ? (
                        <div>
                          <p className="text-sm font-medium text-green-600">Ulangan</p>
                          <p className="text-xs text-muted-foreground">
                            Telegram ID: {user.telegram_id}
                            {user.telegram_username && ` (@${user.telegram_username})`}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium">Ulanmagan</p>
                          <p className="text-xs text-muted-foreground">
                            Telegram botga ulanib bildirishnomalar oling
                          </p>
                        </div>
                      )}
                    </div>
                    <Badge variant={user?.telegram_id ? "default" : "outline"}>
                      {user?.telegram_id ? "Faol" : "Nofaol"}
                    </Badge>
                  </div>
                  {user?.telegram_id ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={unlinkTelegram}
                      disabled={unlinkingTelegram}
                      className="text-destructive hover:text-destructive"
                    >
                      {unlinkingTelegram ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uzilmoqda...
                        </>
                      ) : (
                        "Telegramni uzish"
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={linkTelegram}
                      disabled={linkingTelegram}
                    >
                      {linkingTelegram ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Tayyorlanmoqda...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Telegramni ulash
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API hujjatlari</CardTitle>
                  <CardDescription>
                    REST API orqali tenderlarni qidiring va tahlil qiling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Base URL:</span>{" "}
                      <code className="bg-background px-1 rounded">
                        {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1
                      </code>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Auth:</span>{" "}
                      <code className="bg-background px-1 rounded">
                        Authorization: Bearer &lt;token&gt;
                      </code>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Docs:</span>{" "}
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/docs`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Swagger UI
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ===== XAVFLI ZONA ===== */}
          {activeTab === "danger" && (
            <>
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    Hisobni o&apos;chirish
                  </CardTitle>
                  <CardDescription>
                    Hisobingiz va barcha ma&apos;lumotlaringiz butunlay o&apos;chiriladi.
                    Bu amalni qaytarib bo&apos;lmaydi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm">
                    <p className="font-medium text-destructive mb-2">
                      Diqqat! O&apos;chirilganidan keyin:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Barcha shaxsiy ma&apos;lumotlaringiz o&apos;chiriladi</li>
                      <li>Kompaniya profilingiz o&apos;chiriladi</li>
                      <li>Saqlangan tenderlar va arizalar yo&apos;qoladi</li>
                      <li>To&apos;lov tarixi saqlanib qoladi (qonun talabi)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-destructive">
                      Tasdiqlash uchun &quot;HISOBNI O&apos;CHIRISH&quot; deb yozing
                    </Label>
                    <Input
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="HISOBNI O'CHIRISH"
                      className="border-destructive/30"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    disabled={deleteConfirm !== "HISOBNI O'CHIRISH"}
                    onClick={async () => {
                      try {
                        await api.delete("/v1/auth/me");
                        toast.success("Hisobingiz o'chirildi");
                        logout();
                      } catch {
                        toast.error("Hisobni o'chirishda xatolik");
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hisobni butunlay o&apos;chirish
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
