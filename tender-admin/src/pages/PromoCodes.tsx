import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Copy, Check, Trash2, X, RefreshCw, Tag, Download, CreditCard, Users, BarChart3, FileText, Bell, Target } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { promoCodesApi, type PromoCode, type PromoCodeStats } from '../api/admin';

const emptyForm = {
  code: '',
  discount_type: 'percent' as const,
  discount_value: 10,
  plan: 'all',
  max_uses: 100,
  expires_at: '',
  description: '',
};

const fmtDiscount = (c: PromoCode) =>
  c.discount_type === 'percent'
    ? `${c.discount_value}%`
    : `${c.discount_value.toLocaleString()} UZS`;

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const isExpired = (c: PromoCode) =>
  c.expires_at ? c.expires_at < new Date().toISOString().slice(0, 10) : false;

export default function PromoCodes() {
  const { addToast, setActiveTab } = useAdmin();

  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<PromoCodeStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterPlan, setFilterPlan] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        promoCodesApi.list(),
        promoCodesApi.stats(),
      ]);
      setCodes(list);
      setStats(s);
    } catch {
      addToast('Xatolik', "Ma'lumot yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const filtered = codes.filter(c => {
    if (search && !c.code.toLowerCase().includes(search.toLowerCase()) &&
        !(c.description ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus === 'active' && !c.is_active) return false;
    if (filterStatus === 'inactive' && c.is_active) return false;
    if (filterPlan !== 'all' && c.plan !== filterPlan) return false;
    return true;
  });

  const copyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast('Nusxa olindi', `${code} buferga saqlandi`, 'success');
  };

  const toggleActive = async (id: number) => {
    try {
      const updated = await promoCodesApi.toggle(id);
      setCodes(prev => prev.map(c => c.id === id ? updated : c));
      addToast(updated.is_active ? 'Yoqildi' : "O'chirildi", `${updated.code} holati o'zgartirildi`, 'info');
    } catch {
      addToast('Xatolik', "Holat o'zgartirilmadi", 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const c = codes.find(x => x.id === deleteId)!;
    setDeleting(true);
    try {
      await promoCodesApi.delete(deleteId);
      setCodes(prev => prev.filter(x => x.id !== deleteId));
      setStats(prev => prev ? { ...prev, total: prev.total - 1, active: prev.active - (c.is_active ? 1 : 0) } : null);
      setDeleteId(null);
      addToast("O'chirildi", `${c.code} o'chirildi`, 'success');
    } catch {
      addToast('Xatolik', "O'chirishda xato", 'error');
    } finally {
      setDeleting(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Kod kiritilishi shart';
    else if (form.code.length < 4) e.code = 'Minimal 4 ta belgi';
    if (form.discount_value <= 0) e.discount_value = "Chegirma 0 dan katta bo'lishi kerak";
    if (form.discount_type === 'percent' && form.discount_value > 100) e.discount_value = 'Foiz 100 dan oshmasligi kerak';
    if (form.max_uses <= 0) e.max_uses = "1 dan katta bo'lishi kerak";
    if (!form.expires_at) e.expires_at = 'Muddatni kiriting';
    return e;
  };

  const handleCreate = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      const created = await promoCodesApi.create({
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        plan: form.plan,
        max_uses: form.max_uses,
        expires_at: form.expires_at || undefined,
        description: form.description || undefined,
      });
      setCodes(prev => [created, ...prev]);
      setStats(prev => prev ? { ...prev, total: prev.total + 1, active: prev.active + 1 } : null);
      setShowModal(false);
      setForm(emptyForm);
      setErrors({});
      addToast('Yaratildi', `${created.code} kodi qo'shildi`, 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (msg?.includes('allaqachon')) setErrors({ code: "Bu kod allaqachon mavjud" });
      else addToast('Xatolik', "Yaratishda xato yuz berdi", 'error');
    } finally {
      setSaving(false);
    }
  };

  const usagePercent = (c: PromoCode) => Math.min(100, Math.round((c.used_count / c.max_uses) * 100));

  const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    exportCSV('promo_kodlar.csv',
      ['Kod', 'Chegirma turi', 'Chegirma', 'Plan', 'Foydalanish', 'Maks', 'Muddat', 'Holat', 'Tavsif'],
      filtered.map(c => [c.code, c.discount_type, c.discount_value, c.plan, c.used_count, c.max_uses, c.expires_at ?? '', c.is_active ? 'Faol' : 'Nofaol', c.description ?? ''])
    );
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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Promo Kodlar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Chegirma kodlarini boshqarish</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
          <button className="btn btn-ghost btn-sm" onClick={handleExport} title="CSV yuklash"><Download size={13} /> CSV</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Yangi kod
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Moliya', tab: 'financials', icon: CreditCard, color: 'var(--primary)' },
          { label: 'Foydalanuvchilar', tab: 'users', icon: Users, color: 'var(--teal)' },
          { label: 'Bildirishnomalar', tab: 'notifications', icon: Bell, color: 'var(--green)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--yellow)' },
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--red)' },
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
            { label: 'Jami kodlar',        value: stats.total,       color: 'var(--primary)' },
            { label: 'Faol kodlar',        value: stats.active,      color: 'var(--green)' },
            { label: 'Tugagan kodlar',     value: stats.expired,     color: 'var(--red)' },
            { label: 'Jami foydalanishlar', value: stats.total_uses, color: 'var(--teal)' },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-label mb-8">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-16">
        <div className="card-body" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input
              className="input" placeholder="Kod yoki tavsif..."
              value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }}
            />
          </div>
          <select className="input select" style={{ width: '140px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}>
            <option value="all">Barchasi</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
          <select className="input select" style={{ width: '160px' }} value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
            <option value="all">Barcha planlar</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
          </select>
          <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>{filtered.length} ta</span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
            <Tag size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>Promo kodlar topilmadi</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px' }}>Kod</th>
                  <th style={{ padding: '12px 16px' }}>Chegirma</th>
                  <th style={{ padding: '12px 16px' }}>Plan</th>
                  <th style={{ padding: '12px 16px' }}>Foydalanish</th>
                  <th style={{ padding: '12px 16px' }}>Muddat</th>
                  <th style={{ padding: '12px 16px' }}>Holat</th>
                  <th style={{ padding: '12px 16px' }}>Tavsif</th>
                  <th style={{ padding: '12px 16px' }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', opacity: isExpired(c) ? 0.6 : 1 }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-0)', letterSpacing: '1px' }}>{c.code}</code>
                        <button
                          className="btn-icon"
                          style={{ width: '22px', height: '22px' }}
                          onClick={() => copyCode(c.code, c.id)}
                          title="Nusxa olish"
                        >
                          {copiedId === c.id ? <Check size={12} style={{ color: 'var(--green)' }} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${c.discount_type === 'percent' ? 'badge-blue' : 'badge-green'}`}>
                        {fmtDiscount(c)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-purple">
                        {c.plan === 'all' ? 'Hammasi' : c.plan}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '70px', height: '5px', borderRadius: '3px', background: 'var(--bg-2)' }}>
                          <div style={{
                            width: `${usagePercent(c)}%`, height: '100%', borderRadius: '3px',
                            background: usagePercent(c) >= 90 ? 'var(--red)' : usagePercent(c) >= 60 ? 'var(--yellow)' : 'var(--green)',
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{c.used_count}/{c.max_uses}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: isExpired(c) ? 'var(--red)' : 'var(--text-3)' }}>
                      {c.expires_at ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        className={`badge ${c.is_active && !isExpired(c) ? 'badge-green' : 'badge-red'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        onClick={() => toggleActive(c.id)}
                      >
                        {isExpired(c) ? 'Muddat tugagan' : c.is_active ? 'Faol' : 'Nofaol'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-3)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.description ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button className="btn-icon" onClick={() => setDeleteId(c.id)} title="O'chirish">
                        <Trash2 size={14} style={{ color: 'var(--red)' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Yangi promo kod</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Kod</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className={`input ${errors.code ? 'input-error' : ''}`}
                    style={{ flex: 1 }}
                    placeholder="SUMMER30"
                    value={form.code}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={() => setForm(p => ({ ...p, code: generateCode() }))}>
                    <RefreshCw size={13} />
                  </button>
                </div>
                {errors.code && <div className="input-error-msg">{errors.code}</div>}
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Chegirma turi</label>
                  <select className="input select" value={form.discount_type} onChange={e => setForm(p => ({ ...p, discount_type: e.target.value as 'percent' | 'fixed' }))}>
                    <option value="percent">Foiz (%)</option>
                    <option value="fixed">Belgilangan (UZS)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Chegirma miqdori</label>
                  <input
                    className={`input ${errors.discount_value ? 'input-error' : ''}`}
                    type="number"
                    value={form.discount_value}
                    onChange={e => setForm(p => ({ ...p, discount_value: parseFloat(e.target.value) }))}
                  />
                  {errors.discount_value && <div className="input-error-msg">{errors.discount_value}</div>}
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Plan</label>
                  <select className="input select" value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}>
                    <option value="all">Hammasi uchun</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Maksimal foydalanish</label>
                  <input
                    className={`input ${errors.max_uses ? 'input-error' : ''}`}
                    type="number"
                    value={form.max_uses}
                    onChange={e => setForm(p => ({ ...p, max_uses: parseInt(e.target.value) }))}
                  />
                  {errors.max_uses && <div className="input-error-msg">{errors.max_uses}</div>}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Muddat tugash sanasi</label>
                <input
                  className={`input ${errors.expires_at ? 'input-error' : ''}`}
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                />
                {errors.expires_at && <div className="input-error-msg">{errors.expires_at}</div>}
              </div>
              <div className="input-group">
                <label className="input-label">Tavsif (ixtiyoriy)</label>
                <input
                  className="input"
                  placeholder="Yozgi chegirma..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Bekor</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />} Yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--red)' }}>Promo kodni o'chirish</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '20px', fontSize: '13px', color: 'var(--text-2)' }}>
              <strong>{codes.find(c => c.id === deleteId)?.code}</strong> kodni o'chirmoqchimisiz? Bu amal qaytarib bo'lmaydi.
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
