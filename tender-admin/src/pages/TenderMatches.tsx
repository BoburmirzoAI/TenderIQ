import { useCallback, useEffect, useState } from 'react';
import { Target, RefreshCw, Bell, AlertCircle, Download, BarChart3, Activity, FileText, TrendingUp, GitBranch, Brain } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { tenderMatchesApi, type AdminTenderMatch, type TenderMatchStats } from '../api/admin';

const scoreColor = (s: number) =>
  s >= 0.8 ? 'var(--green)' : s >= 0.6 ? 'var(--yellow)' : 'var(--red)';

const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function TenderMatches() {
  const { addToast, setActiveTab } = useAdmin();
  const [matches, setMatches] = useState<AdminTenderMatch[]>([]);
  const [stats, setStats] = useState<TenderMatchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState('');
  const [filterSaved, setFilterSaved] = useState<'all' | 'saved' | 'unsaved'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: { min_score?: number; is_saved?: boolean } = {};
      if (minScore) params.min_score = parseFloat(minScore);
      if (filterSaved === 'saved') params.is_saved = true;
      if (filterSaved === 'unsaved') params.is_saved = false;
      const [list, s] = await Promise.all([
        tenderMatchesApi.list(params),
        tenderMatchesApi.stats(),
      ]);
      setMatches(list);
      setStats(s);
    } catch {
      addToast('Xatolik', "Ma'lumot yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, minScore, filterSaved]);

  useEffect(() => { load(); }, []);

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
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Tender Moslamalar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>ML orqali aniqlangan kompaniya–tender moslamalari</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => exportCSV('tender_moslamalar.csv', ['Tender', 'Kompaniya', 'Ball', 'Matn ball', 'Kategoriya ball', 'Xabarlandi', 'Saqlangan', 'Sana'], matches.map(m => [m.tender_title ?? `#${m.tender_id}`, m.company_name ?? `#${m.company_id}`, m.score.toFixed(3), m.text_score?.toFixed(3) ?? '', m.category_score?.toFixed(3) ?? '', m.is_notified ? 'Ha' : 'Yoq', m.is_saved ? 'Ha' : 'Yoq', m.created_at]))}>
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--teal)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'AI bashorat', tab: 'ai', icon: Brain, color: 'var(--purple)' },
          { label: 'Pipeline', tab: 'pipeline', icon: GitBranch, color: 'var(--yellow)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: Activity, color: 'var(--red)' },
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
            { label: 'Jami moslamalar',  value: stats.total_matches,                    color: 'var(--primary)' },
            { label: "Yuqori ball (≥0.7)", value: stats.high_score_count,              color: 'var(--green)' },
            { label: "O'rtacha ball",     value: stats.avg_score.toFixed(3),            color: 'var(--teal)' },
            { label: 'Saqlangan',         value: stats.saved,                           color: 'var(--yellow)' },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-label mb-8">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card mb-16">
        <div className="card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-3)' }}>Min ball:</label>
            <input
              className="input" type="number" min="0" max="1" step="0.1"
              style={{ width: '80px' }} placeholder="0.5"
              value={minScore} onChange={e => setMinScore(e.target.value)}
            />
          </div>
          <select className="input select" style={{ width: '150px' }} value={filterSaved} onChange={e => setFilterSaved(e.target.value as 'all'|'saved'|'unsaved')}>
            <option value="all">Barcha</option>
            <option value="saved">Saqlangan</option>
            <option value="unsaved">Saqlanmagan</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={load}>Qidirish</button>
          <span style={{ fontSize: '12px', color: 'var(--text-4)', alignSelf: 'center' }}>{matches.length} ta natija</span>
        </div>
      </div>

      <div className="card">
        {matches.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
            <AlertCircle size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>Hozircha moslamalar yo'q</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px' }}>Tender</th>
                  <th style={{ padding: '12px 16px' }}>Kompaniya</th>
                  <th style={{ padding: '12px 16px' }}>Ball</th>
                  <th style={{ padding: '12px 16px' }}>Matn</th>
                  <th style={{ padding: '12px 16px' }}>Kategoriya</th>
                  <th style={{ padding: '12px 16px' }}>Xabarlandi</th>
                  <th style={{ padding: '12px 16px' }}>Saqlangan</th>
                  <th style={{ padding: '12px 16px' }}>Sana</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' }}>
                      {m.tender_title ?? `#${m.tender_id}`}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                      {m.company_name ?? `#${m.company_id}`}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '50px', height: '5px', borderRadius: '3px', background: 'var(--bg-2)' }}>
                          <div style={{ width: `${m.score * 100}%`, height: '100%', borderRadius: '3px', background: scoreColor(m.score) }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: scoreColor(m.score) }}>{m.score.toFixed(3)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-3)' }}>
                      {m.text_score?.toFixed(3) ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-3)' }}>
                      {m.category_score?.toFixed(3) ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <Bell size={14} style={{ color: m.is_notified ? 'var(--green)' : 'var(--text-4)', opacity: m.is_notified ? 1 : 0.3 }} />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <Target size={14} style={{ color: m.is_saved ? 'var(--primary)' : 'var(--text-4)', opacity: m.is_saved ? 1 : 0.3 }} />
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-4)' }}>{m.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
