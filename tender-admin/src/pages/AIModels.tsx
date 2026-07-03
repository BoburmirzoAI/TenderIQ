import { useCallback, useEffect, useState } from 'react';
import { Brain, BarChart3, Calculator, TrendingUp, Cpu, RefreshCw, AlertCircle, ExternalLink, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';
import {
  aiModelsApi,
  type AIStats,
  type AIPredictionItem,
  type AIDailyUsage,
  type AITopUser,
  type AIPriceEstimate,
} from '../api/admin';

const categories = ['IT', 'Qurilish', 'Tibbiyot', 'Transport', "Ta'lim", 'Oziq-ovqat'];
const regions = ['Toshkent', 'Samarqand', 'Buxoro', "Farg'ona", 'Andijon', 'Navoiy', 'Namangan'];

const fmtMln = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)} mlrd` : `${n.toFixed(0)} mln`;

const statusBadge = (s: string) => {
  const cls = s === 'submitted' ? 'badge-blue' : s === 'won' ? 'badge-green' : s === 'lost' ? 'badge-red' : 'badge-purple';
  return <span className={`badge ${cls}`}>{s}</span>;
};

export default function AIModels() {
  const { addToast, setActiveTab } = useAdmin();
  const [tab, setTab] = useState<'predictions' | 'history' | 'stats' | 'predict'>('predictions');

  const [stats, setStats] = useState<AIStats | null>(null);
  const [predictions, setPredictions] = useState<AIPredictionItem[]>([]);
  const [dailyUsage, setDailyUsage] = useState<AIDailyUsage[]>([]);
  const [topUsers, setTopUsers] = useState<AITopUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [predCategory, setPredCategory] = useState('IT');
  const [predRegion, setPredRegion] = useState('Toshkent');
  const [predAmountMin, setPredAmountMin] = useState('100');
  const [predAmountMax, setPredAmountMax] = useState('500');
  const [predResult, setPredResult] = useState<AIPriceEstimate | null>(null);
  const [predLoading, setPredLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [s, preds, daily, top] = await Promise.all([
        aiModelsApi.stats(),
        aiModelsApi.predictions(),
        aiModelsApi.dailyUsage(7),
        aiModelsApi.topUsers(),
      ]);
      setStats(s);
      setPredictions(preds);
      setDailyUsage(daily);
      setTopUsers(top);
    } catch {
      addToast('Xatolik', "Ma'lumot yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadStats(); }, []);

  const runPrediction = async () => {
    setPredLoading(true);
    try {
      const res = await aiModelsApi.predictPrice({
        category: predCategory,
        region: predRegion,
        amount_min_mln: parseFloat(predAmountMin) || 100,
        amount_max_mln: parseFloat(predAmountMax) || 500,
      });
      setPredResult(res);
      addToast('Bashorat', 'Narx bashorati muvaffaqiyatli bajarildi', 'success');
    } catch {
      addToast('Xatolik', "Bashorat qilishda xato", 'error');
    } finally {
      setPredLoading(false);
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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>AI Bashoratlar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>AI bashorat natijalari va foydalanish statistikasi</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.('calculator')}><ExternalLink size={13} /> Kalkulyator</button>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const rows = predictions.map(p => [p.id, p.user_email ?? `User #${p.user_id}`, p.tender_title ?? `Tender #${p.tender_id}`, p.amount, p.predicted_amount ?? '', p.confidence ?? '', p.status, p.created_at]);
            const csv = [['ID', 'Foydalanuvchi', 'Tender', 'Summa', 'ML Bashorat', 'Ishonch', 'Status', 'Sana'].join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'ai_bashoratlar.csv'; a.click();
            URL.revokeObjectURL(url);
          }}><Download size={13} /> CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={loadStats}><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Tenderlar', tab: 'tenders', icon: TrendingUp, color: 'var(--teal)' },
          { label: 'Narx strategiya', tab: 'pricing', icon: Calculator, color: 'var(--red)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: Brain, color: 'var(--yellow)' },
          { label: 'Win/Loss', tab: 'journal', icon: TrendingUp, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: BarChart3, color: 'var(--green)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid-4 mb-24">
          {[
            { label: 'Jami bashoratlar',    value: stats.total_predictions,    color: 'var(--primary)' },
            { label: 'ML bashoratlar',       value: stats.predictions_with_ml,  color: 'var(--green)' },
            { label: "Tender moslamalar",    value: stats.total_matches,        color: 'var(--teal)' },
            { label: 'O\'rt. moslik balli',  value: stats.avg_match_score.toFixed(2), color: 'var(--yellow)' },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-label mb-8">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="tabs mb-24">
        <button className={`tab ${tab === 'predictions' ? 'active' : ''}`} onClick={() => setTab('predictions')}>
          <TrendingUp size={14} /> Bashoratlar
        </button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          <Brain size={14} /> Tarix
        </button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          <BarChart3 size={14} /> Statistika
        </button>
        <button className={`tab ${tab === 'predict' ? 'active' : ''}`} onClick={() => setTab('predict')}>
          <Calculator size={14} /> Narx bashorat
        </button>
      </div>

      {/* ── PREDICTIONS TAB ── */}
      {tab === 'predictions' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>
              ML bashoratli arizalar
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-4)', marginLeft: '8px' }}>
                ({predictions.filter(p => p.predicted_amount != null).length} ta)
              </span>
            </h3>
          </div>
          {predictions.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
              <Brain size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>Hozircha ML bashoratli ariza yo'q</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Foydalanuvchilar ariza topshirganda bu yerda ko'rinadi</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>ID</th>
                    <th style={{ padding: '12px 16px' }}>Foydalanuvchi</th>
                    <th style={{ padding: '12px 16px' }}>Tender</th>
                    <th style={{ padding: '12px 16px' }}>Ariza summa</th>
                    <th style={{ padding: '12px 16px' }}>ML bashorat</th>
                    <th style={{ padding: '12px 16px' }}>Ishonch</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>#{p.id}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>{p.user_email ?? `User #${p.user_id}`}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.tender_title ?? `Tender #${p.tender_id}`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{fmtMln(p.amount / 1_000_000)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {p.predicted_amount ? fmtMln(p.predicted_amount / 1_000_000) : <span style={{ color: 'var(--text-4)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {p.confidence != null ? (
                          <span className={`badge ${p.confidence >= 80 ? 'badge-green' : p.confidence >= 60 ? 'badge-yellow' : 'badge-red'}`}>
                            {Math.round(p.confidence)}%
                          </span>
                        ) : <span style={{ color: 'var(--text-4)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{statusBadge(p.status)}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-4)' }}>{p.created_at.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Barcha arizalar tarixi</h3>
          </div>
          {predictions.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
              <AlertCircle size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>Hozircha ariza yo'q</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>ID</th>
                    <th style={{ padding: '12px 16px' }}>Foydalanuvchi</th>
                    <th style={{ padding: '12px 16px' }}>Tender</th>
                    <th style={{ padding: '12px 16px' }}>Summa</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>#{p.id}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>{p.user_email ?? `User #${p.user_id}`}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.tender_title ?? `Tender #${p.tender_id}`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{fmtMln(p.amount / 1_000_000)}</td>
                      <td style={{ padding: '12px 16px' }}>{statusBadge(p.status)}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-4)' }}>{p.created_at.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── STATS TAB ── */}
      {tab === 'stats' && (
        <>
          <div className="grid-2 mb-24">
            <div className="card">
              <div className="card-header"><h3>Kunlik foydalanish (so'nggi 7 kun)</h3></div>
              <div className="card-body" style={{ height: '280px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyUsage}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3>Top foydalanuvchilar</h3></div>
              {topUsers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)', fontSize: '13px' }}>
                  Hozircha ma'lumot yo'q
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>#</th>
                        <th style={{ padding: '12px 16px' }}>Foydalanuvchi</th>
                        <th style={{ padding: '12px 16px' }}>Arizalar</th>
                        <th style={{ padding: '12px 16px' }}>Ulush</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topUsers.map((u, i) => {
                        const maxCount = topUsers[0]?.count || 1;
                        const totalCount = topUsers.reduce((s, x) => s + x.count, 0) || 1;
                        return (
                          <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 16px' }}>{i + 1}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px' }}><strong>{u.email}</strong></td>
                            <td style={{ padding: '12px 16px' }}>{u.count}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-2)' }}>
                                  <div style={{ width: `${(u.count / maxCount) * 100}%`, height: '100%', borderRadius: 3, background: 'var(--primary)' }} />
                                </div>
                                <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>
                                  {Math.round((u.count / totalCount) * 100)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* System info */}
          <div className="card">
            <div className="card-header"><h3>Tizim ma'lumotlari</h3></div>
            <div className="card-body">
              <div className="grid-4" style={{ gap: '12px' }}>
                {[
                  { label: 'Jami tenderlar (summa bilan)',  value: stats?.tenders_with_amount ?? 0 },
                  { label: 'O\'rt. moslik balli',           value: stats?.avg_match_score.toFixed(3) ?? 0 },
                  { label: 'Jami moslamalar',               value: stats?.total_matches ?? 0 },
                  { label: 'ML arizalar ulushi',
                    value: stats && stats.total_predictions > 0
                      ? `${Math.round((stats.predictions_with_ml / stats.total_predictions) * 100)}%`
                      : '—' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-0)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border-1)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '8px' }}>{s.label}</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-0)' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── PREDICT TAB ── */}
      {tab === 'predict' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3>Narx bashorat parametrlari</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Kategoriya</label>
                <select className="input select" value={predCategory} onChange={e => setPredCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Hudud</label>
                <select className="input select" value={predRegion} onChange={e => setPredRegion(e.target.value)}>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Min summa (mln)</label>
                  <input className="input" type="number" value={predAmountMin} onChange={e => setPredAmountMin(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Max summa (mln)</label>
                  <input className="input" type="number" value={predAmountMax} onChange={e => setPredAmountMax(e.target.value)} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={runPrediction} disabled={predLoading}>
                {predLoading ? <RefreshCw size={14} className="animate-spin" /> : <Cpu size={14} />}
                Bashorat qilish
              </button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Natija</h3></div>
            <div className="card-body">
              {predResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'var(--green-soft)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                    <span className="stat-label">Bashorat qilingan narx oralig'i</span>
                    <div className="stat-value" style={{ color: 'var(--green)', marginTop: '8px' }}>
                      {fmtMln(predResult.amount_min_mln)} – {fmtMln(predResult.amount_max_mln)}
                    </div>
                  </div>
                  <div className="grid-2">
                    <div style={{ background: 'var(--blue-soft)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
                      <span className="stat-label">Ishonch darajasi</span>
                      <div className="stat-value" style={{ fontSize: '20px', color: 'var(--blue)', marginTop: '8px' }}>{predResult.confidence}%</div>
                    </div>
                    <div style={{ background: 'var(--purple-soft)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
                      <span className="stat-label">Tahlil asosi</span>
                      <div className="stat-value" style={{ fontSize: '14px', color: 'var(--purple)', marginTop: '8px' }}>
                        {predResult.sample_count > 0 ? `${predResult.sample_count} ta tender` : "Kiritilgan oraliq"}
                      </div>
                    </div>
                  </div>
                  {predResult.avg_tender_amount_mln && (
                    <div style={{ fontSize: '12px', color: 'var(--text-4)', padding: '10px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      O'rtacha tarixiy summa: <strong>{fmtMln(predResult.avg_tender_amount_mln)} so'm</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--text-4)', padding: '10px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    Kategoriya: <strong>{predResult.category}</strong> | Hudud: <strong>{predResult.region}</strong>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)' }}>
                  <Brain size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p>Bashorat qilish uchun parametrlarni kiriting va tugmani bosing</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
