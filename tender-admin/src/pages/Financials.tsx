import { useState, useEffect, useMemo } from 'react';
import { CreditCard, TrendingUp, Users, Crown, Building, RefreshCw, Download, Search, Filter, ChevronDown, ChevronUp, BarChart3, FileText, Target, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';
import { financialsApi, type RevenueOverview, type AdminPayment, type AdminSubscription } from '../api/admin';

const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

const statusColors: Record<string, string> = {
  completed: 'badge-green', failed: 'badge-red', pending: 'badge-yellow',
};

const PIE_COLORS = ['var(--green)', 'var(--red)', 'var(--yellow)', 'var(--blue)'];

type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

const isInPeriod = (dateStr: string, period: PeriodFilter, customFrom: string, customTo: string): boolean => {
  if (period === 'all') return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (period === 'today') return d.toDateString() === now.toDateString();
  if (period === 'week') { const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7); return d >= weekAgo; }
  if (period === 'month') { const monthAgo = new Date(); monthAgo.setMonth(now.getMonth() - 1); return d >= monthAgo; }
  if (period === 'custom') {
    if (customFrom && d < new Date(customFrom)) return false;
    if (customTo && d > new Date(customTo + 'T23:59:59')) return false;
  }
  return true;
};

const periodLabel: Record<PeriodFilter, string> = {
  all: 'Barchasi', today: 'Bugun', week: 'Hafta', month: 'Oy', custom: 'Maxsus',
};

export default function FinancialsPage() {
  const { addToast } = useAdmin();
  const [overview, setOverview] = useState<RevenueOverview | null>(null);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [tab, setTab] = useState<'payments' | 'subscriptions'>('payments');
  const [loading, setLoading] = useState(true);
  const [payPage, setPayPage] = useState(1);
  const [payTotal, setPayTotal] = useState(0);
  const [subPage, setSubPage] = useState(1);
  const [subTotal, setSubTotal] = useState(0);
  const perPage = 15;

  const [paySearch, setPaySearch] = useState('');
  const [payStatusFilter, setPayStatusFilter] = useState('');
  const [payPeriod, setPayPeriod] = useState<PeriodFilter>('all');
  const [payCustomFrom, setPayCustomFrom] = useState('');
  const [payCustomTo, setPayCustomTo] = useState('');

  const [subSearch, setSubSearch] = useState('');
  const [subPlanFilter, setSubPlanFilter] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const [subPeriod, setSubPeriod] = useState<PeriodFilter>('all');
  const [subCustomFrom, setSubCustomFrom] = useState('');
  const [subCustomTo, setSubCustomTo] = useState('');

  const [expandedPay, setExpandedPay] = useState<number | null>(null);
  const [expandedSub, setExpandedSub] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    financialsApi.overview().then(setOverview).catch(() => addToast('Xatolik', 'Overview yuklanmadi', 'error'));
  }, []);

  useEffect(() => {
    setLoading(true);
    financialsApi.payments({ page: payPage, per_page: perPage })
      .then(res => { setPayments(res.data); setPayTotal(res.total); })
      .catch(() => addToast('Xatolik', "To'lovlar yuklanmadi", 'error'))
      .finally(() => setLoading(false));
  }, [payPage]);

  useEffect(() => {
    financialsApi.subscriptions({ page: subPage, per_page: perPage })
      .then(res => { setSubscriptions(res.data); setSubTotal(res.total); })
      .catch(() => addToast('Xatolik', 'Obunalar yuklanmadi', 'error'));
  }, [subPage]);

  const filteredPayments = useMemo(() => payments.filter(p => {
    if (payStatusFilter && p.status !== payStatusFilter) return false;
    if (paySearch && !(p.user_name || '').toLowerCase().includes(paySearch.toLowerCase()) && !(p.user_email || '').toLowerCase().includes(paySearch.toLowerCase())) return false;
    if (!isInPeriod(p.created_at, payPeriod, payCustomFrom, payCustomTo)) return false;
    return true;
  }), [payments, payStatusFilter, paySearch, payPeriod, payCustomFrom, payCustomTo]);

  const filteredSubscriptions = useMemo(() => subscriptions.filter(s => {
    if (subPlanFilter && s.plan !== subPlanFilter) return false;
    if (subStatusFilter === 'active' && !s.is_active) return false;
    if (subStatusFilter === 'inactive' && s.is_active) return false;
    if (subSearch && !(s.user_name || '').toLowerCase().includes(subSearch.toLowerCase()) && !(s.user_email || '').toLowerCase().includes(subSearch.toLowerCase())) return false;
    if (!isInPeriod(s.starts_at, subPeriod, subCustomFrom, subCustomTo)) return false;
    return true;
  }), [subscriptions, subPlanFilter, subStatusFilter, subSearch, subPeriod, subCustomFrom, subCustomTo]);

  const paymentStats = useMemo(() => {
    const total = filteredPayments.reduce((s, p) => s + p.amount, 0);
    const completed = filteredPayments.filter(p => p.status === 'completed');
    const failed = filteredPayments.filter(p => p.status === 'failed');
    const pending = filteredPayments.filter(p => p.status === 'pending');
    return { total, completedSum: completed.reduce((s, p) => s + p.amount, 0), completedCount: completed.length, failedCount: failed.length, pendingCount: pending.length };
  }, [filteredPayments]);

  const subStats = useMemo(() => {
    const active = filteredSubscriptions.filter(s => s.is_active).length;
    const inactive = filteredSubscriptions.filter(s => !s.is_active).length;
    const byPlan: Record<string, number> = {};
    filteredSubscriptions.forEach(s => { byPlan[s.plan] = (byPlan[s.plan] || 0) + 1; });
    return { active, inactive, byPlan };
  }, [filteredSubscriptions]);

  const kpiCards = overview ? [
    { label: 'Jami daromad', value: `${fmt(overview.total_revenue)} so'm`, icon: CreditCard, color: 'var(--green)' },
    { label: 'MRR', value: `${fmt(overview.mrr)} so'm`, icon: TrendingUp, color: 'var(--primary)' },
    { label: 'Pro obunalar', value: overview.pro_subscribers, icon: Crown, color: 'var(--yellow)' },
    { label: 'Business', value: overview.business_subscribers, icon: Building, color: 'var(--purple)' },
    { label: 'Bepul foydalanuvchi', value: overview.free_users, icon: Users, color: 'var(--text-3)' },
    { label: 'Muvaffaqiyatli', value: overview.completed_payments, icon: CreditCard, color: 'var(--teal)' },
  ] : [];

  const barData = overview ? [
    { name: 'Muvaffaqiyatli', value: overview.completed_payments, fill: 'var(--green)' },
    { name: 'Muvaffaqiyatsiz', value: overview.failed_payments, fill: 'var(--red)' },
    { name: 'Kutilmoqda', value: overview.pending_payments, fill: 'var(--yellow)' },
  ] : [];

  const payTotalPages = Math.ceil(payTotal / perPage);
  const subTotalPages = Math.ceil(subTotal / perPage);

  const downloadFiltered = (type: 'payments' | 'subscriptions') => {
    const periodName = type === 'payments' ? payPeriod : subPeriod;
    const suffix = periodName === 'all' ? 'barchasi' : periodName === 'today' ? 'bugun' : periodName === 'week' ? 'hafta' : periodName === 'month' ? 'oy' : 'maxsus';
    if (type === 'payments') {
      exportCSV(
        `tolovlar_${suffix}_${new Date().toISOString().slice(0, 10)}.csv`,
        ['#', 'Foydalanuvchi', 'Email', 'Miqdor', 'Valyuta', 'Plan', 'Provider', 'Holat', 'Sana'],
        filteredPayments.map(p => [p.id, p.user_name || '', p.user_email || '', p.amount, p.currency, p.plan, p.provider, p.status, new Date(p.created_at).toLocaleDateString('uz')])
      );
    } else {
      exportCSV(
        `obunalar_${suffix}_${new Date().toISOString().slice(0, 10)}.csv`,
        ['#', 'Foydalanuvchi', 'Email', 'Plan', 'Holat', 'Boshlanish', 'Tugash', 'Faol'],
        filteredSubscriptions.map(s => [s.id, s.user_name || '', s.user_email || '', s.plan, s.is_active ? 'Faol' : 'Faol emas', new Date(s.starts_at).toLocaleDateString('uz'), s.expires_at ? new Date(s.expires_at).toLocaleDateString('uz') : '∞', s.is_active ? 'Ha' : "Yo'q"])
      );
    }
    addToast('Yuklandi', `${type === 'payments' ? "To'lovlar" : 'Obunalar'} CSV yuklandi (${suffix})`, 'success');
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Moliya</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>To'lovlar, obunalar va moliyaviy tahlil</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={14} /> {showFilters ? 'Filtrlarni yashirish' : "Filtrlarni ko'rsatish"}
        </button>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--green)' },
          { label: 'Foydalanuvchilar', tab: 'users', icon: Users, color: 'var(--teal)' },
          { label: 'Narx strategiya', tab: 'pricing', icon: DollarSign, color: 'var(--red)' },
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--yellow)' },
          { label: 'Win/Loss', tab: 'journal', icon: TrendingUp, color: 'var(--purple)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      <div className="grid-6 mb-24">
        {kpiCards.map(card => (
          <div key={card.label} className="card stat-card">
            <div className="flex-between mb-8">
              <span className="stat-label">{card.label}</span>
              <card.icon size={16} style={{ color: card.color }} />
            </div>
            <div className="stat-value" style={{ fontSize: '20px' }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {barData.length > 0 && (
          <div className="card">
            <div className="card-header"><span style={{ fontWeight: 700, color: 'var(--text-0)' }}>To'lov holatlari</span></div>
            <div className="card-body" style={{ height: '200px', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="var(--text-4)" fontSize={12} />
                  <YAxis stroke="var(--text-4)" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {Object.keys(subStats.byPlan).length > 0 && (
          <div className="card">
            <div className="card-header"><span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Obuna planlari taqsimoti</span></div>
            <div className="card-body" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={Object.entries(subStats.byPlan).map(([k, v]) => ({ name: k.toUpperCase(), value: v }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                    {Object.keys(subStats.byPlan).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--border-1)', paddingBottom: '0' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            {(['payments', 'subscriptions'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '12px 20px', fontSize: '13px', fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--primary)' : 'var(--text-3)', borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent', background: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
                {t === 'payments' ? `To'lovlar (${payTotal})` : `Obunalar (${subTotal})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto', color: 'var(--text-3)' }} /></div>
        ) : tab === 'payments' ? (
          <>
            {showFilters && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                  <input className="input" placeholder="Qidirish..." value={paySearch} onChange={e => setPaySearch(e.target.value)}
                    style={{ height: '28px', width: '150px', padding: '2px 10px 2px 28px', fontSize: '12px' }} />
                </div>
                <select className="input" value={payStatusFilter} onChange={e => setPayStatusFilter(e.target.value)}
                  style={{ height: '28px', padding: '2px 8px', fontSize: '12px' }}>
                  <option value="">Barcha holatlar</option>
                  <option value="completed">Muvaffaqiyatli</option>
                  <option value="failed">Muvaffaqiyatsiz</option>
                  <option value="pending">Kutilmoqda</option>
                </select>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-1)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border)' }}>
                  {(['all', 'today', 'week', 'month', 'custom'] as PeriodFilter[]).map(p => (
                    <button key={p} onClick={() => setPayPeriod(p)}
                      style={{ padding: '4px 10px', fontSize: '11px', fontWeight: payPeriod === p ? 600 : 400, color: payPeriod === p ? 'white' : 'var(--text-3)', background: payPeriod === p ? 'var(--primary)' : 'transparent', borderRadius: '4px', cursor: 'pointer', border: 'none', transition: 'all 0.15s' }}>
                      {periodLabel[p]}
                    </button>
                  ))}
                </div>
                {payPeriod === 'custom' && (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input className="input" type="date" value={payCustomFrom} onChange={e => setPayCustomFrom(e.target.value)} style={{ height: '28px', fontSize: '12px', width: '140px' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>—</span>
                    <input className="input" type="date" value={payCustomTo} onChange={e => setPayCustomTo(e.target.value)} style={{ height: '28px', fontSize: '12px', width: '140px' }} />
                  </div>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-4)', alignSelf: 'center' }}>
                    {filteredPayments.length} ta • {fmt(paymentStats.completedSum)} so'm
                  </span>
                  <button className="btn btn-ghost btn-sm" title="CSV yuklash" onClick={() => downloadFiltered('payments')}>
                    <Download size={13} /> CSV
                  </button>
                </div>
              </div>
            )}

            <div style={{ padding: '8px 16px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)' }}>
              <div style={{ fontSize: '11px' }}>
                <span style={{ color: 'var(--text-4)' }}>Muvaffaqiyatli: </span>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>{paymentStats.completedCount}</span>
              </div>
              <div style={{ fontSize: '11px' }}>
                <span style={{ color: 'var(--text-4)' }}>Muvaffaqiyatsiz: </span>
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>{paymentStats.failedCount}</span>
              </div>
              <div style={{ fontSize: '11px' }}>
                <span style={{ color: 'var(--text-4)' }}>Kutilmoqda: </span>
                <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>{paymentStats.pendingCount}</span>
              </div>
              <div style={{ fontSize: '11px', marginLeft: 'auto' }}>
                <span style={{ color: 'var(--text-4)' }}>Jami summa: </span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{fmt(paymentStats.total)} so'm</span>
              </div>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>#</th><th>Foydalanuvchi</th><th>Miqdor</th><th>Plan</th><th>Provider</th><th>Holat</th><th>Sana</th><th style={{ width: '40px' }}></th></tr></thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-4)' }}>To'lovlar yo'q</td></tr>
                  ) : filteredPayments.map(p => (
                    <>
                      <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedPay(expandedPay === p.id ? null : p.id)}>
                        <td style={{ color: 'var(--text-4)' }}>{p.id}</td>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--text-0)' }}>{p.user_name || '—'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{p.user_email || '—'}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-0)' }}>{p.amount.toLocaleString()} {p.currency}</td>
                        <td><span className="badge badge-yellow">{p.plan.toUpperCase()}</span></td>
                        <td style={{ color: 'var(--text-2)' }}>{p.provider}</td>
                        <td><span className={`badge ${statusColors[p.status] || 'badge-primary'}`}>{p.status}</span></td>
                        <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{new Date(p.created_at).toLocaleDateString('uz')}</td>
                        <td>{expandedPay === p.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                      </tr>
                      {expandedPay === p.id && (
                        <tr key={`${p.id}-detail`}>
                          <td colSpan={8} style={{ background: 'var(--bg-1)', padding: '12px 20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>To'lov ID</span><span style={{ fontSize: '13px', fontWeight: 600 }}>{p.id}</span></div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Foydalanuvchi</span><span style={{ fontSize: '13px', fontWeight: 600 }}>{p.user_name || '—'}</span></div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Email</span><span style={{ fontSize: '13px' }}>{p.user_email || '—'}</span></div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Summa</span><span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)' }}>{p.amount.toLocaleString()} {p.currency}</span></div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Plan</span><span style={{ fontSize: '13px' }}>{p.plan}</span></div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Provider</span><span style={{ fontSize: '13px' }}>{p.provider}</span></div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Holat</span><span className={`badge ${statusColors[p.status]}`}>{p.status}</span></div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Yaratilgan</span><span style={{ fontSize: '13px' }}>{new Date(p.created_at).toLocaleString('uz')}</span></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            {payTotalPages > 1 && (
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button className="btn btn-sm btn-ghost" disabled={payPage <= 1} onClick={() => setPayPage(p => p - 1)}>← Oldingi</button>
                <span style={{ fontSize: '13px', color: 'var(--text-3)', alignSelf: 'center' }}>{payPage} / {payTotalPages}</span>
                <button className="btn btn-sm btn-ghost" disabled={payPage >= payTotalPages} onClick={() => setPayPage(p => p + 1)}>Keyingi →</button>
              </div>
            )}
          </>
        ) : (
          <>
            {showFilters && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                  <input className="input" placeholder="Qidirish..." value={subSearch} onChange={e => setSubSearch(e.target.value)}
                    style={{ height: '28px', width: '150px', padding: '2px 10px 2px 28px', fontSize: '12px' }} />
                </div>
                <select className="input" value={subPlanFilter} onChange={e => setSubPlanFilter(e.target.value)}
                  style={{ height: '28px', padding: '2px 8px', fontSize: '12px' }}>
                  <option value="">Barcha planlar</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                  <option value="free">Bepul</option>
                </select>
                <select className="input" value={subStatusFilter} onChange={e => setSubStatusFilter(e.target.value as any)}
                  style={{ height: '28px', padding: '2px 8px', fontSize: '12px' }}>
                  <option value="">Barcha holatlar</option>
                  <option value="active">Faol</option>
                  <option value="inactive">Faol emas</option>
                </select>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-1)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border)' }}>
                  {(['all', 'today', 'week', 'month', 'custom'] as PeriodFilter[]).map(p => (
                    <button key={p} onClick={() => setSubPeriod(p)}
                      style={{ padding: '4px 10px', fontSize: '11px', fontWeight: subPeriod === p ? 600 : 400, color: subPeriod === p ? 'white' : 'var(--text-3)', background: subPeriod === p ? 'var(--primary)' : 'transparent', borderRadius: '4px', cursor: 'pointer', border: 'none', transition: 'all 0.15s' }}>
                      {periodLabel[p]}
                    </button>
                  ))}
                </div>
                {subPeriod === 'custom' && (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input className="input" type="date" value={subCustomFrom} onChange={e => setSubCustomFrom(e.target.value)} style={{ height: '28px', fontSize: '12px', width: '140px' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>—</span>
                    <input className="input" type="date" value={subCustomTo} onChange={e => setSubCustomTo(e.target.value)} style={{ height: '28px', fontSize: '12px', width: '140px' }} />
                  </div>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-4)', alignSelf: 'center' }}>
                    {filteredSubscriptions.length} ta • Faol: {subStats.active}
                  </span>
                  <button className="btn btn-ghost btn-sm" title="CSV yuklash" onClick={() => downloadFiltered('subscriptions')}>
                    <Download size={13} /> CSV
                  </button>
                </div>
              </div>
            )}

            <div style={{ padding: '8px 16px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)' }}>
              <div style={{ fontSize: '11px' }}>
                <span style={{ color: 'var(--text-4)' }}>Faol: </span>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>{subStats.active}</span>
              </div>
              <div style={{ fontSize: '11px' }}>
                <span style={{ color: 'var(--text-4)' }}>Faol emas: </span>
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>{subStats.inactive}</span>
              </div>
              {Object.entries(subStats.byPlan).map(([plan, count]) => (
                <div key={plan} style={{ fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-4)' }}>{plan.toUpperCase()}: </span>
                  <span style={{ fontWeight: 600 }}>{count}</span>
                </div>
              ))}
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>#</th><th>Foydalanuvchi</th><th>Plan</th><th>Holat</th><th>Boshlanish</th><th>Tugash</th><th style={{ width: '40px' }}></th></tr></thead>
                <tbody>
                  {filteredSubscriptions.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-4)' }}>Obunalar yo'q</td></tr>
                  ) : filteredSubscriptions.map(s => (
                    <>
                      <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedSub(expandedSub === s.id ? null : s.id)}>
                        <td style={{ color: 'var(--text-4)' }}>{s.id}</td>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--text-0)' }}>{s.user_name || '—'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{s.user_email || '—'}</div>
                        </td>
                        <td><span className={`badge ${s.plan === 'business' ? 'badge-purple' : s.plan === 'pro' ? 'badge-yellow' : 'badge-primary'}`}>{s.plan.toUpperCase()}</span></td>
                        <td>{s.is_active ? <span className="badge badge-green">Faol</span> : <span className="badge badge-red">Faol emas</span>}</td>
                        <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{new Date(s.starts_at).toLocaleDateString('uz')}</td>
                        <td style={{ color: s.expires_at && new Date(s.expires_at) < new Date() ? 'var(--red)' : 'var(--text-3)', fontSize: '12px' }}>
                          {s.expires_at ? new Date(s.expires_at).toLocaleDateString('uz') : '∞'}
                        </td>
                        <td>{expandedSub === s.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                      </tr>
                      {expandedSub === s.id && (
                        <tr key={`${s.id}-detail`}>
                          <td colSpan={7} style={{ background: 'var(--bg-1)', padding: '12px 20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Obuna ID</span><span style={{ fontSize: '13px', fontWeight: 600 }}>{s.id}</span></div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Foydalanuvchi</span><span style={{ fontSize: '13px', fontWeight: 600 }}>{s.user_name || '—'}</span></div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Email</span><span style={{ fontSize: '13px' }}>{s.user_email || '—'}</span></div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Plan</span><span className={`badge ${s.plan === 'business' ? 'badge-purple' : s.plan === 'pro' ? 'badge-yellow' : 'badge-primary'}`}>{s.plan.toUpperCase()}</span></div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Holat</span>{s.is_active ? <span className="badge badge-green">Faol</span> : <span className="badge badge-red">Faol emas</span>}</div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Boshlanish sanasi</span><span style={{ fontSize: '13px' }}>{new Date(s.starts_at).toLocaleString('uz')}</span></div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Tugash sanasi</span><span style={{ fontSize: '13px', color: s.expires_at && new Date(s.expires_at) < new Date() ? 'var(--red)' : 'var(--text-0)' }}>{s.expires_at ? new Date(s.expires_at).toLocaleString('uz') : 'Cheksiz'}</span></div>
                              <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-4)', display: 'block' }}>Qolgan kunlar</span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: s.expires_at ? (new Date(s.expires_at) < new Date() ? 'var(--red)' : 'var(--green)') : 'var(--text-3)' }}>
                                  {s.expires_at ? (() => { const d = Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / 86400000); return d < 0 ? `${Math.abs(d)} kun o'tgan` : `${d} kun`; })() : '∞'}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            {subTotalPages > 1 && (
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button className="btn btn-sm btn-ghost" disabled={subPage <= 1} onClick={() => setSubPage(p => p - 1)}>← Oldingi</button>
                <span style={{ fontSize: '13px', color: 'var(--text-3)', alignSelf: 'center' }}>{subPage} / {subTotalPages}</span>
                <button className="btn btn-sm btn-ghost" disabled={subPage >= subTotalPages} onClick={() => setSubPage(p => p + 1)}>Keyingi →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
