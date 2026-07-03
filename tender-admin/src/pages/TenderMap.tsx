import { useCallback, useEffect, useState } from 'react';
import { MapPin, TrendingUp, RefreshCw, Download, ExternalLink, BarChart3, DollarSign, FileText, Target, Activity, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';
import { tenderDetailApi, tendersApi, type AdminTender } from '../api/admin';

interface RegionStat { region: string; count: number }

const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function TenderMap() {
  const { addToast, setActiveTab } = useAdmin();
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionTenders, setRegionTenders] = useState<AdminTender[]>([]);
  const [loadingTenders, setLoadingTenders] = useState(false);
  const [sortBy, setSortBy] = useState<'count' | 'name'>('count');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRegions(await tenderDetailApi.byRegion());
    } catch {
      addToast('Xatolik', "Hudud statistikasi yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const loadRegionTenders = async (region: string) => {
    if (selectedRegion === region) { setSelectedRegion(null); return; }
    setSelectedRegion(region);
    setLoadingTenders(true);
    try {
      const res = await tendersApi.list({ region, per_page: 10 });
      setRegionTenders(res.data);
    } catch {
      addToast('Xatolik', 'Tenderlarni yuklashda xato', 'error');
    } finally {
      setLoadingTenders(false);
    }
  };

  const sorted = [...regions].sort((a, b) =>
    sortBy === 'count' ? b.count - a.count : a.region.localeCompare(b.region)
  );

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-4)' }} />
      </div>
    );
  }

  const total = regions.reduce((s, r) => s + r.count, 0);
  const mostActive = regions[0];
  const chartData = sorted.slice(0, 14);

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Tender xaritasi</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Hududlar bo'yicha tender taqsimoti — hududni bosing</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="input select" style={{ width: '140px', height: '32px', fontSize: '12px' }} value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="count">Soni bo'yicha</option>
            <option value="name">Nomi bo'yicha</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => exportCSV('hududlar.csv', ['Hudud', 'Tenderlar soni', 'Ulush %'], sorted.map(r => [r.region, r.count, total > 0 ? ((r.count / total) * 100).toFixed(1) : '0']))} disabled={regions.length === 0}>
            <Download size={13} /> CSV
          </button>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--teal)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: Activity, color: 'var(--yellow)' },
          { label: 'Win/Loss', tab: 'journal', icon: Trophy, color: 'var(--purple)' },
          { label: 'Narx strategiya', tab: 'pricing', icon: DollarSign, color: 'var(--red)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--green)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      <div className="grid-3 mb-24">
        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab?.('tenders')}>
          <div className="stat-label mb-8">Hududlar soni</div>
          <div className="stat-value">{regions.length}</div>
        </div>
        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab?.('tenders')}>
          <div className="stat-label mb-8">Jami tenderlar</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{total.toLocaleString()}</div>
        </div>
        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => mostActive && loadRegionTenders(mostActive.region)}>
          <div className="stat-label mb-8">Eng faol hudud</div>
          <div className="stat-value" style={{ fontSize: '18px', color: 'var(--green)' }}>{mostActive?.region ?? '—'}</div>
          {mostActive && <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{mostActive.count} ta tender</span>}
        </div>
      </div>

      {regions.length === 0 ? (
        <div className="card">
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
            <MapPin size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>Hudud ma'lumotlari topilmadi</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Tenderlar region maydonini to'ldiring</p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
            {sorted.map((r, i) => (
              <div key={r.region} className="card" style={{ cursor: 'pointer', border: selectedRegion === r.region ? '2px solid var(--primary)' : undefined, background: selectedRegion === r.region ? 'var(--primary-soft)' : undefined, transition: 'all 0.2s' }} onClick={() => loadRegionTenders(r.region)}>
                <div className="card-body">
                  <div className="flex-between mb-8">
                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <MapPin size={13} style={{ color: selectedRegion === r.region ? 'var(--primary)' : 'var(--text-3)' }} /> {r.region}
                    </span>
                    <span className="badge badge-blue">{r.count}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${total > 0 ? (r.count / (regions[0]?.count || 1)) * 100 : 0}%`, background: i === 0 ? 'var(--primary)' : i === 1 ? 'var(--teal)' : 'var(--border-3)', borderRadius: '4px', transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-4)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{total > 0 ? `${((r.count / total) * 100).toFixed(1)}% ulush` : ''}</span>
                    <span style={{ color: 'var(--primary)' }}>Bosing →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedRegion && (
            <div className="card mb-24" style={{ border: '1px solid var(--primary)', borderRadius: '12px' }}>
              <div className="card-header flex-between">
                <h3 style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} style={{ color: 'var(--primary)' }} /> {selectedRegion} — tenderlar
                </h3>
                <button className="btn btn-sm btn-ghost" onClick={() => setActiveTab?.('tenders')}>
                  <ExternalLink size={13} /> Hammasini ko'rish
                </button>
              </div>
              {loadingTenders ? (
                <div style={{ padding: '40px', textAlign: 'center' }}><RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text-4)' }} /></div>
              ) : regionTenders.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)', fontSize: '13px' }}>Tender topilmadi</div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ padding: '10px 16px' }}>Sarlavha</th>
                        <th style={{ padding: '10px 16px' }}>Tashkilot</th>
                        <th style={{ padding: '10px 16px' }}>Summa</th>
                        <th style={{ padding: '10px 16px' }}>Holat</th>
                        <th style={{ padding: '10px 16px' }}>Muddat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionTenders.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setActiveTab?.('tenders')}>
                          <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: '13px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                          <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-3)' }}>{t.organization ?? '—'}</td>
                          <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--green)', fontSize: '13px' }}>
                            {t.amount ? `${(t.amount / 1e6).toFixed(0)} mln` : '—'}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <span className={`badge ${t.status === 'active' ? 'badge-green' : 'badge-red'}`}>{t.status}</span>
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-4)' }}>
                            {t.deadline ? new Date(t.deadline).toLocaleDateString('uz') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3 style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={14} /> Hududlar bo'yicha tender soni
              </h3>
            </div>
            <div className="card-body">
              <div style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 50 }}>
                    <XAxis dataKey="region" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Tenderlar']} />
                    <Bar dataKey="count" name="Tenderlar" fill="var(--primary)" radius={[4, 4, 0, 0]} cursor="pointer"
                      onClick={(data: any) => { if (data?.region) loadRegionTenders(data.region); }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
