import { useCallback, useEffect, useState } from 'react';
import { GitCompare, Check, X, RotateCcw, RefreshCw, BarChart3, Target, Activity, FileText, Calendar, Map } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { api } from '../api/admin';

interface CompareTender {
  id: number; title: string; category?: string; region?: string;
  amount?: number; deadline?: string; organization?: string; status: string; source: string;
}

const fmtAmount = (n?: number) => {
  if (!n) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd so'm`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} mln so'm`;
  return `${n.toLocaleString()} so'm`;
};

const statusBadge = (s: string) => {
  const cls = s === 'active' ? 'badge-green' : s === 'closed' ? 'badge-red' : 'badge-yellow';
  const label = s === 'active' ? 'Faol' : s === 'closed' ? 'Yopilgan' : s;
  return <span className={`badge ${cls}`}>{label}</span>;
};

const compareRows: { key: keyof CompareTender; label: string }[] = [
  { key: 'organization', label: 'Tashkilot' },
  { key: 'category', label: 'Kategoriya' },
  { key: 'region', label: 'Hudud' },
  { key: 'amount', label: 'Summa' },
  { key: 'status', label: 'Holat' },
  { key: 'deadline', label: 'Muddat' },
  { key: 'source', label: 'Manba' },
];

export default function TenderCompare() {
  const { addToast, setActiveTab } = useAdmin();
  const [tenders, setTenders] = useState<CompareTender[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const res = await api.get<{ data: CompareTender[]; total: number }>('/admin/tenders', {
        params: { page_size: 20, search: q || undefined },
      });
      setTenders(res.data.data);
    } catch {
      addToast('Xatolik', "Tenderlar yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search); };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) { addToast('Limit', 'Maksimal 3 ta tender solishtirish mumkin', 'info'); return prev; }
      return [...prev, id];
    });
  };

  const selectedTenders = tenders.filter(t => selectedIds.includes(t.id));

  const formatValue = (key: keyof CompareTender, val: unknown): string => {
    if (key === 'amount') return fmtAmount(val as number | undefined);
    if (key === 'deadline' && typeof val === 'string') return val.slice(0, 10);
    return String(val ?? '—');
  };

  const renderCell = (key: keyof CompareTender, val: unknown) => {
    if (key === 'status') return statusBadge(String(val));
    if (key === 'category') return val ? <span className="badge badge-primary">{String(val)}</span> : <span style={{ color: 'var(--text-5)' }}>—</span>;
    return <span style={{ fontSize: '13px', color: 'var(--text-1)' }}>{formatValue(key, val)}</span>;
  };

  const isAllSame = (key: keyof CompareTender): boolean => {
    if (selectedTenders.length < 2) return true;
    const first = formatValue(key, selectedTenders[0][key]);
    return selectedTenders.every(t => formatValue(key, t[key]) === first);
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Tenderlarni solishtirish</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>2-3 tenderni tanlang va ularni taqqoslang</p>
        </div>
        {selectedIds.length > 0 && (
          <button className="btn btn-sm btn-ghost" onClick={() => setSelectedIds([])}>
            <RotateCcw size={14} /> Tozalash
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--teal)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Kalendar', tab: 'calendar', icon: Calendar, color: 'var(--green)' },
          { label: 'Tender xaritasi', tab: 'tender_map', icon: Map, color: 'var(--yellow)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: Activity, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--red)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="card mb-16">
        <div className="card-body" style={{ display: 'flex', gap: '12px' }}>
          <input className="input" style={{ flex: 1 }} placeholder="Tender qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? <RefreshCw size={13} className="animate-spin" /> : 'Qidirish'}
          </button>
        </div>
      </form>

      {/* Selectable tender cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-4)' }} />
        </div>
      ) : (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tenderlarni tanlang ({selectedIds.length}/3)
          </h3>
          {tenders.length === 0 ? (
            <div className="card">
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)' }}>Tenderlar topilmadi</div>
            </div>
          ) : (
            <div className="grid-3" style={{ gap: '12px' }}>
              {tenders.map(t => {
                const isSelected = selectedIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleSelect(t.id)}
                    style={{
                      padding: '14px', borderRadius: '10px', cursor: 'pointer',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-1)',
                      background: isSelected ? 'var(--primary-soft)' : 'var(--bg-1)',
                      transition: 'border-color 0.15s', position: 'relative',
                    }}
                  >
                    {isSelected && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={12} style={{ color: '#fff' }} />
                      </div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-0)', marginBottom: '4px', paddingRight: '24px' }}>
                      #{t.id} — {t.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '6px' }}>{t.organization ?? 'Noma\'lum'}</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {t.category && <span className="badge badge-primary" style={{ fontSize: '10px' }}>{t.category}</span>}
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-0)' }}>{fmtAmount(t.amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Comparison table */}
      {selectedTenders.length >= 2 ? (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitCompare size={16} /> Solishtirish jadvali
            </h3>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '120px', padding: '12px 16px' }}>Maydon</th>
                  {selectedTenders.map(t => (
                    <th key={t.id} style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700 }}>#{t.id}</div>
                      <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-3)' }}>{t.title.slice(0, 40)}{t.title.length > 40 ? '...' : ''}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map(row => {
                  const same = isAllSame(row.key);
                  return (
                    <tr key={row.key} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ fontWeight: 600, fontSize: '13px', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {same ? <Check size={13} style={{ color: 'var(--green)', flexShrink: 0 }} /> : <X size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />}
                          {row.label}
                        </div>
                      </td>
                      {selectedTenders.map(t => (
                        <td key={t.id} style={{ padding: '12px 16px', background: same ? 'transparent' : 'rgba(255,200,0,0.06)', borderLeft: '1px solid var(--border-1)' }}>
                          {renderCell(row.key, t[row.key])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-4)' }}>
            <GitCompare size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ fontSize: '14px' }}>Solishtirish uchun kamida 2 ta tender tanlang</p>
          </div>
        </div>
      )}
    </div>
  );
}
