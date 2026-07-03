import { useState, useEffect, useCallback } from 'react';
import { Building, Trash2, Search, RefreshCw, Eye, X, Download, Plus, BarChart3, Target, Activity, FileText, Users, CreditCard } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { companiesApi, type AdminCompany } from '../api/admin';

export default function CompaniesPage() {
  const { addToast, setActiveTab } = useAdmin();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<AdminCompany | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ user_id: '', name: '', stir: '', contact_person: '', contact_phone: '', address: '', website: '' });
  const [creating, setCreating] = useState(false);
  const perPage = 20;

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (search) params.search = search;
      const res = await companiesApi.list(params);
      setCompanies(res.data);
      setTotal(res.total);
    } catch {
      addToast('Xatolik', 'Kompaniyalarni yuklashda xato', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const totalPages = Math.ceil(total / perPage);

  const createCompany = async () => {
    if (!createForm.name.trim() || !createForm.user_id.trim()) return;
    setCreating(true);
    try {
      await companiesApi.create({
        user_id: Number(createForm.user_id),
        name: createForm.name,
        stir: createForm.stir || undefined,
        contact_person: createForm.contact_person || undefined,
        contact_phone: createForm.contact_phone || undefined,
        address: createForm.address || undefined,
        website: createForm.website || undefined,
      });
      addToast('Yaratildi', 'Kompaniya muvaffaqiyatli yaratildi', 'success');
      setShowCreate(false);
      setCreateForm({ user_id: '', name: '', stir: '', contact_person: '', contact_phone: '', address: '', website: '' });
      fetchCompanies();
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Yaratishda xato', 'error');
    } finally {
      setCreating(false);
    }
  };

  const deleteCompany = async (c: AdminCompany) => {
    if (!confirm(`"${c.name}" ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await companiesApi.delete(c.id);
      setCompanies(prev => prev.filter(x => x.id !== c.id));
      setTotal(p => p - 1);
      addToast('O\'chirildi', 'Kompaniya o\'chirildi', 'success');
    } catch { addToast('Xatolik', 'O\'chirishda xato', 'error'); }
  };

  const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    exportCSV('kompaniyalar.csv',
      ['ID', 'Nomi', 'STIR', 'Egasi', 'Email', 'Telefon', 'Manzil', "Ro'yxatdan o'tgan"],
      companies.map(c => [c.id, c.name, c.stir || '', c.owner_name || '', c.owner_email || '', c.contact_phone || '', c.address || '', new Date(c.created_at).toLocaleDateString('uz')])
    );
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Kompaniyalar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Jami: {total} ta kompaniya</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}><Plus size={13} /> Yangi kompaniya</button>
          <button className="btn btn-sm btn-ghost" onClick={handleExport} disabled={companies.length === 0}><Download size={14} /> CSV</button>
          <button className="btn btn-sm btn-ghost" onClick={fetchCompanies}><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--teal)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Jamoalar', tab: 'teams', icon: Users, color: 'var(--green)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: Activity, color: 'var(--yellow)' },
          { label: 'Moliya', tab: 'financials', icon: CreditCard, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--red)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      <div className="card mb-16">
        <div className="card-body" style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="input" placeholder="Nomi yoki STIR..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: '36px' }} />
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto', color: 'var(--text-3)' }} /></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Kompaniya</th><th>STIR</th><th>Egasi</th><th>Aloqa</th><th>Ro'yxatdan</th><th></th></tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-4)' }}>Kompaniyalar topilmadi</td></tr>
                ) : companies.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building size={14} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-0)' }}>{c.name}</div>
                          {c.address && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.address}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: c.stir ? 'var(--text-1)' : 'var(--text-4)', fontFamily: 'monospace' }}>{c.stir || '—'}</td>
                    <td>
                      {c.owner_email ? (
                        <div>
                          <div style={{ fontSize: '12px', color: 'var(--text-1)' }}>{c.owner_name || '—'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.owner_email}</div>
                        </div>
                      ) : <span style={{ color: 'var(--text-4)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>{c.contact_phone || '—'}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{new Date(c.created_at).toLocaleDateString('uz')}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" onClick={() => setDetail(c)}><Eye size={14} /></button>
                        <button className="btn-icon" onClick={() => deleteCompany(c)}><Trash2 size={14} style={{ color: 'var(--red)' }} /></button>
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

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Kompaniya tafsiloti</h3>
              <button className="btn-icon" onClick={() => setDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap: '16px' }}>
                {[
                  ['Nomi', detail.name], ['STIR', detail.stir || '—'],
                  ['Egasi', detail.owner_name || '—'], ['Email', detail.owner_email || '—'],
                  ['Telefon', detail.contact_phone || '—'], ['Veb-sayt', detail.website || '—'],
                  ['Manzil', detail.address || '—'], ['Ro\'yxatdan', new Date(detail.created_at).toLocaleDateString('uz')],
                ].map(([label, val]) => (
                  <div key={label}>
                    <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>{label}</span>
                    <div style={{ marginTop: '4px', color: 'var(--text-1)', fontSize: '13px', wordBreak: 'break-all' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} style={{ color: 'var(--primary)' }} /> Yangi kompaniya yaratish
              </h3>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Foydalanuvchi ID <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="input" type="number" placeholder="1" value={createForm.user_id}
                    onChange={e => setCreateForm(p => ({ ...p, user_id: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Kompaniya nomi <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="input" placeholder="Kompaniya nomi" value={createForm.name}
                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">STIR</label>
                  <input className="input" placeholder="123456789" value={createForm.stir}
                    onChange={e => setCreateForm(p => ({ ...p, stir: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Kontakt shaxs</label>
                  <input className="input" placeholder="Ism Familiya" value={createForm.contact_person}
                    onChange={e => setCreateForm(p => ({ ...p, contact_person: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Telefon</label>
                  <input className="input" placeholder="+998..." value={createForm.contact_phone}
                    onChange={e => setCreateForm(p => ({ ...p, contact_phone: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Veb-sayt</label>
                  <input className="input" placeholder="https://..." value={createForm.website}
                    onChange={e => setCreateForm(p => ({ ...p, website: e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Manzil</label>
                <input className="input" placeholder="Toshkent sh..." value={createForm.address}
                  onChange={e => setCreateForm(p => ({ ...p, address: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={createCompany} disabled={creating || !createForm.name.trim() || !createForm.user_id.trim()}>
                {creating ? <><RefreshCw size={13} className="animate-spin" /> Yaratilmoqda...</> : <><Plus size={13} /> Yaratish</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
