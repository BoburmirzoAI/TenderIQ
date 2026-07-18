"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  Plus,
  Trash2,
  TrendingUp,

  PiggyBank,
  Percent,
  AlertTriangle,
} from "lucide-react";

interface CostItem {
  id: number;
  name: string;
  amount: number;
}

const TAX_RATES = [
  { label: "QQS (12%)", value: 12 },
  { label: "Foyda solig'i (15%)", value: 15 },
  { label: "Ijtimoiy soliq (12%)", value: 12 },
];

let nextId = 1;

function fmt(n: number) {
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
}

export default function BudgetPage() {
  const [tenderAmount, setTenderAmount] = useState<string>("");
  const [marginPercent, setMarginPercent] = useState<string>("15");
  const [costs, setCosts] = useState<CostItem[]>([
    { id: nextId++, name: "Materiallar", amount: 0 },
    { id: nextId++, name: "Ish haqi", amount: 0 },
    { id: nextId++, name: "Transport", amount: 0 },
  ]);
  const [includeTax, setIncludeTax] = useState(true);

  const addCost = () => {
    setCosts((prev) => [...prev, { id: nextId++, name: "", amount: 0 }]);
  };

  const updateCost = (id: number, field: "name" | "amount", value: string) => {
    setCosts((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, [field]: field === "amount" ? Number(value) || 0 : value }
          : c
      )
    );
  };

  const removeCost = (id: number) => {
    setCosts((prev) => prev.filter((c) => c.id !== id));
  };

  const calc = useMemo(() => {
    const tender = Number(tenderAmount) || 0;
    const margin = Number(marginPercent) || 0;
    const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);

    const taxTotal = includeTax
      ? TAX_RATES.reduce((sum, t) => sum + (tender * t.value) / 100, 0)
      : 0;

    const targetBid = totalCosts > 0
      ? totalCosts * (1 + margin / 100) + taxTotal
      : 0;

    const profit = tender - totalCosts - taxTotal;
    const profitPercent = tender > 0 ? (profit / tender) * 100 : 0;
    const costPercent = tender > 0 ? (totalCosts / tender) * 100 : 0;

    const minBid = totalCosts + taxTotal;
    const maxMarginPercent = tender > 0 ? ((tender - totalCosts - taxTotal) / totalCosts) * 100 : 0;

    return {
      tender,
      totalCosts,
      taxTotal,
      targetBid,
      profit,
      profitPercent,
      costPercent,
      minBid,
      maxMarginPercent,
      isViable: profit > 0,
    };
  }, [tenderAmount, marginPercent, costs, includeTax]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Byudjet kalkulyator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tender uchun xarajat va foyda hisoblang
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Input section */}
        <div className="space-y-6">
          {/* Tender amount */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="p-6 pb-3">
              <h3 className="text-base font-semibold">Tender ma&apos;lumotlari</h3>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tender summasi (UZS)</Label>
                  <input
                    type="number"
                    value={tenderAmount}
                    onChange={(e) => setTenderAmount(e.target.value)}
                    placeholder="1 000 000 000"
                    className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kutilgan foyda (%)</Label>
                  <input
                    type="number"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(e.target.value)}
                    placeholder="15"
                    min={0}
                    max={100}
                    className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tax"
                  checked={includeTax}
                  onChange={(e) => setIncludeTax(e.target.checked)}
                  className="rounded border-input"
                />
                <Label htmlFor="tax" className="text-sm font-normal cursor-pointer">
                  Soliqlarni hisobga olish (QQS + foyda solig&apos;i + ijtimoiy)
                </Label>
              </div>
            </div>
          </div>

          {/* Costs */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="p-6 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Xarajatlar</h3>
                  <p className="text-sm text-muted-foreground">Barcha kutilgan xarajatlarni kiriting</p>
                </div>
                <button
                  onClick={addCost}
                  className="rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
                >
                  <span className="flex items-center">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Qo&apos;shish
                  </span>
                </button>
              </div>
            </div>
            <div className="px-6 pb-6 space-y-3">
              {costs.map((cost) => (
                <div key={cost.id} className="flex items-center gap-2">
                  <input
                    value={cost.name}
                    onChange={(e) => updateCost(cost.id, "name", e.target.value)}
                    placeholder="Xarajat nomi"
                    className="flex-1 h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  />
                  <input
                    type="number"
                    value={cost.amount || ""}
                    onChange={(e) => updateCost(cost.id, "amount", e.target.value)}
                    placeholder="Summa"
                    className="w-44 h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  />
                  <button
                    className={`shrink-0 rounded-xl border border-black/10 bg-white/70 backdrop-blur p-2 transition-all hover:bg-white hover:shadow-sm hover:text-destructive dark:border-white/10 dark:bg-white/5 ${costs.length <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => removeCost(cost.id)}
                    disabled={costs.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <Separator />
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Jami xarajatlar:</span>
                <span>{fmt(calc.totalCosts)} UZS</span>
              </div>
            </div>
          </div>

          {/* Tax breakdown */}
          {includeTax && calc.tender > 0 && (
            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="p-6 pb-3">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Soliqlar
                </h3>
              </div>
              <div className="px-6 pb-6 space-y-2">
                {TAX_RATES.map((tax) => (
                  <div key={tax.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{tax.label}</span>
                    <span>{fmt((calc.tender * tax.value) / 100)} UZS</span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Jami soliq:</span>
                  <span>{fmt(calc.taxTotal)} UZS</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results section */}
        <div className="space-y-4">
          {/* Viability */}
          {calc.tender > 0 && calc.totalCosts > 0 && (
            <div className={`rounded-2xl border backdrop-blur-xl p-4 transition-all hover:shadow-lg ${calc.isViable ? "border-green-200 bg-white/60 dark:border-green-900 dark:bg-[rgba(17,24,39,0.5)]" : "border-red-200 bg-white/60 dark:border-red-900 dark:bg-[rgba(17,24,39,0.5)]"}`}>
              <div className="flex items-center gap-3">
                {calc.isViable ? (
                  <TrendingUp className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <p className="font-semibold">
                    {calc.isViable ? "Foydali tender" : "Zarar ko'riladi"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {calc.isViable
                      ? `${calc.profitPercent.toFixed(1)}% sof foyda`
                      : "Xarajatlar tender summasidan oshib ketdi"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="p-6 pb-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <PiggyBank className="h-4 w-4" />
                Natija
              </h3>
            </div>
            <div className="px-6 pb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tender summasi</span>
                <span className="text-sm font-medium">{fmt(calc.tender)} UZS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Jami xarajatlar</span>
                <span className="text-sm font-medium text-red-500">-{fmt(calc.totalCosts)} UZS</span>
              </div>
              {includeTax && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Soliqlar</span>
                  <span className="text-sm font-medium text-red-500">-{fmt(calc.taxTotal)} UZS</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Sof foyda</span>
                <span className={`text-lg font-bold ${calc.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {calc.profit >= 0 ? "+" : ""}{fmt(calc.profit)} UZS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Foyda foizi</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${calc.profitPercent >= 0 ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f]" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                  {calc.profitPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {calc.totalCosts > 0 && (
            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="p-6 pb-3">
                <h3 className="text-base font-semibold">Tavsiyalar</h3>
              </div>
              <div className="px-6 pb-6 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Minimal taklif narxi</span>
                  <span className="font-medium">{fmt(calc.minBid)} UZS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Tavsiya etilgan narx ({marginPercent}%)
                  </span>
                  <span className="font-semibold text-primary">{fmt(calc.targetBid)} UZS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Xarajat ulushi</span>
                  <span className="font-medium">{calc.costPercent.toFixed(1)}%</span>
                </div>
                {calc.tender > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Maks. foyda margini</span>
                    <span className="font-medium">
                      {calc.maxMarginPercent > 0 ? `${calc.maxMarginPercent.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                )}

                {/* Cost breakdown bar */}
                {calc.tender > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground">Taqsimot</p>
                    <div className="h-4 rounded-full overflow-hidden flex bg-muted">
                      <div
                        className="bg-red-400 transition-all"
                        style={{ width: `${Math.min(calc.costPercent, 100)}%` }}
                        title={`Xarajatlar: ${calc.costPercent.toFixed(1)}%`}
                      />
                      {includeTax && (
                        <div
                          className="bg-amber-400 transition-all"
                          style={{ width: `${Math.min((calc.taxTotal / calc.tender) * 100, 100 - calc.costPercent)}%` }}
                          title={`Soliqlar: ${((calc.taxTotal / calc.tender) * 100).toFixed(1)}%`}
                        />
                      )}
                      <div
                        className="bg-green-400 transition-all flex-1"
                        title={`Foyda: ${calc.profitPercent.toFixed(1)}%`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Xarajat
                      </span>
                      {includeTax && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          Soliq
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        Foyda
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
