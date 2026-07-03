import { useCallback, useEffect, useState } from 'react';
import { Search, Trash2, Eye, X, RefreshCw, Bell, Download, BarChart3, Target, Activity, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { savedSearchesApi, type AdminSavedSearch, type SavedSearchStats } from '../api/admin';

export default function SavedSearches() {
  const { addToast, setActiveTab } = useAdmin();
  const [searches, setSearches] = useState<AdminSavedSearch[]>([]);
  const [stats, setStats] = useState<SavedSearchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [detailItem, setDetailItem] = useState<AdminSavedSearch | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([savedSearchesApi.list(), savedSearchesApi.stats()]);
      setSearches(list);
      setStats(s);
    } catch {
      addToast('Xatolik', "Ma'lumot yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const filtered = searches.filter(s =>
    !query || s.name.toLowerCase().includes(query.toLowerCase()) ||
    (s.user_email ?? '').toLowerCase().includes(query.toLowerCase())
  );

  const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    exportCSV('saqlangan_qidiruvlar.csv',
      ['Nomi', 'Foydalanuvchi', 'Email', 'Filtrlar', 'Sana'],
      filtered.map(s => [s.name, s.user_name ?? '', s.user_email ?? '', s.filters, s.created_at])
    );
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const item = searches.find(s => s.id === deleteId)!;
    setDeleting(true);
    try {
      await savedSearchesApi.delete(deleteId);
      setSearches(prev => prev.filter(s => s.id !== deleteId));
      setDeleteId(null);
      addToast("O'chirildi", `"${item.name}" o'chirildi`, 'info');
    } catch {
      addToast('Xatolik', "O'chirishda xato", 'error');
    } finally {
      setDeleting(false);
    }
  };

  const parseFilters = (raw: string) => {
    try { return JSON.parse(raw); } catch { return {}; }
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
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Saqlangan Qidiruvlar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Foydalanuvchilar saqlagan qidiruv filtrlari</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
          <button className="btn btn-ghost btn-sm" onClick={handleExport} title="CSV yuklash"><Download size={13} /> CSV</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--teal)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Tender xaritasi', tab: 'tender-map', icon: Search, color: 'var(--green)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: Activity, color: 'var(--yellow)' },
          { label: 'Narx strategiya', tab: 'pricing', icon: DollarSign, color: 'var(--red)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--purple)' },
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
            { label: 'Jami qidiruvlar',     value: stats.total,                  color: 'var(--primary)' },
            { label: 'Foydalanuvchilar',    value: stats.total_users,            color: 'var(--green)' },
            { label: "O'rtacha (har biri)", value: stats.avg_per_user.toFixed(1), color: 'var(--teal)' },
            { label: "So'nggi 7 kun",       value: searches.filter(s => s.created_at >= new Date(Date.now() - 7*86400000).toISOString().slice(0,10)).length, color: 'var(--yellow)' },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-label mb-8">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card mb-16">
        <div className="card-body" style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="input" style={{ paddingLeft: '32px' }} placeholder="Nom yoki email..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-4)', alignSelf: 'center' }}>{filtered.length} ta</span>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
            <Bell size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>Saqlangan qidiruvlar topilmadi</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px' }}>Nomi</th>
                  <th style={{ padding: '12px 16px' }}>Foydalanuvchi</th>
                  <th style={{ padding: '12px 16px' }}>Sana</th>
                  <th style={{ padding: '12px 16px' }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                      <div>{s.user_name ?? `User #${s.user_id}`}</div>
                      {s.user_email && <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{s.user_email}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-4)' }}>{s.created_at}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => setActiveTab?.('tenders')} title="Tenderlardan qidirish">
                          <Search size={13} /> Ishga tushirish
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setDetailItem(s)}>
                          <Eye size={13} /> Filtrlar
                        </button>
                        <button className="btn-icon" onClick={() => setDeleteId(s.id)}>
                          <Trash2 size={14} style={{ color: 'var(--red)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailItem && (
        <div className="modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="modal" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>{detailItem.name} — Filtrlar</h3>
              <button className="btn-icon" onClick={() => setDetailItem(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '16px' }}>
              {Object.entries(parseFilters(detailItem.filters)).length === 0 ? (
                <code style={{ fontSize: '12px', color: 'var(--text-3)' }}>{detailItem.filters}</code>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(parseFilters(detailItem.filters)).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: '12px', padding: '8px 12px', background: 'var(--bg-0)', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                      <code style={{ fontSize: '12px', color: 'var(--primary)', minWidth: '100px' }}>{k}</code>
                      <span style={{ fontSize: '12px', color: 'var(--text-1)' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailItem(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--red)' }}>O'chirishni tasdiqlang</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '20px', fontSize: '13px', color: 'var(--text-2)' }}>
              Bu saqlangan qidiruvni o'chirmoqchimisiz?
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Bekor</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />} O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
