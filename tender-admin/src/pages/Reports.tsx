import { useState } from 'react';
import { FileText, FileSpreadsheet, BarChart3, Download, Calendar, Trophy, Users, MapPin, Target, CreditCard, RefreshCw, Eye, X, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';
import { reportsApi, analyticsApi, type ReportData } from '../api/admin';

const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const fmtAmount = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${Math.round(n / 1e6)} mln`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} ming`;
  return String(n);
};

interface ReportCard {
  id: string; title: string; description: string; icon: typeof FileText;
  color: string; bg: string;
}

const reportCards: ReportCard[] = [
  { id: 'summary', title: 'Umumiy hisobot', description: "Tenderlar, foydalanuvchilar, daromad, manbalar — barchasi bitta hisobotda", icon: BarChart3, color: 'var(--primary)', bg: 'rgba(99,102,241,0.1)' },
  { id: 'tenders', title: 'Tender hisoboti', description: "Barcha tenderlar ro'yxati — nomi, tashkilot, summa, holat, region, sana", icon: FileText, color: 'var(--teal)', bg: 'rgba(20,184,166,0.1)' },
  { id: 'regions', title: 'Regionlar hisoboti', description: "Tender taqsimoti viloyatlar bo'yicha — soni va foizi", icon: MapPin, color: 'var(--green)', bg: 'rgba(16,185,129,0.1)' },
  { id: 'categories', title: 'Kategoriyalar hisoboti', description: "Tender taqsimoti kategoriyalar bo'yicha — goods, works, services", icon: Target, color: 'var(--yellow)', bg: 'rgba(245,158,11,0.1)' },
  { id: 'applications', title: 'Arizalar hisoboti', description: "Yuborilgan arizalar, bosqichlari, natijalari va bid summalari", icon: FileSpreadsheet, color: 'var(--blue)', bg: 'rgba(59,130,246,0.1)' },
  { id: 'winloss', title: 'Win/Loss hisoboti', description: "G'alaba va mag'lubiyat natijalari — g'olib, summa, shartnoma raqami", icon: Trophy, color: 'var(--purple)', bg: 'rgba(139,92,246,0.1)' },
  { id: 'users', title: 'Foydalanuvchilar hisoboti', description: "Barcha foydalanuvchilar ro'yxati, obuna holati, ro'yxatdan o'tish sanasi", icon: Users, color: 'var(--red)', bg: 'rgba(239,68,68,0.1)' },
  { id: 'finance', title: 'Moliya hisoboti', description: "To'lovlar, obunalar, daromad — moliyaviy ko'rsatkichlar", icon: CreditCard, color: 'var(--green)', bg: 'rgba(16,185,129,0.1)' },
];

export default function Reports() {
  const { addToast, setActiveTab } = useAdmin();
  const today = new Date();
  const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState(fmt(monthAgo));
  const [dateTo, setDateTo] = useState(fmt(today));
  const [generating, setGenerating] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const setQuickRange = (days: number) => {
    const to = new Date();
    const from = new Date(); from.setDate(to.getDate() - days);
    setDateFrom(fmt(from));
    setDateTo(fmt(to));
  };

  const generateReport = async (reportId: string) => {
    setGenerating(reportId);
    try {
      if (reportId === 'summary' || reportId === 'finance') {
        const data = await reportsApi.generate(reportId, dateFrom, dateTo);
        setReportData(data);
        setPreviewOpen(true);
        addToast('Tayyor', 'Hisobot yaratildi — yuklab olishingiz mumkin', 'success');
      } else if (reportId === 'tenders') {
        const [overview, regions, cats, sources] = await Promise.all([
          reportsApi.generate('summary', dateFrom, dateTo),
          analyticsApi.regionBreakdown(),
          analyticsApi.categoryBreakdown(),
          analyticsApi.sourceBreakdown(),
        ]);
        const rows: any[][] = [];
        rows.push(['=== TENDER HISOBOTI ===', '', '', '', '']);
        rows.push([`Davr: ${dateFrom} — ${dateTo}`, '', '', '', '']);
        rows.push(['Jami tenderlar', overview.total_tenders, '', '', '']);
        rows.push(['', '', '', '', '']);
        rows.push(['=== Manba bo\'yicha ===', '', '', '', '']);
        overview.tender_by_source.forEach(s => rows.push([s.label, s.value, '', '', '']));
        rows.push(['', '', '', '', '']);
        rows.push(['=== Region bo\'yicha ===', '', '', '', '']);
        regions.forEach(r => rows.push([r.region, r.count, '', '', '']));
        rows.push(['', '', '', '', '']);
        rows.push(['=== Kategoriya bo\'yicha ===', '', '', '', '']);
        cats.forEach(c => rows.push([c.category, c.count, '', '', '']));
        exportCSV(`tender_hisobot_${dateFrom}_${dateTo}.csv`, ['Nomi', 'Qiymati', '', '', ''], rows);
        addToast('Yuklandi', 'Tender hisoboti CSV yuklab olindi', 'success');
      } else if (reportId === 'regions') {
        const regions = await analyticsApi.regionBreakdown();
        const total = regions.reduce((s, r) => s + r.count, 0);
        exportCSV(`regionlar_${dateFrom}_${dateTo}.csv`,
          ['Viloyat', 'Tenderlar soni', 'Foiz (%)'],
          regions.map(r => [r.region, r.count, total > 0 ? `${((r.count / total) * 100).toFixed(1)}%` : '0%'])
        );
        addToast('Yuklandi', 'Regionlar hisoboti yuklab olindi', 'success');
      } else if (reportId === 'categories') {
        const cats = await analyticsApi.categoryBreakdown();
        const total = cats.reduce((s, c) => s + c.count, 0);
        exportCSV(`kategoriyalar_${dateFrom}_${dateTo}.csv`,
          ['Kategoriya', 'Tenderlar soni', 'Foiz (%)'],
          cats.map(c => [c.category, c.count, total > 0 ? `${((c.count / total) * 100).toFixed(1)}%` : '0%'])
        );
        addToast('Yuklandi', 'Kategoriyalar hisoboti yuklab olindi', 'success');
      } else if (reportId === 'applications') {
        const apps = await analyticsApi.applicationsSummary();
        const rows: any[][] = [];
        rows.push(['=== ARIZALAR HISOBOTI ===', '', '']);
        rows.push([`Davr: ${dateFrom} — ${dateTo}`, '', '']);
        rows.push(['', '', '']);
        rows.push(['=== Bosqich bo\'yicha ===', '', '']);
        (apps.by_stage || []).forEach((s: any) => rows.push([s.stage, s.count, '']));
        rows.push(['', '', '']);
        rows.push(['=== Natija bo\'yicha ===', '', '']);
        (apps.by_result || []).forEach((r: any) => rows.push([r.result, r.count, '']));
        rows.push(['', '', '']);
        rows.push(['Umumiy bid summasi', apps.total_bid_amount, '']);
        rows.push(['Yutilgan summa', apps.won_amount, '']);
        rows.push(["O'rtacha yutish ehtimoli", `${apps.avg_win_probability}%`, '']);
        exportCSV(`arizalar_${dateFrom}_${dateTo}.csv`, ['Ko\'rsatkich', 'Qiymati', ''], rows);
        addToast('Yuklandi', 'Arizalar hisoboti yuklab olindi', 'success');
      } else if (reportId === 'winloss') {
        const { winLossApi } = await import('../api/admin');
        const [list, stats] = await Promise.all([winLossApi.list(500), winLossApi.stats()]);
        const rows: any[][] = [];
        rows.push(['=== WIN/LOSS HISOBOTI ===', '', '', '', '', '']);
        rows.push(['Jami natijalar', stats.total_results, '', '', '', '']);
        rows.push(['Umumiy summa', stats.total_won_amount, '', '', '', '']);
        rows.push(["O'rtacha g'alaba summasi", stats.avg_winning_amount, '', '', '', '']);
        rows.push(['', '', '', '', '', '']);
        rows.push(['=== Batafsil ro\'yxat ===', '', '', '', '', '']);
        list.forEach(r => rows.push([r.tender_title || `#${r.tender_id}`, r.winner_name, r.winner_stir || '', r.winning_amount || 0, r.currency, r.created_at]));
        exportCSV(`winloss_${dateFrom}_${dateTo}.csv`, ['Tender', "G'olib", 'STIR', 'Summa', 'Valyuta', 'Sana'], rows);
        addToast('Yuklandi', 'Win/Loss hisoboti yuklab olindi', 'success');
      } else if (reportId === 'users') {
        const { usersApi } = await import('../api/admin');
        const resp = await usersApi.list({ page: 1, per_page: 500 });
        exportCSV(`foydalanuvchilar_${dateFrom}_${dateTo}.csv`,
          ['ID', 'Ism', 'Email', 'Admin', 'Faol', "Ro'yxatdan o'tgan"],
          resp.data.map(u => [u.id, u.full_name || '', u.email, u.is_admin ? 'Ha' : 'Yo\'q', u.is_active ? 'Ha' : 'Yo\'q', u.created_at])
        );
        addToast('Yuklandi', 'Foydalanuvchilar hisoboti yuklab olindi', 'success');
      }
    } catch (err) {
      addToast('Xatolik', 'Hisobot yaratishda xato', 'error');
    } finally {
      setGenerating(null);
    }
  };

  const downloadPreview = () => {
    if (!reportData) return;
    const rows: string[][] = [];
    rows.push(['=== UMUMIY HISOBOT ===', '']);
    rows.push([`Davr: ${reportData.period}`, '']);
    rows.push(['Jami tenderlar', String(reportData.total_tenders)]);
    rows.push(['Yangi foydalanuvchilar', String(reportData.total_users)]);
    rows.push(['Umumiy daromad', String(reportData.total_revenue)]);
    rows.push(['', '']);
    rows.push(["=== Manba bo'yicha ===", '']);
    reportData.tender_by_source.forEach(s => rows.push([s.label, String(s.value)]));
    rows.push(['', '']);
    rows.push(["=== Daromad plan bo'yicha ===", '']);
    reportData.revenue_by_plan.forEach(p => rows.push([p.label, String(p.value)]));
    rows.push(['', '']);
    rows.push(['=== Kunlik foydalanuvchilar ===', '']);
    reportData.new_users.forEach(u => rows.push([u.label, String(u.value)]));
    exportCSV(`hisobot_${reportData.period.replace(/\s/g, '_')}.csv`, ["Ko'rsatkich", 'Qiymati'], rows);
    addToast('Yuklandi', 'Hisobot CSV yuklab olindi', 'success');
    setPreviewOpen(false);
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Hisobotlar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Loyihaning barcha hisobotlarini yarating va yuklab oling</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--teal)' },
          { label: 'Win/Loss', tab: 'journal', icon: Activity, color: 'var(--purple)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: TrendingUp, color: 'var(--yellow)' },
          { label: 'Narx strategiya', tab: 'pricing', icon: DollarSign, color: 'var(--red)' },
          { label: 'Moliya', tab: 'financials', icon: CreditCard, color: 'var(--green)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      {/* Date Range + Quick buttons */}
      <div className="card mb-24">
        <div className="card-body" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Calendar size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)' }}>Dan:</span>
            <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '155px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)' }}>Gacha:</span>
            <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '155px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { label: '7 kun', days: 7 },
              { label: '30 kun', days: 30 },
              { label: '90 kun', days: 90 },
              { label: '1 yil', days: 365 },
            ].map(q => (
              <button key={q.label} className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setQuickRange(q.days)}>
                {q.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-4)', padding: '6px 12px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            {dateFrom} — {dateTo}
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {reportCards.map(report => (
          <div key={report.id} className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: report.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <report.icon size={20} style={{ color: report.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>{report.title}</strong>
                  <p style={{ fontSize: '11px', color: 'var(--text-4)', margin: 0, lineHeight: '1.4' }}>{report.description}</p>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled={!!generating} onClick={() => generateReport(report.id)}>
                {generating === report.id ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                {generating === report.id ? 'Yaratilmoqda...' : 'Yaratish va yuklash'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal for summary/finance reports */}
      {previewOpen && reportData && (
        <div className="modal-overlay" onClick={() => setPreviewOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Hisobot — {reportData.period}</h2>
              <button className="btn-icon" onClick={() => setPreviewOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="grid-3" style={{ gap: '10px' }}>
                {[
                  { label: 'Jami tenderlar', value: reportData.total_tenders, color: 'var(--primary)' },
                  { label: 'Yangi foydalanuvchilar', value: reportData.total_users, color: 'var(--green)' },
                  { label: 'Umumiy daromad', value: fmtAmount(reportData.total_revenue), color: 'var(--teal)' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '14px', background: 'var(--bg-1)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {reportData.tender_by_source.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Tenderlar manba bo'yicha</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={reportData.tender_by_source}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Tenderlar" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {reportData.new_users.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Yangi foydalanuvchilar (kunlik)</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={reportData.new_users}>
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Foydalanuvchilar" fill="var(--green)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPreviewOpen(false)}>Yopish</button>
              <button className="btn btn-primary" onClick={downloadPreview}>
                <Download size={14} /> CSV yuklab olish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
