import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Users, Target, Download, MapPin, DollarSign, FileText, BarChart3, Activity } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';
import { analyticsApi } from '../api/admin';

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

const fmtAmount = (n: number) => {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} trln`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} mln`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} ming`;
  return String(n);
};

const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const STAGE_LABELS: Record<string, string> = {
  preparation: 'Tayyorgarlik', submitted: 'Yuborilgan', evaluation: 'Baholash',
  negotiation: 'Muzokara', completed: 'Yakunlangan', cancelled: 'Bekor',
};
const STATUS_LABELS: Record<string, string> = {
  active: 'Faol', completed: 'Yakunlangan', cancelled: 'Bekor qilingan', draft: 'Qoralama',
};

export default function AnalyticsPage() {
  const { addToast, setActiveTab } = useAdmin();
  const [overview, setOverview] = useState<Record<string, any> | null>(null);
  const [retention, setRetention] = useState<Record<string, number> | null>(null);
  const [pipeline, setPipeline] = useState<Record<string, any> | null>(null);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [regions, setRegions] = useState<{ region: string; count: number }[]>([]);
  const [amounts, setAmounts] = useState<Record<string, any> | null>(null);
  const [appSummary, setAppSummary] = useState<Record<string, any> | null>(null);
  const [sources, setSources] = useState<{ source: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      analyticsApi.overview(days),
      analyticsApi.retention(),
      analyticsApi.pipeline(),
      analyticsApi.categoryBreakdown(),
      analyticsApi.regionBreakdown(),
      analyticsApi.tenderAmounts(),
      analyticsApi.applicationsSummary(),
      analyticsApi.sourceBreakdown(),
    ]).then(([ov, ret, pipe, cats, regs, amts, apps, srcs]) => {
      setOverview(ov as Record<string, any>);
      setRetention(ret);
      setPipeline(pipe as Record<string, any>);
      setCategories(cats);
      setRegions(regs);
      setAmounts(amts as Record<string, any>);
      setAppSummary(apps as Record<string, any>);
      setSources(srcs);
    }).catch(() => addToast('Xatolik', 'Analitikani yuklashda xato', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [days]);

  const handleExport = () => {
    const fmtSom = (n: number) => {
      if (n >= 1e12) return `${(n / 1e12).toFixed(1)} trln so'm`;
      if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd so'm`;
      if (n >= 1e6) return `${(n / 1e6).toFixed(1)} mln so'm`;
      if (n >= 1e3) return `${(n / 1e3).toFixed(0)} ming so'm`;
      return `${n} so'm`;
    };

    const blocks: { title: string; cols: string[][]; }[] = [];

    blocks.push({ title: 'UMUMIY', cols: [
      ["Ko'rsatkich", 'Davr', 'Foydalanuvchilar', 'Tenderlar', 'Matchlar', 'Konvertatsiya'],
      ['Qiymati', `${days} kun`, String(overview?.new_users ?? 0), String(overview?.new_tenders ?? 0), String(overview?.new_matches ?? 0), `${overview?.conversion_rate ?? 0}%`],
    ]});

    if (amounts) {
      blocks.push({ title: 'SUMMALAR', cols: [
        ["Ko'rsatkich", 'Umumiy', "O'rtacha", 'Eng katta', 'Eng kichik', 'Tenderlar soni'],
        ['Qiymati', fmtSom(amounts.total_amount), fmtSom(amounts.avg_amount), fmtSom(amounts.max_amount), fmtSom(amounts.min_amount), String(amounts.total_tenders)],
      ]});
    }

    if (regions.length > 0) {
      const totalR = regions.reduce((s, r) => s + r.count, 0);
      blocks.push({ title: 'REGIONLAR', cols: [
        ['Viloyat', ...regions.map(r => r.region)],
        ['Soni', ...regions.map(r => String(r.count))],
        ['Ulushi', ...regions.map(r => totalR > 0 ? `${((r.count / totalR) * 100).toFixed(1)}%` : '0%')],
      ]});
    }

    if (categories.length > 0) {
      const totalC = categories.reduce((s, c) => s + c.count, 0);
      blocks.push({ title: 'KATEGORIYALAR', cols: [
        ['Kategoriya', ...categories.map(c => c.category)],
        ['Soni', ...categories.map(c => String(c.count))],
        ['Ulushi', ...categories.map(c => totalC > 0 ? `${((c.count / totalC) * 100).toFixed(1)}%` : '0%')],
      ]});
    }

    if (sources.length > 0) {
      const totalS = sources.reduce((s, x) => s + x.count, 0);
      blocks.push({ title: 'MANBALAR', cols: [
        ['Manba', ...sources.map(s => s.source)],
        ['Soni', ...sources.map(s => String(s.count))],
        ['Ulushi', ...sources.map(s => totalS > 0 ? `${((s.count / totalS) * 100).toFixed(1)}%` : '0%')],
      ]});
    }

    if (byStatus.length > 0) {
      blocks.push({ title: 'TENDER HOLATLARI', cols: [
        ['Holat', ...byStatus.map(s => STATUS_LABELS[s.status] || s.status)],
        ['Soni', ...byStatus.map(s => String(s.count))],
        ['Summa', ...byStatus.map(s => fmtSom(s.amount))],
      ]});
    }

    if (appSummary) {
      const stageData = (appSummary.by_stage || []) as { stage: string; count: number }[];
      const resultData = (appSummary.by_result || []) as { result: string; count: number }[];
      blocks.push({ title: 'ARIZALAR', cols: [
        ['Bosqich', ...stageData.map(s => STAGE_LABELS[s.stage] || s.stage), '', 'Natija', ...resultData.map(r => r.result === 'won' ? 'Yutilgan' : r.result === 'lost' ? 'Yutqazilgan' : r.result)],
        ['Soni', ...stageData.map(s => String(s.count)), '', 'Soni', ...resultData.map(r => String(r.count))],
        ['', '', '', '', '', ''],
        ['Jami bid', fmtSom(appSummary.total_bid_amount), 'Yutilgan', fmtSom(appSummary.won_amount), 'Win ehtimoli', `${appSummary.avg_win_probability}%`],
      ]});
    }

    if (retention) {
      const retEntries = Object.entries(retention);
      blocks.push({ title: 'RETENTION', cols: [
        ['Davr', ...retEntries.map(([k]) => `So'nggi ${k}`)],
        ['Faol', ...retEntries.map(([, v]) => String(v))],
      ]});
    }

    if (pipeline) {
      blocks.push({ title: 'MATCH PIPELINE', cols: [
        ["Ko'rsatkich", 'Jami', 'Saqlangan', 'Xabarlashtirilgan', 'Save rate'],
        ['Qiymati', String(pipeline.total), String(pipeline.saved), String(pipeline.notified), `${pipeline.save_rate}%`],
      ]});
    }

    const allRows: string[][] = [];
    allRows.push(['TenderIQ — Analitika hisoboti', '', '', '', '', '']);
    allRows.push([`Davr: ${days} kun`, `Sana: ${new Date().toLocaleDateString('uz')}`, '', '', '', '']);
    allRows.push([]);

    blocks.forEach(block => {
      allRows.push([block.title]);
      block.cols.forEach(row => allRows.push(row));
      allRows.push([]);
    });

    const maxCols = Math.max(...allRows.map(r => r.length), 1);
    const csv = allRows.map(r => {
      const padded = [...r];
      while (padded.length < maxCols) padded.push('');
      return padded.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',');
    }).join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `analitika_${days}kun.csv`; a.click();
    URL.revokeObjectURL(url);
    addToast('Yuklandi', 'Analitika hisoboti yuklab olindi', 'success');
  };

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
      <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} />
    </div>
  );

  const dailyUsers = (overview?.daily_users as any[]) || [];
  const dailyTenders = (overview?.daily_tenders as any[]) || [];
  const byStage = (appSummary?.by_stage || []) as { stage: string; count: number }[];
  const byResult = (appSummary?.by_result || []) as { result: string; count: number }[];
  const byStatus = (amounts?.by_status || []) as { status: string; count: number; amount: number }[];
  const wonCount = byResult.find(r => r.result === 'won')?.count ?? 0;
  const lostCount = byResult.find(r => r.result === 'lost')?.count ?? 0;
  const winRate = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Analitika</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Platformaning to'liq statistikasi va tahlili</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="input select" style={{ width: '130px' }} value={days} onChange={e => setDays(+e.target.value)}>
            <option value={7}>7 kun</option>
            <option value={14}>14 kun</option>
            <option value={30}>30 kun</option>
            <option value={90}>90 kun</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}><Download size={13} /> CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={loadData}><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* === Quick Actions === */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { label: 'Hisobot yaratish', tab: 'reports', icon: FileText, color: 'var(--green)' },
          { label: 'Tender xaritasi', tab: 'tender-map', icon: MapPin, color: 'var(--teal)' },
          { label: 'Win/Loss kundalik', tab: 'journal', icon: BarChart3, color: 'var(--purple)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: Activity, color: 'var(--yellow)' },
          { label: 'Pipeline', tab: 'pipeline', icon: TrendingUp, color: 'var(--primary)' },
          { label: 'Narx strategiya', tab: 'pricing', icon: DollarSign, color: 'var(--red)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      {/* === KPI Cards === */}
      <div className="grid-4 mb-24">
        {[
          { label: 'Foydalanuvchilar', value: overview?.new_users ?? 0, icon: Users, color: 'var(--primary)', tab: 'users' },
          { label: 'Tenderlar', value: overview?.new_tenders ?? 0, icon: Target, color: 'var(--teal)', tab: 'tenders' },
          { label: 'Konvertatsiya', value: `${overview?.conversion_rate ?? 0}%`, icon: TrendingUp, color: 'var(--green)', tab: 'financials' },
          { label: 'Matchlar', value: overview?.new_matches ?? 0, icon: Activity, color: 'var(--purple)', tab: 'matches' },
        ].map(card => (
          <div key={card.label} className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab?.(card.tab)}>
            <div className="flex-between mb-8">
              <span className="stat-label">{card.label}</span>
              <card.icon size={16} style={{ color: card.color }} />
            </div>
            <div className="stat-value" style={{ fontSize: '22px' }}>{card.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px' }}>Batafsil →</div>
          </div>
        ))}
      </div>

      {/* === Row 2: Tender summalar + Win/Loss === */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mb-24">
        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={15} style={{ color: 'var(--green)' }} /> Tender summalari
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setActiveTab?.('tenders')}>Tenderlar →</button>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setActiveTab?.('calculator')}>Kalkulyator →</button>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Umumiy summa', value: fmtAmount(amounts?.total_amount ?? 0), color: 'var(--primary)' },
                { label: "O'rtacha", value: fmtAmount(amounts?.avg_amount ?? 0), color: 'var(--teal)' },
                { label: 'Eng katta', value: fmtAmount(amounts?.max_amount ?? 0), color: 'var(--green)' },
                { label: 'Eng kichik', value: fmtAmount(amounts?.min_amount ?? 0), color: 'var(--yellow)' },
              ].map(item => (
                <div key={item.label} style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
            {byStatus.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {byStatus.map(s => (
                  <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-0)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{STATUS_LABELS[s.status] || s.status}</span>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>{s.count} ta</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{fmtAmount(s.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={15} style={{ color: 'var(--purple)' }} /> Arizalar holati
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setActiveTab?.('journal')}>Kundalik →</button>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setActiveTab?.('pipeline')}>Pipeline →</button>
            </div>
          </div>
          <div className="card-body">
            {/* Win/Loss summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green)' }}>{wonCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Yutilgan</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--red)' }}>{lostCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Yutqazilgan</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>{winRate}%</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Win rate</div>
              </div>
            </div>
            {/* Stages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {byStage.map(s => {
                const total = byStage.reduce((sum, x) => sum + x.count, 0);
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                return (
                  <div key={s.stage}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{STAGE_LABELS[s.stage] || s.stage}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>{s.count}</span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--bg-0)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {appSummary && (
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-0)', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>Yutilgan summa</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)' }}>{fmtAmount(appSummary.won_amount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Row 3: Charts === */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mb-24">
        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700 }}>Yangi foydalanuvchilar</span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setActiveTab?.('users')}>Batafsil →</button>
          </div>
          <div className="card-body" style={{ height: '220px', minWidth: 0 }}>
            {dailyUsers.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-4)', fontSize: '13px' }}>Ma'lumot yo'q</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyUsers}>
                  <defs><linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="day" stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="count" stroke="var(--primary)" fill="url(#gUsers)" strokeWidth={2} name="Foydalanuvchi" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700 }}>Yangi tenderlar</span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setActiveTab?.('tenders')}>Batafsil →</button>
          </div>
          <div className="card-body" style={{ height: '220px', minWidth: 0 }}>
            {dailyTenders.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-4)', fontSize: '13px' }}>Ma'lumot yo'q</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTenders}>
                  <defs><linearGradient id="gTenders" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--teal)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--teal)" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="day" stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="count" stroke="var(--teal)" fill="url(#gTenders)" strokeWidth={2} name="Tender" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* === Row 4: Region + Category + Source === */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="mb-24">
        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} style={{ color: 'var(--teal)' }} /> Regionlar
            </span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setActiveTab?.('tender-map')}>Xarita →</button>
          </div>
          <div className="card-body" style={{ height: '260px', minWidth: 0 }}>
            {regions.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-4)', fontSize: '13px' }}>Ma'lumot yo'q</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regions.slice(0, 8)} layout="vertical">
                  <XAxis type="number" stroke="var(--text-4)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="region" stroke="var(--text-4)" fontSize={10} width={90} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="var(--teal)" radius={[0, 4, 4, 0]} name="Tenderlar" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} style={{ color: 'var(--primary)' }} /> Kategoriyalar
            </span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setActiveTab?.('pricing')}>Narxlar →</button>
          </div>
          <div className="card-body" style={{ height: '260px', minWidth: 0 }}>
            {categories.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-4)', fontSize: '13px' }}>Ma'lumot yo'q</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, count }) => `${category}: ${count}`} labelLine={false} fontSize={11}>
                    {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} style={{ color: 'var(--yellow)' }} /> Manbalar
            </span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setActiveTab?.('tenders')}>Tenderlar →</button>
          </div>
          <div className="card-body">
            {sources.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-4)', fontSize: '13px' }}>Ma'lumot yo'q</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sources.map((s, i) => {
                  const total = sources.reduce((sum, x) => sum + x.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <div key={s.source}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{s.source}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: COLORS[i % COLORS.length] }}>{s.count} ({pct}%)</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-0)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: '4px', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Row 5: Retention + Match pipeline === */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700 }}>Faol foydalanuvchilar</span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setActiveTab?.('users')}>Ko'rish →</button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {retention ? Object.entries(retention).map(([key, val]) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>So'nggi {key}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{val}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-0)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((val / Math.max(overview?.new_users || 1, 1)) * 100, 100)}%`, background: 'var(--primary)', borderRadius: '3px' }} />
                </div>
              </div>
            )) : <div style={{ color: 'var(--text-4)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Ma'lumot yo'q</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700 }}>Match pipeline</span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setActiveTab?.('matches')}>Ko'rish →</button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pipeline ? [
              { label: 'Jami matchlar', val: pipeline.total, color: 'var(--primary)' },
              { label: 'Saqlangan', val: pipeline.saved, color: 'var(--green)' },
              { label: 'Xabarlashtirilgan', val: pipeline.notified, color: 'var(--yellow)' },
              { label: 'Save rate', val: `${pipeline.save_rate}%`, color: 'var(--teal)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-0)', borderRadius: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{item.label}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: item.color }}>{item.val ?? 0}</span>
              </div>
            )) : <div style={{ color: 'var(--text-4)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Ma'lumot yo'q</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
