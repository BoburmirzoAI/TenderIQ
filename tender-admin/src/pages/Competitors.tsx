import { useCallback, useEffect, useState } from 'react';
import { Swords, TrendingUp, Search, RefreshCw, Download, ExternalLink, BarChart3, DollarSign, FileText, Target, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';
import { competitorsApi, type CompetitorOverview, type CompetitorStat } from '../api/admin';

const PIE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

const fmtAmount = (n: number) => {
  if (!n) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} mln`;
  return n.toLocaleString();
};

export default function Competitors() {
  const { addToast, setActiveTab } = useAdmin();
  const [data, setData] = useState<CompetitorOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'list' | 'analytics'>('list');
  const [detail, setDetail] = useState<CompetitorStat | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await competitorsApi.overview(30));
    } catch {
      addToast('Xatolik', "Raqobatchilar yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const filtered = (data?.top ?? []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.stir ?? '').includes(search)
  );

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-4)' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Raqobatchilar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Tender g'oliblar tahlili</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const headers = ['Kompaniya', 'STIR', "G'alabalar", 'Umumiy summa', "O'rt. summa", "Oxirgi g'alaba"];
            const rows = filtered.map(c => [c.name, c.stir ?? '', c.wins, c.total_amount, c.avg_amount, c.last_win ?? '']);
            const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'raqobatchilar.csv'; a.click();
            URL.revokeObjectURL(url);
          }} disabled={filtered.length === 0}><Download size={13} /> Yuklab olish</button>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
          <div className="tabs">
            <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>Ro'yxat</button>
            <button className={`tab ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>Tahlil</button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--teal)' },
          { label: 'Win/Loss', tab: 'journal', icon: Activity, color: 'var(--purple)' },
          { label: 'Narx strategiya', tab: 'pricing', icon: DollarSign, color: 'var(--red)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--green)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <>
          <div className="grid-4 mb-24">
            {[
              { label: 'Jami kompaniyalar', value: data?.total_companies ?? 0, color: 'var(--primary)', icon: Swords },
              { label: "Jami g'olib tenderlar", value: data?.total_tenders ?? 0, color: 'var(--green)', icon: TrendingUp },
              { label: "O'rt. summa",           value: fmtAmount(data?.avg_amount ?? 0), color: 'var(--teal)', icon: TrendingUp },
              { label: "Top 1",                 value: data?.top[0]?.name ?? '—', color: 'var(--yellow)', icon: Swords },
            ].map(s => (
              <div key={s.label} className="card stat-card">
                <div className="stat-label mb-8">{s.label}</div>
                <div className="stat-value" style={{ color: s.color, fontSize: String(s.value).length > 10 ? '14px' : undefined }}>{s.value}</div>
              </div>
            ))}
          </div>

          {(data?.total_companies ?? 0) === 0 ? (
            <div className="card">
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
                <Swords size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p>Tender natijalari (g'oliblar) hali kiritilmagan</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header flex-between">
                <span style={{ fontWeight: 700 }}>Top g'olib kompaniyalar</span>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                  <input className="input" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: '30px', width: '220px', height: '32px' }} />
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 16px' }}>#</th>
                      <th style={{ padding: '12px 16px' }}>Kompaniya</th>
                      <th style={{ padding: '12px 16px' }}>STIR</th>
                      <th style={{ padding: '12px 16px' }}>G'alabalar</th>
                      <th style={{ padding: '12px 16px' }}>Umumiy summa</th>
                      <th style={{ padding: '12px 16px' }}>O'rt. summa</th>
                      <th style={{ padding: '12px 16px' }}>Oxirgi g'alaba</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => (
                      <tr key={c.name} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setDetail(c)}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: i < 3 ? 'var(--yellow)' : 'var(--text-4)', fontSize: '14px' }}>
                          {i + 1}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '13px' }}>{c.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-4)', fontFamily: 'monospace' }}>{c.stir ?? '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--green)' }}>{c.wins}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>{fmtAmount(c.total_amount)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-3)' }}>{fmtAmount(c.avg_amount)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-4)' }}>{c.last_win ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'analytics' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3 style={{ fontWeight: 700, fontSize: '14px' }}>Top 10 kompaniya (g'alabalar)</h3></div>
            <div className="card-body">
              {(data?.top.length ?? 0) === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-4)' }}>Ma'lumot yo'q</div>
              ) : (
                <div style={{ minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data?.top.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip formatter={(v: number) => [v, "G'alabalar"]} />
                      <Bar dataKey="wins" fill="var(--green)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 style={{ fontWeight: 700, fontSize: '14px' }}>Kategoriya bo'yicha tenderlar</h3></div>
            <div className="card-body">
              {(data?.by_category.length ?? 0) === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-4)' }}>Ma'lumot yo'q</div>
              ) : (
                <div style={{ minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={data?.by_category} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="name"
                        label={({ name, count }: { name: string; count: number }) => `${name}: ${count}`}>
                        {(data?.by_category ?? []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>{detail.name}</h3>
              <button className="btn-icon" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="grid-3">
                <div style={{ textAlign: 'center', padding: '16px', background: 'var(--green-soft)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--green)' }}>{detail.wins}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>G'alabalar</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: 'var(--primary-soft)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>{fmtAmount(detail.total_amount)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Jami summa</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: 'var(--teal-soft)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--teal)' }}>{fmtAmount(detail.avg_amount)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>O'rt. summa</div>
                </div>
              </div>
              {detail.stir && <div style={{ padding: '10px 14px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>STIR</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{detail.stir}</div>
              </div>}
              {detail.last_win && <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Oxirgi g'alaba: {detail.last_win}</div>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => { setDetail(null); setActiveTab?.('journal'); }}>
                  <ExternalLink size={13} /> Jurnal
                </button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => { setDetail(null); setActiveTab?.('tenders'); }}>
                  <ExternalLink size={13} /> Tenderlar
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
