import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, RefreshCw, ExternalLink, Download, Plus, X } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { tendersApi, type AdminTender } from '../api/admin';

const statusColors: Record<string, string> = {
  active: 'badge-green', closed: 'badge-red', cancelled: 'badge-yellow', awarded: 'badge-purple',
};
const sourceColors: Record<string, string> = {
  uzex: 'badge-primary', mc: 'badge-teal', mygov: 'badge-cyan',
};

function fmt(n?: number) {
  if (!n) return '—';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} mlrd`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mln`;
  return n.toLocaleString();
}

export default function TendersPage() {
  const { addToast } = useAdmin();
  const [tenders, setTenders] = useState<AdminTender[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', organization: '', category: '', region: '', amount: '', currency: 'UZS', deadline: '', description: '', url: '' });
  const [creating, setCreating] = useState(false);
  const perPage = 20;

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterSource) params.source = filterSource;
      const res = await tendersApi.list(params);
      setTenders(res.data);
      setTotal(res.total);
      setSelected(new Set());
    } catch {
      addToast('Xatolik', 'Tenderlarni yuklashda xato', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterSource]);

  useEffect(() => { fetchTenders(); }, [fetchTenders]);

  const totalPages = Math.ceil(total / perPage);

  const toggleSelect = (id: number) => setSelected(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  const deleteTender = async (t: AdminTender) => {
    if (!confirm(`"${t.title}" ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await tendersApi.delete(t.id);
      setTenders(prev => prev.filter(x => x.id !== t.id));
      setTotal(p => p - 1);
      addToast('O\'chirildi', 'Tender o\'chirildi', 'success');
    } catch { addToast('Xatolik', 'O\'chirishda xato', 'error'); }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} ta tenderni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      const res = await tendersApi.bulkDelete(Array.from(selected));
      addToast('O\'chirildi', `${res.data?.deleted ?? selected.size} ta tender o'chirildi`, 'success');
      fetchTenders();
    } catch { addToast('Xatolik', 'O\'chirishda xato', 'error'); }
  };

  const createTender = async () => {
    if (!createForm.title.trim()) return;
    setCreating(true);
    try {
      await tendersApi.create({
        title: createForm.title,
        organization: createForm.organization || undefined,
        category: createForm.category || undefined,
        region: createForm.region || undefined,
        amount: createForm.amount ? Number(createForm.amount) : undefined,
        currency: createForm.currency,
        deadline: createForm.deadline || undefined,
        description: createForm.description || undefined,
        url: createForm.url || undefined,
      });
      addToast('Yaratildi', 'Tender muvaffaqiyatli yaratildi', 'success');
      setShowCreate(false);
      setCreateForm({ title: '', organization: '', category: '', region: '', amount: '', currency: 'UZS', deadline: '', description: '', url: '' });
      fetchTenders();
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Yaratishda xato', 'error');
    } finally {
      setCreating(false);
    }
  };

  const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    exportCSV('tenderlar.csv',
      ['ID', 'Sarlavha', 'Tashkilot', 'Manba', 'Kategoriya', 'Miqdor', 'Holat', 'Muddat'],
      tenders.map(t => [t.id, t.title, t.organization || '', t.source, t.category || '', t.amount || '', t.status, t.deadline ? new Date(t.deadline).toLocaleDateString('uz') : ''])
    );
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Tenderlar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Jami: {total} ta tender</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}><Plus size={13} /> Yangi tender</button>
          {selected.size > 0 && (
            <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={bulkDelete}>
              <Trash2 size={14} /> O'chirish ({selected.size})
            </button>
          )}
          <button className="btn btn-sm btn-ghost" onClick={handleExport} disabled={tenders.length === 0}><Download size={14} /> CSV</button>
          <button className="btn btn-sm btn-ghost" onClick={fetchTenders}><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="card mb-24">
        <div className="card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="input" placeholder="Sarlavha, tashkilot, ID..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: '36px' }} />
          </div>
          <select className="input select" style={{ width: '140px' }} value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">Barcha holat</option>
            <option value="active">Faol</option>
            <option value="closed">Yopiq</option>
            <option value="cancelled">Bekor</option>
            <option value="awarded">Topshirildi</option>
          </select>
          <select className="input select" style={{ width: '130px' }} value={filterSource}
            onChange={e => { setFilterSource(e.target.value); setPage(1); }}>
            <option value="">Barcha manba</option>
            <option value="uzex">UZEX</option>
            <option value="mc">MC.uz</option>
            <option value="mygov">MyGov</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto', color: 'var(--text-3)' }} />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={selected.size === tenders.length && tenders.length > 0}
                      onChange={() => selected.size === tenders.length ? setSelected(new Set()) : setSelected(new Set(tenders.map(t => t.id)))}
                      style={{ accentColor: 'var(--primary)' }} />
                  </th>
                  <th>Sarlavha</th><th>Manba</th><th>Kategoriya</th><th>Miqdor</th><th>Holat</th><th>Muddat</th><th></th>
                </tr>
              </thead>
              <tbody>
                {tenders.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-4)' }}>Tenderlar topilmadi</td></tr>
                ) : tenders.map(t => (
                  <tr key={t.id}>
                    <td><input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} style={{ accentColor: 'var(--primary)' }} /></td>
                    <td style={{ maxWidth: '220px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.title}>{t.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.organization || '—'}</div>
                    </td>
                    <td><span className={`badge ${sourceColors[t.source] || 'badge-primary'}`}>{t.source.toUpperCase()}</span></td>
                    <td style={{ color: 'var(--text-2)' }}>{t.category || '—'}</td>
                    <td style={{ color: 'var(--text-1)', fontWeight: 500 }}>{fmt(t.amount)}</td>
                    <td><span className={`badge ${statusColors[t.status] || 'badge-primary'}`}>{t.status}</span></td>
                    <td style={{ color: t.deadline && new Date(t.deadline) < new Date() ? 'var(--red)' : 'var(--text-3)', fontSize: '12px' }}>
                      {t.deadline ? new Date(t.deadline).toLocaleDateString('uz') : '—'}
                    </td>
                    <td>
                      <div className="table-actions">
                        {t.url && <a href={t.url} target="_blank" rel="noreferrer" className="btn-icon" title="Ko'rish"><ExternalLink size={14} /></a>}
                        <button className="btn-icon" onClick={() => deleteTender(t)}><Trash2 size={14} style={{ color: 'var(--red)' }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Oldingi</button>
            <span style={{ fontSize: '13px', color: 'var(--text-3)', alignSelf: 'center' }}>{page} / {totalPages}</span>
            <button className="btn btn-sm btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Keyingi →</button>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} style={{ color: 'var(--primary)' }} /> Yangi tender yaratish
              </h3>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Sarlavha <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="input" placeholder="Tender sarlavhasi..." value={createForm.title}
                  onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Tashkilot</label>
                  <input className="input" placeholder="Tashkilot nomi" value={createForm.organization}
                    onChange={e => setCreateForm(p => ({ ...p, organization: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Kategoriya</label>
                  <select className="input select" value={createForm.category}
                    onChange={e => setCreateForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="">Tanlang</option>
                    <option value="goods">Tovarlar</option>
                    <option value="services">Xizmatlar</option>
                    <option value="works">Ishlar</option>
                    <option value="consulting">Konsalting</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Mintaqa</label>
                  <input className="input" placeholder="Toshkent, Samarqand..." value={createForm.region}
                    onChange={e => setCreateForm(p => ({ ...p, region: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Muddat</label>
                  <input className="input" type="datetime-local" value={createForm.deadline}
                    onChange={e => setCreateForm(p => ({ ...p, deadline: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Summa</label>
                  <input className="input" type="number" placeholder="0" value={createForm.amount}
                    onChange={e => setCreateForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Valyuta</label>
                  <select className="input select" value={createForm.currency}
                    onChange={e => setCreateForm(p => ({ ...p, currency: e.target.value }))}>
                    <option value="UZS">UZS</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Tavsif</label>
                <textarea placeholder="Tender haqida..." value={createForm.description}
                  onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                  style={{ width: '100%', minHeight: '80px', padding: '10px 12px', background: 'var(--bg-0)', border: '1px solid var(--border-1)', borderRadius: '8px', color: 'var(--text-0)', fontSize: '13px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="input-group">
                <label className="input-label">URL</label>
                <input className="input" placeholder="https://..." value={createForm.url}
                  onChange={e => setCreateForm(p => ({ ...p, url: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={createTender} disabled={creating || !createForm.title.trim()}>
                {creating ? <><RefreshCw size={13} className="animate-spin" /> Yaratilmoqda...</> : <><Plus size={13} /> Yaratish</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
