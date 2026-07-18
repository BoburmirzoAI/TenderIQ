"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import type { UzexRegisterData } from "@/types";

const REGIONS = [
  "Toshkent shahri", "Toshkent viloyati", "Andijon", "Buxoro", "Farg'ona",
  "Jizzax", "Xorazm", "Namangan", "Navoiy", "Qashqadaryo",
  "Qoraqalpog'iston", "Samarqand", "Sirdaryo", "Surxondaryo",
];

export function UzexRegister() {
  const router = useRouter();
  const uzexRegister = useAuthStore((s) => s.uzexRegister);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyType, setKeyType] = useState<"eri" | "usb">("eri");
  const [form, setForm] = useState<UzexRegisterData>({
    email: "",
    password: "",
    phone: "",
    inn: "",
    mfo: "",
    organization_name: "",
    account_number: "",
    region: "",
    district: "",
    address: "",
    director_name: "",
    eri_key_serial: "",
    usb_token_id: "",
    accept_terms: false,
  });

  const update = (field: keyof UzexRegisterData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password.length < 8) {
      toast.error("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (!/^\d{9,14}$/.test(form.inn)) {
      toast.error("INN faqat raqamlardan iborat bo'lishi kerak (9-14 ta)");
      return;
    }
    if (!/^\d{5}$/.test(form.mfo)) {
      toast.error("MFO 5 ta raqamdan iborat bo'lishi kerak");
      return;
    }
    if (!form.accept_terms) {
      toast.error("Oferta shartlarini qabul qiling");
      return;
    }

    const payload: UzexRegisterData = {
      ...form,
      phone: form.phone.replace(/[\s\-()]/g, ""),
    };
    if (keyType === "eri") {
      delete payload.usb_token_id;
    } else {
      delete payload.eri_key_serial;
    }

    setLoading(true);
    try {
      await uzexRegister(payload);
      toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Ro'yxatdan o'tishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-sky-400 focus:ring-[3px] focus:ring-sky-400/[0.12] dark:bg-slate-950 dark:border-white/10";
  const labelClass = "mb-[7px] block text-[13px] font-semibold text-muted-foreground";

  return (
    <div className="w-full max-w-[540px]">
      <div className="mb-8 text-center lg:hidden">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-slate-950 bg-sky-400">
          TQ
        </div>
        <h1 className="text-xl font-extrabold">
          Tender<span className="text-sky-400">IQ</span>
        </h1>
      </div>

      <h1 className="mb-1.5 text-[28px] font-extrabold tracking-[-0.03em]">
        Ro&apos;yxatdan o&apos;tish
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Tashkilot ma&apos;lumotlarini kiriting — barcha maydonlar majburiy
      </p>

      {/* Key type selector */}
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setKeyType("eri")}
          className={`flex-1 h-11 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
            keyType === "eri"
              ? "border-sky-400 bg-sky-400/10 text-sky-500"
              : "border-black/10 dark:border-white/10 text-muted-foreground hover:border-sky-400/50"
          }`}
          style={{ fontFamily: "inherit" }}
        >
          ERI kalit
        </button>
        <button
          type="button"
          onClick={() => setKeyType("usb")}
          className={`flex-1 h-11 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
            keyType === "usb"
              ? "border-sky-400 bg-sky-400/10 text-sky-500"
              : "border-black/10 dark:border-white/10 text-muted-foreground hover:border-sky-400/50"
          }`}
          style={{ fontFamily: "inherit" }}
        >
          USB Token
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Key selection */}
        <div className="mb-5">
          <label className={labelClass}>
            {keyType === "eri" ? "ERI kalitni tanlang" : "USB token tanlang"}
          </label>
          {keyType === "eri" ? (
            <select
              value={form.eri_key_serial || ""}
              onChange={(e) => update("eri_key_serial", e.target.value)}
              className={inputClass}
              style={{ fontFamily: "inherit" }}
            >
              <option value="">Kalitni tanlang...</option>
              <option value="demo_eri_key">Demo ERI kalit</option>
            </select>
          ) : (
            <select
              value={form.usb_token_id || ""}
              onChange={(e) => update("usb_token_id", e.target.value)}
              className={inputClass}
              style={{ fontFamily: "inherit" }}
            >
              <option value="">Qurilmani tanlang...</option>
              <option value="demo_usb_token">Demo USB token</option>
            </select>
          )}
        </div>

        {/* Organization name + INN */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Tashkilot nomi *</label>
            <input
              placeholder="Tashkilot nomi"
              value={form.organization_name}
              onChange={(e) => update("organization_name", e.target.value)}
              required
              className={inputClass}
              style={{ fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label className={labelClass}>INN (STIR) *</label>
            <input
              inputMode="numeric"
              placeholder="123456789"
              value={form.inn}
              onChange={(e) => update("inn", e.target.value.replace(/\D/g, "").slice(0, 14))}
              required
              className={inputClass}
              style={{ fontFamily: "inherit" }}
            />
          </div>
        </div>

        {/* MFO + Account */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>MFO *</label>
            <input
              inputMode="numeric"
              placeholder="12345"
              value={form.mfo}
              onChange={(e) => update("mfo", e.target.value.replace(/\D/g, "").slice(0, 5))}
              required
              className={inputClass}
              style={{ fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label className={labelClass}>Hisob raqami *</label>
            <input
              inputMode="numeric"
              placeholder="Hisob raqami"
              value={form.account_number}
              onChange={(e) => update("account_number", e.target.value.replace(/\D/g, "").slice(0, 25))}
              required
              className={inputClass}
              style={{ fontFamily: "inherit" }}
            />
          </div>
        </div>

        {/* Director name */}
        <div className="mb-5">
          <label className={labelClass}>Rahbar F.I.O. *</label>
          <input
            placeholder="Familiya Ism Otasining ismi"
            value={form.director_name}
            onChange={(e) => update("director_name", e.target.value)}
            required
            className={inputClass}
            style={{ fontFamily: "inherit" }}
          />
        </div>

        {/* Region + District */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Viloyat *</label>
            <select
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
              required
              className={inputClass}
              style={{ fontFamily: "inherit" }}
            >
              <option value="">Tanlang...</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tuman *</label>
            <input
              placeholder="Tuman nomi"
              value={form.district}
              onChange={(e) => update("district", e.target.value)}
              required
              className={inputClass}
              style={{ fontFamily: "inherit" }}
            />
          </div>
        </div>

        {/* Address */}
        <div className="mb-5">
          <label className={labelClass}>Manzil *</label>
          <input
            placeholder="To'liq manzil"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            required
            className={inputClass}
            style={{ fontFamily: "inherit" }}
          />
        </div>

        {/* Email + Phone */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              placeholder="email@misol.uz"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              className={inputClass}
              style={{ fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label className={labelClass}>Telefon *</label>
            <input
              type="tel"
              placeholder="+998 XX XXX XX XX"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              required
              className={inputClass}
              style={{ fontFamily: "inherit" }}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-5">
          <label className={labelClass}>Parol *</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Kamida 8 ta belgi"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              className={`${inputClass} pr-10`}
              style={{ fontFamily: "inherit" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Terms */}
        <label className="mb-6 flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.accept_terms}
            onChange={(e) => update("accept_terms", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-black/20 accent-sky-400"
          />
          <span className="text-sm text-muted-foreground leading-tight">
            Men{" "}
            <a href="#" className="text-sky-500 dark:text-sky-400 no-underline font-medium">
              Oferta shartlari
            </a>{" "}
            bilan tanishdim va roziman
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl border-none bg-sky-400 text-[15px] font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] disabled:opacity-50 cursor-pointer"
          style={{ fontFamily: "inherit" }}
        >
          {loading ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Hisobingiz bormi?{" "}
        <Link href="/login" className="font-semibold text-sky-500 dark:text-sky-400 no-underline">
          Kirish
        </Link>
      </p>
    </div>
  );
}
