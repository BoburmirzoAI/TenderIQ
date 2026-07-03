import { useCallback, useEffect, useState } from 'react';
import { Trophy, BarChart3, RefreshCw, AlertCircle, Download, X, Eye, ExternalLink, TrendingUp, DollarSign, FileText, Target, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';
import { winLossApi, type TenderResultRead, type WinLossStats } from '../api/admin';

const fmtAmount = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${Math.round(n / 1e6)} mln`;
  return n.toLocaleString();
};

const fmtMln = (n: number) => {
  if (!n) return '0';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${Math.round(n / 1e6)} mln`;
  return n.toLocaleString();
};

const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function WinLossJournal() {
  const { addToast, setActiveTab } = useAdmin();
  const [results, setResults] = useState<TenderResultRead[]>([]);
  const [stats, setStats] = useState<WinLossStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'list' | 'stats'>('list');
  const [detail, setDetail] = useState<TenderResultRead | null>(null);
  const [filterSource, setFilterSource] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([winLossApi.list(200), winLossApi.stats()]);
      setResults(list);
      setStats(s);
    } catch {
      addToast('Xatolik', "Ma'lumot yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const filtered = results.filter(r => {
    if (search && !r.winner_name.toLowerCase().includes(search.toLowerCase()) && !(r.tender_title ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSource && (r.tender_source ?? '') !== filterSource) return false;
    return true;
  });

  const sources = [...new Set(results.map(r => r.tender_source).filter(Boolean))];

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
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>G'alaba/Mag'lubiyat Jurnali</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Tender natijalari va g'oliblar — qatorni bosing</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => exportCSV('natijalar.csv', ['Tender', "G'olib", 'STIR', 'Summa', 'Valyuta', 'Manba', 'Sana'], filtered.map(r => [r.tender_title ?? `#${r.tender_id}`, r.winner_name, r.winner_stir ?? '', r.winning_amount ?? '', r.currency ?? '', r.tender_source ?? '', r.created_at]))}>
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--teal)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: Activity, color: 'var(--yellow)' },
          { label: 'Narx strategiya', tab: 'pricing', icon: DollarSign, color: 'var(--red)' },
          { label: 'Pipeline', tab: 'pipeline', icon: TrendingUp, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--green)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      {stats && (
        <div className="grid-4 mb-24">
          {[
            { label: 'Jami natijalar', value: stats.total_results, color: 'var(--primary)', tab: '' },
            { label: 'Jami summa', value: fmtMln(stats.total_won_amount), color: 'var(--green)', tab: '' },
            { label: "O'rtacha g'alaba", value: fmtMln(stats.avg_winning_amount), color: 'var(--teal)', tab: '' },
            { label: 'Manba turlari', value: stats.by_source.length, color: 'var(--yellow)', tab: '' },
          ].map(s => (
            <div key={s.label} className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => setTab(tab === 'stats' ? 'list' : 'stats')}>
              <div className="stat-label mb-8">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="tabs mb-16">
        <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
          <Trophy size={14} /> Natijalar ro'yxati
        </button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          <BarChart3 size={14} /> Statistika
        </button>
      </div>

      {tab === 'list' && (
        <>
          <div className="card mb-16">
            <div className="card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input className="input" placeholder="G'olib yoki tender nomi..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px' }} />
              {sources.length > 0 && (
                <select className="input select" style={{ width: '140px' }} value={filterSource} onChange={e => setFilterSource(e.target.value)}>
                  <option value="">Barcha manbalar</option>
                  {sources.map(s => <option key={s} value={s!}>{s}</option>)}
                </select>
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-4)', alignSelf: 'center' }}>{filtered.length} ta</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 380px' : '1fr', gap: '16px' }}>
            <div className="card">
              {filtered.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
                  <AlertCircle size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p>Hozircha tender natijalari yo'q</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>Tender</th>
                        <th style={{ padding: '12px 16px' }}>G'olib</th>
                        <th style={{ padding: '12px 16px' }}>Summa</th>
                        <th style={{ padding: '12px 16px' }}>Manba</th>
                        <th style={{ padding: '12px 16px' }}>Sana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: detail?.id === r.id ? 'var(--bg-active)' : undefined }} onClick={() => setDetail(detail?.id === r.id ? null : r)}>
                          <td style={{ padding: '12px 16px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' }}>
                            {r.tender_title ?? `#${r.tender_id}`}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>{r.winner_name}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {r.winning_amount ? (
                              <span style={{ fontWeight: 600, color: 'var(--green)' }}>
                                {fmtAmount(r.winning_amount)} {r.currency}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className="badge badge-purple">{r.tender_source ?? '—'}</span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-4)' }}>{r.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {detail && (
              <div className="card" style={{ alignSelf: 'start', position: 'sticky', top: '80px' }}>
                <div className="card-header flex-between">
                  <h3 style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={14} style={{ color: 'var(--primary)' }} /> Natija tafsilotlari
                  </h3>
                  <button className="btn-icon" onClick={() => setDetail(null)}><X size={16} /></button>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '16px', background: 'var(--green-soft)', borderRadius: '10px', textAlign: 'center' }}>
                    <Trophy size={24} style={{ color: 'var(--green)', marginBottom: '4px' }} />
                    <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--green)' }}>
                      {detail.winning_amount ? `${fmtAmount(detail.winning_amount)} ${detail.currency ?? ''}` : 'Summa ko\'rsatilmagan'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>G'alaba summasi</div>
                  </div>

                  {[
                    { label: 'Tender', value: detail.tender_title ?? `#${detail.tender_id}` },
                    { label: "G'olib kompaniya", value: detail.winner_name },
                    { label: 'STIR', value: detail.winner_stir ?? '—' },
                    { label: 'Manba', value: detail.tender_source ?? '—' },
                    { label: 'Sana', value: detail.created_at },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-0)', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>{item.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-0)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{item.value}</span>
                    </div>
                  ))}

                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.('tenders')}>
                    <ExternalLink size={13} /> Tenderlar sahifasiga o'tish
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.('competitors')}>
                    <ExternalLink size={13} /> Raqobatchilar sahifasi
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'stats' && stats && (
        <div className="card">
          <div className="card-header"><h3 style={{ fontWeight: 700 }}>Manba bo'yicha natijalar</h3></div>
          {stats.by_source.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)', fontSize: '13px' }}>
              Ma'lumot yo'q
            </div>
          ) : (
            <div className="card-body" style={{ height: '300px', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.by_source}>
                  <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
