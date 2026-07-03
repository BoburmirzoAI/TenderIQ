import { useCallback, useEffect, useState } from 'react';
import { Layers, RefreshCw, Trophy, XCircle, DollarSign, Download, Search, BarChart3, Target, Activity, FileText, TrendingUp, BookOpen } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { pipelineApi, type PipelineApp, type PipelineStats } from '../api/admin';

const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const STAGES: { key: string; label: string; color: string }[] = [
  { key: 'discovered',  label: 'Topildi',       color: 'var(--teal)' },
  { key: 'analyzing',  label: 'Tahlil',         color: 'var(--primary)' },
  { key: 'preparing',  label: 'Tayyorlanmoqda', color: 'var(--yellow)' },
  { key: 'submitted',  label: 'Topshirildi',    color: 'var(--orange)' },
  { key: 'won',        label: "G'alaba",         color: 'var(--green)' },
  { key: 'lost',       label: "Mag'lubiyat",    color: 'var(--red)' },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: 'badge-red', medium: 'badge-yellow', low: 'badge-green',
};

const fmtMln = (n?: number) => {
  if (!n) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  return `${Math.round(n / 1e6)} mln`;
};

export default function Pipeline() {
  const { addToast, setActiveTab } = useAdmin();
  const [kanban, setKanban] = useState<Record<string, PipelineApp[]>>({});
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [listApps, setListApps] = useState<PipelineApp[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [board, s, list] = await Promise.all([
        pipelineApi.kanban(),
        pipelineApi.stats(),
        pipelineApi.list(),
      ]);
      setKanban(board);
      setStats(s);
      setListApps(list);
    } catch {
      addToast('Xatolik', "Ma'lumot yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const filterApp = (app: PipelineApp) => {
    if (filterStage && app.stage !== filterStage) return false;
    if (filterPriority && app.priority !== filterPriority) return false;
    if (searchQuery && !(app.tender_title || '').toLowerCase().includes(searchQuery.toLowerCase()) && !(app.user_email || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  };

  const filteredListApps = listApps.filter(filterApp);

  const filteredKanban: Record<string, PipelineApp[]> = {};
  for (const stage of STAGES) {
    filteredKanban[stage.key] = (kanban[stage.key] ?? []).filter(filterApp);
  }

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
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Pipeline</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Tender ariza jarayoni boshqaruvi</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="input" placeholder="Qidirish..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ height: '28px', width: '140px', padding: '2px 10px 2px 28px', fontSize: '12px' }} />
          </div>
          <select className="input" value={filterStage} onChange={e => setFilterStage(e.target.value)}
            style={{ height: '28px', padding: '2px 8px', fontSize: '12px' }}>
            <option value="">Barcha bosqichlar</option>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select className="input" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            style={{ height: '28px', padding: '2px 8px', fontSize: '12px' }}>
            <option value="">Barcha ustuvorliklar</option>
            <option value="high">Yuqori</option>
            <option value="medium">O'rta</option>
            <option value="low">Past</option>
          </select>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>
              <Layers size={13} /> Kanban
            </button>
            <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
              Ro'yxat
            </button>
          </div>
          <button className="btn btn-ghost btn-sm" title="CSV yuklash" onClick={() => exportCSV(
            'pipeline.csv',
            ['Tender', 'Foydalanuvchi', 'Bosqich', 'Ustuvorlik', 'Ariza summa', 'Natija', 'Sana'],
            (view === 'list' ? filteredListApps : listApps.filter(filterApp)).map(app => [
              app.tender_title ?? `#${app.tender_id}`, app.user_email ?? `#${app.user_id}`,
              STAGES.find(s => s.key === app.stage)?.label ?? app.stage, app.priority,
              app.bid_amount ?? '', app.result ?? '', app.created_at
            ])
          )}>
            <Download size={13} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--teal)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: Activity, color: 'var(--yellow)' },
          { label: 'Win/Loss', tab: 'journal', icon: BookOpen, color: 'var(--purple)' },
          { label: 'Narx strategiya', tab: 'pricing', icon: TrendingUp, color: 'var(--red)' },
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
            { label: 'Jami arizalar',  value: stats.total,                           color: 'var(--primary)' },
            { label: "G'alaba",        value: stats.won_count,                        color: 'var(--green)' },
            { label: "Mag'lubiyat",    value: stats.lost_count,                       color: 'var(--red)' },
            { label: 'Jami ariza summa', value: fmtMln(stats.total_bid_amount),       color: 'var(--teal)' },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-label mb-8">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '12px', overflowX: 'auto' }}>
          {STAGES.map(stage => {
            const cards = filteredKanban[stage.key] ?? [];
            return (
              <div key={stage.key} style={{ minWidth: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: stage.color }}>{stage.label}</span>
                  <span style={{ fontSize: '11px', background: 'var(--bg-2)', borderRadius: '10px', padding: '2px 8px', color: 'var(--text-3)' }}>{cards.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cards.length === 0 ? (
                    <div style={{ padding: '16px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px dashed var(--border)', textAlign: 'center', fontSize: '11px', color: 'var(--text-4)' }}>
                      Bo'sh
                    </div>
                  ) : cards.map(app => (
                    <div key={app.id} style={{ background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)', padding: '10px', fontSize: '12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-0)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.tender_title ?? `Tender #${app.tender_id}`}
                      </div>
                      <div style={{ color: 'var(--text-4)', marginBottom: '4px' }}>
                        {app.user_email ?? `User #${app.user_id}`}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={`badge ${PRIORITY_COLORS[app.priority] ?? 'badge-primary'}`} style={{ fontSize: '10px' }}>
                          {app.priority}
                        </span>
                        {app.bid_amount && (
                          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                            {fmtMln(app.bid_amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="card">
          {filteredListApps.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
              <Layers size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>Hozircha pipeline arizalari yo'q</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Tender</th>
                    <th style={{ padding: '12px 16px' }}>Foydalanuvchi</th>
                    <th style={{ padding: '12px 16px' }}>Bosqich</th>
                    <th style={{ padding: '12px 16px' }}>Ustuvorlik</th>
                    <th style={{ padding: '12px 16px' }}>Ariza summa</th>
                    <th style={{ padding: '12px 16px' }}>Natija</th>
                    <th style={{ padding: '12px 16px' }}>Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListApps.map(app => (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600 }}>
                        {app.tender_title ?? `#${app.tender_id}`}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px' }}>{app.user_email ?? `#${app.user_id}`}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '12px', color: STAGES.find(s => s.key === app.stage)?.color ?? 'var(--text-2)', fontWeight: 600 }}>
                          {STAGES.find(s => s.key === app.stage)?.label ?? app.stage}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${PRIORITY_COLORS[app.priority] ?? 'badge-primary'}`}>{app.priority}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>{fmtMln(app.bid_amount)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {app.result === 'won' ? <Trophy size={14} style={{ color: 'var(--green)' }} /> :
                         app.result === 'lost' ? <XCircle size={14} style={{ color: 'var(--red)' }} /> :
                         <DollarSign size={14} style={{ color: 'var(--text-4)' }} />}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-4)' }}>{app.created_at}</td>
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
