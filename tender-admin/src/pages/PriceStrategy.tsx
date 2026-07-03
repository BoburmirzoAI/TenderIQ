import { useCallback, useEffect, useState } from 'react';
import { TrendingUp, BarChart3, MapPin, RefreshCw, Search, Download, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';
import { priceStrategyApi, type PriceStrategyData } from '../api/admin';

const tdStyle: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };

export default function PriceStrategy() {
  const { addToast, setActiveTab } = useAdmin();
  const [data, setData] = useState<PriceStrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'category' | 'region' | 'history'>('category');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await priceStrategyApi.data());
    } catch {
      addToast('Xatolik', "Narx strategiyasi yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const filteredCategories = (data?.by_category ?? []).filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const filteredRegions = (data?.by_region ?? []).filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));
  const filteredHistory = (data?.bid_history ?? []).filter(h => !search || h.tender_title.toLowerCase().includes(search.toLowerCase()) || h.status.toLowerCase().includes(search.toLowerCase()));

  const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (tab === 'category') {
      exportCSV('kategoriya_narxlari.csv', ['Kategoriya', 'Soni', "O'rtacha", 'Min', 'Max'], filteredCategories.map(c => [c.name, c.count, c.avg.toFixed(0), c.min_val.toFixed(0), c.max_val.toFixed(0)]));
    } else if (tab === 'region') {
      exportCSV('hudud_narxlari.csv', ['Hudud', 'Soni', "O'rtacha"], filteredRegions.map(r => [r.name, r.count, r.avg.toFixed(0)]));
    } else {
      exportCSV('bid_tarixi.csv', ['ID', 'Tender', 'Taklif summasi', 'Holat', 'Sana'], filteredHistory.map(h => [h.id, h.tender_title, h.bid_amount ?? '', h.status, h.created_at]));
    }
  };

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
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Narx strategiyasi</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Tender narxlari tahlili va bid tarixi</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.('calculator')}><ExternalLink size={13} /> Kalkulyator</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.('tender_map')}><ExternalLink size={13} /> Xarita</button>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
          <button className="btn btn-ghost btn-sm" onClick={handleExport} title="CSV yuklash"><Download size={13} /> CSV</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Tenderlar', tab: 'tenders', icon: TrendingUp, color: 'var(--teal)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: Search, color: 'var(--yellow)' },
          { label: 'Win/Loss', tab: 'journal', icon: TrendingUp, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: Download, color: 'var(--green)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      <div className="card mb-16">
        <div className="card-body" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="input" style={{ paddingLeft: '36px' }} placeholder="Kategoriya, hudud yoki tender nomi..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="tabs mb-24">
        <button className={`tab ${tab === 'category' ? 'active' : ''}`} onClick={() => setTab('category')}>Kategoriya statistikasi</button>
        <button className={`tab ${tab === 'region' ? 'active' : ''}`} onClick={() => setTab('region')}>Hudud statistikasi</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Bid tarixi</button>
      </div>

      {tab === 'category' && (
        <>
          {filteredCategories.length === 0 ? (
            <div className="card">
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
                <BarChart3 size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p>Kategoriya ma'lumotlari yo'q</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid-3 mb-24">
                {filteredCategories.map(c => (
                  <div key={c.name} className="card">
                    <div className="card-body">
                      <div className="flex-between mb-8">
                        <span style={{ fontWeight: 700 }}>{c.name}</span>
                        <span className="badge badge-primary">{c.count} ta</span>
                      </div>
                      <div className="divider" style={{ margin: '10px 0' }} />
                      <div className="grid-2" style={{ gap: '8px' }}>
                        {[
                          { label: "O'rtacha", value: c.avg, color: 'var(--text-0)' },
                          { label: 'Min', value: c.min_val, color: 'var(--green)' },
                          { label: 'Max', value: c.max_val, color: 'var(--red)' },
                        ].map(s => (
                          <div key={s.label} style={{ padding: '8px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '10px', color: 'var(--text-4)', marginBottom: '2px' }}>{s.label}</div>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: s.color }}>{s.value.toFixed(0)} mln</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-header"><h3 style={{ fontWeight: 700, fontSize: '14px' }}>Kategoriyalar bo'yicha o'rtacha narx (mln so'm)</h3></div>
                <div className="card-body">
                  <div style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={filteredCategories} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number) => [`${v.toFixed(0)} mln`, "O'rtacha"]} />
                        <Bar dataKey="avg" name="O'rtacha" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'region' && (
        <>
          {filteredRegions.length === 0 ? (
            <div className="card">
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
                <MapPin size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p>Hudud ma'lumotlari yo'q</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid-3 mb-24">
                {filteredRegions.map(r => (
                  <div key={r.name} className="card">
                    <div className="card-body flex-between">
                      <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} style={{ color: 'var(--primary)' }} /> {r.name}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-0)' }}>{r.avg.toFixed(0)} mln</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{r.count} ta tender</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-header"><h3 style={{ fontWeight: 700, fontSize: '14px' }}>Hududlar bo'yicha tender soni</h3></div>
                <div className="card-body">
                  <div style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={filteredRegions} margin={{ top: 8, right: 16, left: 8, bottom: 40 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" name="Tenderlar" fill="var(--teal)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'history' && (
        <div className="card">
          {filteredHistory.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
              <TrendingUp size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>Bid tarixi yo'q</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={tdStyle}>#</th>
                    <th style={tdStyle}>Tender</th>
                    <th style={tdStyle}>Taklif summasi</th>
                    <th style={tdStyle}>Holat</th>
                    <th style={tdStyle}>Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>{h.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, fontSize: '13px' }}>{h.tender_title}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--green)' }}>
                        {h.bid_amount != null ? `${h.bid_amount} mln so'm` : '—'}
                      </td>
                      <td style={tdStyle}>
                        <span className={`badge ${h.status === 'won' ? 'badge-green' : h.status === 'lost' ? 'badge-red' : 'badge-yellow'}`}>
                          {h.status === 'won' ? 'Yutildi' : h.status === 'lost' ? 'Yutqazildi' : h.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text-4)', fontSize: '12px' }}>{h.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
