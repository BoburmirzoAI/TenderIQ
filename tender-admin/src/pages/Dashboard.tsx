import { useState, useEffect, useCallback } from 'react';
import {
  Users, FileSearch, TrendingUp, Crown, Building, CreditCard,
  Play, Brain, Send, Database, RefreshCw, X, AlertTriangle, Check,
  ArrowUpRight, ArrowDownRight, Activity, Clock, Download,
  Eye, Bell, Shield, Zap, Server, ChevronRight, ExternalLink
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';
import { dashboardApi, auditApi, notificationsApi, infrastructureApi, type KPI, type ChartPoint, type PlanItem, type AuditEntry } from '../api/admin';

type ModalType = 'scraper' | 'ml' | 'broadcast' | 'backup' | null;

const PLAN_COLORS = ['var(--text-3)', 'var(--yellow)', 'var(--purple)'];

const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function Dashboard() {
  const { addToast, setActiveTab } = useAdmin();
  const [modal, setModal] = useState<ModalType>(null);
  const [actionLoading, setActionLoading] = useState<ModalType>(null);

  const [kpi, setKpi] = useState<KPI | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [planData, setPlanData] = useState<PlanItem[]>([]);
  const [auditRows, setAuditRows] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [chartPeriod, setChartPeriod] = useState(30);

  const [scraperSource, setScraperSource] = useState<'all' | 'uzex' | 'mc' | 'mygov'>('all');
  const [mlModel, setMlModel] = useState<'all' | 'price' | 'win' | 'risk' | 'similarity'>('all');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'pro' | 'business'>('all');

  const [dbInfo, setDbInfo] = useState<{ total_size_pretty: string; table_count: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [k, chart, plans, audit] = await Promise.all([
        dashboardApi.kpi(),
        dashboardApi.tenderChart(chartPeriod),
        dashboardApi.planChart(),
        auditApi.list({ per_page: 8 }),
      ]);
      setKpi(k);
      setChartData(chart);
      setPlanData(plans);
      setAuditRows(audit.data);

      try {
        const db = await infrastructureApi.dbStats();
        setDbInfo({ total_size_pretty: db.total_size_pretty, table_count: db.table_count });
      } catch {}
    } catch {
      addToast('Xatolik', "Ma'lumotlarni yuklashda xato", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, chartPeriod]);

  useEffect(() => { load(); }, [chartPeriod]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  const closeModal = () => {
    setModal(null);
    setBroadcastTitle('');
    setBroadcastMsg('');
    setBroadcastTarget('all');
  };

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;
    setActionLoading('broadcast');
    closeModal();
    try {
      const res = await notificationsApi.broadcast({
        title: broadcastTitle,
        message: broadcastMsg,
        channels: ['in_app'],
        target: broadcastTarget,
      });
      addToast('Yuborildi', `${res.data?.sent_to ?? 0} ta foydalanuvchiga xabar yuborildi`, 'success');
    } catch {
      addToast('Xatolik', 'Broadcast yuborishda xato', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const simulateAction = (type: ModalType, label: string) => {
    setActionLoading(type);
    closeModal();
    addToast('Bajarilmoqda', `${label}...`, 'info');
    setTimeout(() => {
      setActionLoading(null);
      addToast('Muvaffaqiyatli', label, 'success');
    }, 1500);
  };

  const navigateTo = (tab: string) => {
    if (setActiveTab) setActiveTab(tab);
  };

  const kpiCards = kpi ? [
    { label: 'Foydalanuvchilar', value: kpi.total_users, formatted: kpi.total_users.toLocaleString(), icon: Users, color: 'var(--blue)', bg: 'var(--blue-soft)', page: 'users', sub: `+${kpi.new_users_today} bugun` },
    { label: 'Faol Tenderlar', value: kpi.active_tenders, formatted: kpi.active_tenders.toLocaleString(), icon: FileSearch, color: 'var(--teal)', bg: 'var(--teal-soft)', page: 'tenders', sub: `${kpi.total_tenders} jami` },
    { label: 'Bugungi yangi', value: kpi.tenders_today, formatted: kpi.tenders_today.toLocaleString(), icon: TrendingUp, color: 'var(--green)', bg: 'var(--green-soft)', page: 'tenders', sub: 'Yangi tenderlar' },
    { label: 'Pro obunalar', value: kpi.pro_subscribers, formatted: kpi.pro_subscribers.toLocaleString(), icon: Crown, color: 'var(--yellow)', bg: 'var(--yellow-soft)', page: 'financials', sub: 'Aktiv obunalar' },
    { label: 'Business obunalar', value: kpi.business_subscribers, formatted: kpi.business_subscribers.toLocaleString(), icon: Building, color: 'var(--purple)', bg: 'var(--purple-soft)', page: 'financials', sub: 'Aktiv obunalar' },
    { label: 'Jami daromad', value: kpi.total_revenue, formatted: `${(kpi.total_revenue / 1_000_000).toFixed(1)}M`, icon: CreditCard, color: 'var(--orange)', bg: 'var(--orange-soft)', page: 'financials', sub: "so'm" },
  ] : [];

  const totalTendersInChart = chartData.reduce((s, d) => s + (d.uzex || 0) + (d.mc || 0) + (d.mygov || 0), 0);

  const scraperLabel = { all: 'Barcha scraperlar', uzex: 'UZEX', mc: 'MC.uz', mygov: 'MyGov' };
  const mlLabel = { all: 'Barcha modellar', price: 'PriceModel', win: 'WinModel', risk: 'RiskModel', similarity: 'SimilarityModel' };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Command Center</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Platformani bir qarashda nazorat qiling</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className={`btn btn-sm ${autoRefresh ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAutoRefresh(a => !a)}
          >
            {autoRefresh && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s ease-in-out infinite' }} />}
            <Activity size={13} /> {autoRefresh ? 'Jonli (15s)' : 'Jonli rejim'}
          </button>
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Yangilash
          </button>
        </div>
      </div>

      {loading && !kpi ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-3)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Yuklanmoqda...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards — clickable */}
          <div className="grid-6 mb-24">
            {kpiCards.map((card) => (
              <div key={card.label} className="card stat-card"
                onClick={() => navigateTo(card.page)}
                style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="flex-between mb-8">
                  <span className="stat-label">{card.label}</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <card.icon size={16} style={{ color: card.color }} />
                  </div>
                </div>
                <div className="stat-value">{card.formatted}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {card.sub}
                  <ArrowUpRight size={10} style={{ color: 'var(--green)' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }} className="mb-24">
            {/* Tender Chart */}
            <div className="card">
              <div className="card-header flex-between">
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Tender dinamikasi</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-4)', marginLeft: '8px' }}>Jami: {totalTendersInChart.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[7, 14, 30].map(d => (
                    <button key={d} onClick={() => setChartPeriod(d)} style={{
                      padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                      background: chartPeriod === d ? 'var(--primary-soft)' : 'transparent',
                      color: chartPeriod === d ? 'var(--primary)' : 'var(--text-4)',
                    }}>{d}k</button>
                  ))}
                </div>
              </div>
              <div className="card-body" style={{ height: '260px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gUzex" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gMc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--teal)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--teal)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gMygov" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--purple)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="uzex" stroke="var(--primary)" fill="url(#gUzex)" strokeWidth={2} name="UZEX" />
                    <Area type="monotone" dataKey="mc" stroke="var(--teal)" fill="url(#gMc)" strokeWidth={2} name="MC" />
                    <Area type="monotone" dataKey="mygov" stroke="var(--purple)" fill="url(#gMygov)" strokeWidth={2} name="MyGov" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie + Quick nav */}
            <div className="card">
              <div className="card-header flex-between">
                <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Obuna taqsimoti</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigateTo('financials')} style={{ fontSize: '11px' }}>
                  Batafsil <ChevronRight size={11} />
                </button>
              </div>
              <div className="card-body" style={{ height: '200px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                      {planData.map((_, i) => (
                        <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} stroke="var(--bg-1)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                {planData.map((p, i) => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                    <span style={{ color: 'var(--text-2)' }}>{p.name}: {p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid-4 mb-24">
            {[
              { icon: Users, label: 'Foydalanuvchilar', desc: `${kpi?.total_users ?? 0} ta`, page: 'users', color: 'var(--blue)' },
              { icon: FileSearch, label: 'Tenderlar', desc: `${kpi?.total_tenders ?? 0} ta`, page: 'tenders', color: 'var(--teal)' },
              { icon: Bell, label: 'Bildirishnomalar', desc: 'Xabarlar', page: 'notifications', color: 'var(--yellow)' },
              { icon: Shield, label: 'Rollar', desc: 'Ruxsatlar', page: 'roles_permissions', color: 'var(--red)' },
              { icon: Building, label: 'Kompaniyalar', desc: `${kpi?.total_companies ?? 0} ta`, page: 'companies', color: 'var(--green)' },
              { icon: CreditCard, label: "To'lovlar", desc: 'Moliya', page: 'financials', color: 'var(--orange)' },
              { icon: Server, label: 'Infratuzilma', desc: dbInfo ? `${dbInfo.total_size_pretty} · ${dbInfo.table_count} jadval` : 'DB', page: 'infrastructure', color: 'var(--purple)' },
              { icon: Activity, label: 'Faollik', desc: "So'nggi harakatlar", page: 'websocket_monitor', color: 'var(--primary)' },
            ].map(item => (
              <button key={item.page} onClick={() => navigateTo(item.page)}
                className="card" style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                  cursor: 'pointer', border: '1px solid var(--border)', width: '100%',
                  textAlign: 'left', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={16} style={{ color: item.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{item.desc}</div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-5)', flexShrink: 0 }} />
              </button>
            ))}
          </div>

          {/* Audit + Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }} className="mb-24">
            {/* Audit log */}
            <div className="card">
              <div className="card-header flex-between">
                <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>So'nggi harakatlar</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => exportCSV(
                    'audit_log.csv',
                    ['Vaqt', 'Admin', 'Harakat', 'Resurs', 'Tafsilot'],
                    auditRows.map(r => [r.created_at, r.admin_email || '', r.action, r.resource_type || '', r.details || ''])
                  )} disabled={auditRows.length === 0}>
                    <Download size={11} />
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => navigateTo('audit_log')}>
                    Hammasi <ChevronRight size={11} />
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Vaqt</th><th>Admin</th><th>Harakat</th><th>Resurs</th><th>Tafsilot</th></tr>
                  </thead>
                  <tbody>
                    {auditRows.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-4)', padding: '24px' }}>Ma'lumot yo'q</td></tr>
                    ) : auditRows.map((row) => (
                      <tr key={row.id} onClick={() => navigateTo('audit_log')} style={{ cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-0)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ color: 'var(--text-3)', fontSize: '11px', whiteSpace: 'nowrap' }}>{new Date(row.created_at).toLocaleTimeString('uz')}</td>
                        <td style={{ fontSize: '12px' }}>{row.admin_email || '—'}</td>
                        <td>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px',
                            background: row.action.includes('delete') ? 'rgba(248,81,73,0.12)' : row.action.includes('create') ? 'rgba(63,185,80,0.12)' : 'var(--primary-soft)',
                            color: row.action.includes('delete') ? 'var(--red)' : row.action.includes('create') ? 'var(--green)' : 'var(--primary)',
                          }}>{row.action}</span>
                        </td>
                        <td><span className="badge badge-primary">{row.resource_type || '—'}</span></td>
                        <td style={{ color: 'var(--text-3)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px' }}>{row.details || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header">
                <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Tez harakatlar</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {([
                  { id: 'broadcast' as ModalType, label: 'Broadcast yuborish', sub: 'Foydalanuvchilarga xabar', icon: Send, color: 'var(--primary)' },
                  { id: 'scraper' as ModalType, label: 'Scraper ishga tushirish', sub: 'UZEX, MC, MyGov', icon: Play, color: 'var(--green)' },
                  { id: 'ml' as ModalType, label: "ML modelni o'qitish", sub: 'PriceModel va boshqalar', icon: Brain, color: 'var(--purple)' },
                  { id: 'backup' as ModalType, label: 'DB backup', sub: 'PostgreSQL eksport', icon: Database, color: 'var(--orange)' },
                ]).map((action) => (
                  <button key={action.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                      background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border)',
                      cursor: actionLoading === action.id ? 'not-allowed' : 'pointer',
                      width: '100%', textAlign: 'left', transition: 'all 0.15s',
                      opacity: actionLoading === action.id ? 0.7 : 1,
                    }}
                    onClick={() => !actionLoading && setModal(action.id)}
                    disabled={!!actionLoading}
                    onMouseEnter={e => { if (!actionLoading) { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.background = `${action.color}08`; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-0)'; }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${action.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {actionLoading === action.id
                        ? <RefreshCw size={16} className="animate-spin" style={{ color: action.color }} />
                        : <action.icon size={16} style={{ color: action.color }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>{action.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{actionLoading === action.id ? 'Bajarilmoqda...' : action.sub}</div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-5)' }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Scraper Modal */}
      {modal === 'scraper' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={16} style={{ color: 'var(--green)' }} /> Scraper ishga tushirish
              </h3>
              <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {([{ val: 'all', label: 'Barchasi', desc: 'UZEX + MC.uz + MyGov' }, { val: 'uzex', label: 'UZEX', desc: 'uzex.uz' }, { val: 'mc', label: 'MC.uz', desc: 'mc.uz' }, { val: 'mygov', label: 'MyGov', desc: 'xarid.mygov.uz' }] as const).map(opt => (
                <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: scraperSource === opt.val ? 'var(--bg-active)' : 'var(--bg-0)', borderRadius: '8px', border: `1px solid ${scraperSource === opt.val ? 'var(--primary)' : 'var(--border-1)'}`, cursor: 'pointer' }}>
                  <input type="radio" name="scraper" value={opt.val} checked={scraperSource === opt.val} onChange={() => setScraperSource(opt.val)} style={{ accentColor: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Bekor qilish</button>
              <button className="btn btn-primary" style={{ background: 'var(--green)', borderColor: 'var(--green)' }}
                onClick={() => simulateAction('scraper', `${scraperLabel[scraperSource]} ishga tushirildi`)}>
                <Play size={14} /> Ishga tushirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ML Modal */}
      {modal === 'ml' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={16} style={{ color: 'var(--purple)' }} /> ML modelni qayta o'qitish
              </h3>
              <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '10px 14px', background: 'rgba(234,179,8,0.08)', borderRadius: '8px', border: '1px solid rgba(234,179,8,0.2)', display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--yellow)' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                O'qitish jarayoni 3–10 daqiqa davom etishi mumkin.
              </div>
              {([{ val: 'all', label: 'Barcha modellar', desc: 'Price, Win, Risk, Similarity' }, { val: 'price', label: 'PriceModel', desc: 'Narx bashorati' }, { val: 'win', label: 'WinModel', desc: "G'alaba ehtimoli" }, { val: 'risk', label: 'RiskModel', desc: 'Risk baholash' }, { val: 'similarity', label: 'SimilarityModel', desc: 'Tender moslik' }] as const).map(opt => (
                <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: mlModel === opt.val ? 'var(--bg-active)' : 'var(--bg-0)', borderRadius: '8px', border: `1px solid ${mlModel === opt.val ? 'var(--purple)' : 'var(--border-1)'}`, cursor: 'pointer' }}>
                  <input type="radio" name="ml" value={opt.val} checked={mlModel === opt.val} onChange={() => setMlModel(opt.val)} style={{ accentColor: 'var(--purple)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Bekor qilish</button>
              <button className="btn btn-primary" style={{ background: 'var(--purple)', borderColor: 'var(--purple)' }}
                onClick={() => simulateAction('ml', `${mlLabel[mlModel]} o'qitish boshlandi`)}>
                <Brain size={14} /> Boshlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {modal === 'broadcast' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={16} style={{ color: 'var(--primary)' }} /> Broadcast yuborish
              </h3>
              <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Kimga</label>
                <select className="input select" value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value as any)}>
                  <option value="all">Barcha foydalanuvchilar</option>
                  <option value="pro">Faqat Pro</option>
                  <option value="business">Faqat Business</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Sarlavha <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="input" placeholder="Xabar sarlavhasi..." value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Xabar matni <span style={{ color: 'var(--red)' }}>*</span></label>
                <textarea placeholder="Xabar matnini kiriting..." value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
                  style={{ width: '100%', minHeight: '100px', padding: '10px 12px', background: 'var(--bg-0)', border: '1px solid var(--border-1)', borderRadius: '8px', color: 'var(--text-0)', fontSize: '13px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Bekor qilish</button>
              <button className="btn btn-primary" disabled={!broadcastTitle.trim() || !broadcastMsg.trim()} onClick={sendBroadcast}>
                <Send size={14} /> Yuborish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Modal */}
      {modal === 'backup' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} style={{ color: 'var(--orange)' }} /> DB Backup yaratish
              </h3>
              <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(249,115,22,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Database size={26} style={{ color: 'var(--orange)' }} />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6' }}>
                PostgreSQL ma'lumotlar bazasining to'liq nusxasi yaratiladi va <strong style={{ color: 'var(--text-0)' }}>S3</strong> ga yuklanadi.
              </p>
              {dbInfo && (
                <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '8px' }}>
                  Baza hajmi: {dbInfo.total_size_pretty} · {dbInfo.table_count} jadval
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Bekor qilish</button>
              <button className="btn btn-primary" style={{ background: 'var(--orange)', borderColor: 'var(--orange)' }}
                onClick={() => simulateAction('backup', 'DB backup yaratildi va S3 ga yuklandi')}>
                <Check size={14} /> Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
