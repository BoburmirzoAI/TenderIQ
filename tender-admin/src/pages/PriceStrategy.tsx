import { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, MapPin, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';

interface Analysis {
  id: string;
  title: string;
  category: string;
  predicted: number;
  actual: number;
  ratio: number;
  rec: 'optimal' | 'high' | 'low';
}

const mockAnalyses: Analysis[] = [
  { id: 'T-1024', title: 'IT uskunalarni yetkazib berish', category: 'IT', predicted: 420000000, actual: 450000000, ratio: 0.93, rec: 'optimal' },
  { id: 'T-1031', title: 'Binoni ta\'mirlash ishlari', category: 'Qurilish', predicted: 1350000000, actual: 1200000000, ratio: 1.13, rec: 'high' },
  { id: 'T-1042', title: 'Dori vositalari sotib olish', category: 'Tibbiyot', predicted: 280000000, actual: 320000000, ratio: 0.88, rec: 'low' },
  { id: 'T-1055', title: 'Transport xizmatlari', category: 'Transport', predicted: 95000000, actual: 89000000, ratio: 1.07, rec: 'optimal' },
  { id: 'T-1063', title: 'Maktab inventari yetkazish', category: 'Ta\'lim', predicted: 160000000, actual: 156000000, ratio: 1.03, rec: 'optimal' },
  { id: 'T-1078', title: 'Yo\'l ta\'mirlash loyihasi', category: 'Qurilish', predicted: 3200000000, actual: 3500000000, ratio: 0.91, rec: 'low' },
  { id: 'T-1085', title: 'Server va tarmoq jihozlari', category: 'IT', predicted: 800000000, actual: 780000000, ratio: 1.03, rec: 'optimal' },
  { id: 'T-1091', title: 'Oziq-ovqat yetkazib berish', category: 'Oziq-ovqat', predicted: 210000000, actual: 195000000, ratio: 1.08, rec: 'high' },
];

const categoryStats = [
  { name: 'IT', avg: 615, median: 600, min: 420, max: 800, count: 12 },
  { name: 'Qurilish', avg: 2350, median: 1800, min: 450, max: 5200, count: 18 },
  { name: 'Tibbiyot', avg: 310, median: 290, min: 120, max: 680, count: 9 },
  { name: 'Transport', avg: 145, median: 130, min: 45, max: 320, count: 7 },
  { name: 'Ta\'lim', avg: 180, median: 160, min: 80, max: 350, count: 11 },
  { name: 'Oziq-ovqat', avg: 225, median: 200, min: 90, max: 410, count: 6 },
];

const regions = [
  'Toshkent', 'Samarqand', 'Buxoro', 'Farg\'ona', 'Andijon', 'Namangan', 'Qashqadaryo',
  'Surxondaryo', 'Navoiy', 'Xorazm', 'Jizzax', 'Sirdaryo', 'Toshkent viloyati', 'Qoraqalpog\'iston',
];

const regionStats = regions.map((name, i) => ({
  name,
  avg: [580, 320, 290, 410, 370, 350, 260, 230, 300, 210, 240, 220, 490, 180][i] || 300,
  median: [520, 280, 250, 360, 330, 310, 230, 200, 260, 180, 210, 190, 440, 150][i] || 260,
  min: [120, 80, 70, 90, 85, 75, 65, 55, 70, 50, 60, 55, 110, 40][i] || 70,
  max: [1800, 900, 850, 1200, 1100, 1000, 800, 750, 950, 680, 720, 700, 1600, 550][i] || 900,
  count: [28, 15, 12, 18, 14, 13, 9, 8, 11, 7, 8, 7, 22, 5][i] || 10,
}));

const historyEntries = [
  { id: 1, tender: 'IT uskunalarni yetkazib berish', myBid: 430000000, result: 'won', date: '2026-06-10' },
  { id: 2, tender: 'Binoni ta\'mirlash ishlari', myBid: 1280000000, result: 'lost', date: '2026-06-08' },
  { id: 3, tender: 'Dori vositalari sotib olish', myBid: 305000000, result: 'won', date: '2026-05-28' },
  { id: 4, tender: 'Transport xizmatlari', myBid: 92000000, result: 'pending', date: '2026-06-15' },
  { id: 5, tender: 'Maktab inventari yetkazish', myBid: 148000000, result: 'lost', date: '2026-05-20' },
  { id: 6, tender: 'Server va tarmoq jihozlari', myBid: 760000000, result: 'won', date: '2026-06-12' },
];

const fmtAmount = (n: number) => {
  const rounded = Math.round(n);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) {
    const mln = Math.round(n / 1000000);
    return `${mln.toLocaleString('ru-RU')} mln`;
  }
  return rounded.toLocaleString('ru-RU');
};

const recBadge = (rec: string) => {
  const cls = rec === 'optimal' ? 'badge-green' : rec === 'high' ? 'badge-yellow' : 'badge-red';
  const label = rec === 'optimal' ? 'Optimal' : rec === 'high' ? 'Yuqori' : 'Past';
  return <span className={`badge ${cls}`}>{label}</span>;
};

const tdStyle: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };

export default function PriceStrategy() {
  const { addToast: _addToast } = useAdmin();
  const [tab, setTab] = useState<'analysis' | 'category' | 'region' | 'history'>('analysis');
  const [detailAnalysis, setDetailAnalysis] = useState<Analysis | null>(null);

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Narx strategiyasi</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Narx tahlili va bid strategiyalari</p>
        </div>
      </div>

      <div className="tabs mb-24">
        <button className={`tab ${tab === 'analysis' ? 'active' : ''}`} onClick={() => setTab('analysis')}>Tender tahlili</button>
        <button className={`tab ${tab === 'category' ? 'active' : ''}`} onClick={() => setTab('category')}>Kategoriya statistikasi</button>
        <button className={`tab ${tab === 'region' ? 'active' : ''}`} onClick={() => setTab('region')}>Hudud statistikasi</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Mening tarixim</button>
      </div>

      {tab === 'analysis' && (
        <>
          <div className="card">
            <div className="table-wrap">
              <table className="table" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '220px' }} />
                  <col style={{ width: '110px' }} />
                  <col style={{ width: '130px' }} />
                  <col style={{ width: '130px' }} />
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '100px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={tdStyle}>Tender ID</th>
                    <th style={tdStyle}>Nomi</th>
                    <th style={tdStyle}>Kategoriya</th>
                    <th style={tdStyle}>Bashorat narx</th>
                    <th style={tdStyle}>Haqiqiy summa</th>
                    <th style={tdStyle}>Nisbat</th>
                    <th style={tdStyle}>Tavsiya</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAnalyses.map((a) => (
                    <tr
                      key={a.id}
                      style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onClick={() => setDetailAnalysis(a)}
                    >
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>{a.id}</td>
                      <td style={{ ...tdStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>{a.title}</td>
                      <td style={tdStyle}><span className="badge badge-primary">{a.category}</span></td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{fmtAmount(a.predicted)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{fmtAmount(a.actual)}</td>
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {a.ratio >= 1 ? <TrendingUp size={12} style={{ color: 'var(--green)' }} /> : <TrendingDown size={12} style={{ color: 'var(--red)' }} />}
                          {(a.ratio * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td style={tdStyle}>{recBadge(a.rec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {detailAnalysis && (
            <div className="modal-overlay" onClick={() => setDetailAnalysis(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
                <div className="modal-header">
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-0)', flex: 1, paddingRight: '12px' }}>{detailAnalysis.title}</h2>
                  <button className="btn btn-sm btn-ghost" onClick={() => setDetailAnalysis(null)}><X size={14} /></button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="grid-2" style={{ gap: '12px' }}>
                    <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Tender ID</div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '14px' }}>{detailAnalysis.id}</div>
                    </div>
                    <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Kategoriya</div>
                      <span className="badge badge-primary">{detailAnalysis.category}</span>
                    </div>
                    <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Bashorat qilingan narx</div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--blue)' }}>{fmtAmount(detailAnalysis.predicted)} so'm</div>
                    </div>
                    <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Haqiqiy summa</div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--green)' }}>{fmtAmount(detailAnalysis.actual)} so'm</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px', background: 'var(--bg-1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Bashorat aniqligi (nisbat)</div>
                      <div style={{ fontWeight: 700, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {detailAnalysis.ratio >= 1 ? <TrendingUp size={16} style={{ color: 'var(--green)' }} /> : <TrendingDown size={16} style={{ color: 'var(--red)' }} />}
                        {(detailAnalysis.ratio * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Tavsiya</div>
                      {recBadge(detailAnalysis.rec)}
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Farq</div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: detailAnalysis.actual > detailAnalysis.predicted ? 'var(--red)' : 'var(--green)' }}>
                        {detailAnalysis.actual > detailAnalysis.predicted ? '+' : '-'}{fmtAmount(Math.abs(detailAnalysis.actual - detailAnalysis.predicted))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => setDetailAnalysis(null)}>Yopish</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'category' && (
        <>
          <div className="grid-3 mb-24">
            {categoryStats.map((c) => (
              <div key={c.name} className="card">
                <div className="card-body">
                  <div className="flex-between mb-8">
                    <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>{c.name}</span>
                    <span className="badge badge-primary">{c.count} ta tender</span>
                  </div>
                  <div className="divider" style={{ margin: '12px 0' }} />
                  <div className="grid-2" style={{ gap: '10px' }}>
                    <div style={{ padding: '10px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <span className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>O'rtacha</span>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-0)' }}>{c.avg.toLocaleString('ru-RU')} mln</div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <span className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>Median</span>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-0)' }}>{c.median.toLocaleString('ru-RU')} mln</div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <span className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>Min</span>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green)' }}>{c.min.toLocaleString('ru-RU')} mln</div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <span className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>Max</span>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--red)' }}>{c.max.toLocaleString('ru-RU')} mln</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-0)' }}>Kategoriyalar bo'yicha o'rtacha narx (mln)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryStats}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === 'region' && (
        <>
          <div className="grid-3 mb-24">
            {regionStats.map((r) => (
              <div key={r.name} className="card">
                <div className="card-body">
                  <div className="flex-between mb-8">
                    <span style={{ fontWeight: 700, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} /> {r.name}
                    </span>
                    <span className="badge badge-cyan">{r.count} ta</span>
                  </div>
                  <div className="divider" style={{ margin: '12px 0' }} />
                  <div className="grid-2" style={{ gap: '10px' }}>
                    <div style={{ padding: '10px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <span className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>O'rtacha</span>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-0)' }}>{r.avg.toLocaleString('ru-RU')} mln</div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <span className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>Median</span>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-0)' }}>{r.median.toLocaleString('ru-RU')} mln</div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <span className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>Min</span>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green)' }}>{r.min.toLocaleString('ru-RU')} mln</div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <span className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>Max</span>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--red)' }}>{r.max.toLocaleString('ru-RU')} mln</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-0)' }}>Hududlar bo'yicha tender soni</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionStats}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === 'history' && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={tdStyle}>#</th>
                  <th style={tdStyle}>Tender</th>
                  <th style={tdStyle}>Mening taklifim</th>
                  <th style={tdStyle}>Natija</th>
                  <th style={tdStyle}>Sana</th>
                </tr>
              </thead>
              <tbody>
                {historyEntries.map((h) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>{h.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{h.tender}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{fmtAmount(h.myBid)} so'm</td>
                    <td style={tdStyle}>
                      <span className={`badge ${h.result === 'won' ? 'badge-green' : h.result === 'lost' ? 'badge-red' : 'badge-yellow'}`}>
                        {h.result === 'won' ? 'Yutildi' : h.result === 'lost' ? 'Yutqazildi' : 'Kutilmoqda'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-4)', fontSize: '13px' }}>{h.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
