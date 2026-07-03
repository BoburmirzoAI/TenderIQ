import { useCallback, useEffect, useState } from 'react';
import { Key, Copy, Check, Trash2, X, AlertTriangle, RefreshCw, Plus, Shield, Users, Globe, BarChart3, FileText, Settings } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { apiKeysApi, type AdminAPIKey } from '../api/admin';

const SCOPES = ['tenders:read', 'tenders:write', 'profile:read', 'analytics:read', 'notifications:read'];

const emptyForm = { user_id: '', name: '', scopes: [] as string[], expires_at: '' };

export default function APIKeys() {
  const { addToast, setActiveTab } = useAdmin();
  const [keys, setKeys] = useState<AdminAPIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [newKeyFull, setNewKeyFull] = useState<string | null>(null);
  const [copiedFull, setCopiedFull] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setKeys(await apiKeysApi.list());
    } catch {
      addToast('Xatolik', "API kalitlar yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const filtered = keys.filter(k =>
    !search || k.name.toLowerCase().includes(search.toLowerCase()) ||
    (k.user_email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    k.key_prefix.toLowerCase().includes(search.toLowerCase())
  );

  const copyPrefix = (prefix: string, id: number) => {
    navigator.clipboard.writeText(prefix);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast('Nusxa olindi', `${prefix}... buferga saqlandi`, 'success');
  };

  const handleToggle = async (id: number) => {
    try {
      const updated = await apiKeysApi.toggle(id);
      setKeys(prev => prev.map(k => k.id === id ? updated : k));
      addToast(updated.is_active ? 'Yoqildi' : "O'chirildi", `Kalit holati o'zgartirildi`, 'info');
    } catch {
      addToast('Xatolik', "Holat o'zgarmadi", 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiKeysApi.delete(deleteId);
      setKeys(prev => prev.filter(k => k.id !== deleteId));
      setDeleteId(null);
      addToast("O'chirildi", "API kalit o'chirildi", 'success');
    } catch {
      addToast('Xatolik', "O'chirishda xato", 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!form.user_id || !form.name) {
      addToast('Xato', "Foydalanuvchi ID va nom majburiy", 'error');
      return;
    }
    setSaving(true);
    try {
      const result = await apiKeysApi.create({
        user_id: parseInt(form.user_id),
        name: form.name,
        scopes: form.scopes,
        expires_at: form.expires_at || undefined,
      });
      setKeys(prev => [result.data, ...prev]);
      setNewKeyFull(result.data.full_key);
      setShowModal(false);
      setForm(emptyForm);
      addToast('Yaratildi', "API kalit yaratildi — uni hozir saqlang!", 'success');
    } catch {
      addToast('Xatolik', "Kalit yaratishda xato", 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleScope = (scope: string) => {
    setForm(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope],
    }));
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
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>API Kalitlar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Dasturiy kirish uchun API kalitlarini boshqarish</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Yangi kalit
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Foydalanuvchilar', tab: 'users', icon: Users, color: 'var(--primary)' },
          { label: 'API Endpoints', tab: 'api_endpoints', icon: Globe, color: 'var(--teal)' },
          { label: 'Rollar', tab: 'roles', icon: Shield, color: 'var(--green)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--yellow)' },
          { label: 'Sozlamalar', tab: 'settings', icon: Settings, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--red)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid-4 mb-24">
        {[
          { label: 'Jami kalitlar',  value: keys.length,                         color: 'var(--primary)' },
          { label: 'Faol kalitlar',  value: keys.filter(k => k.is_active).length, color: 'var(--green)' },
          { label: 'Nofaol',         value: keys.filter(k => !k.is_active).length, color: 'var(--red)' },
          { label: 'Muddatli',       value: keys.filter(k => k.expires_at).length, color: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-label mb-8">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card mb-16">
        <div className="card-body" style={{ display: 'flex', gap: '12px' }}>
          <input
            className="input" style={{ flex: 1 }}
            placeholder="Nom, email yoki kalit prefiksi..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-4)', alignSelf: 'center' }}>{filtered.length} ta</span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
            <Key size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>API kalitlar topilmadi</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px' }}>Kalit</th>
                  <th style={{ padding: '12px 16px' }}>Foydalanuvchi</th>
                  <th style={{ padding: '12px 16px' }}>Huquqlar</th>
                  <th style={{ padding: '12px 16px' }}>Muddat</th>
                  <th style={{ padding: '12px 16px' }}>Holat</th>
                  <th style={{ padding: '12px 16px' }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(k => (
                  <tr key={k.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{k.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <code style={{ fontSize: '12px', color: 'var(--text-4)', letterSpacing: '0.5px' }}>
                          {k.key_prefix}••••••••
                        </code>
                        <button className="btn-icon" style={{ width: '18px', height: '18px' }} onClick={() => copyPrefix(k.key_prefix, k.id)}>
                          {copiedId === k.id ? <Check size={11} style={{ color: 'var(--green)' }} /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                      {k.user_email ?? `User #${k.user_id}`}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {k.scopes.length === 0 ? (
                          <span className="badge badge-yellow">Barcha</span>
                        ) : k.scopes.map(s => (
                          <span key={s} className="badge badge-primary" style={{ fontSize: '10px' }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-4)' }}>
                      {k.expires_at ?? 'Muddatsiz'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        className={`badge ${k.is_active ? 'badge-green' : 'badge-red'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        onClick={() => handleToggle(k.id)}
                      >
                        {k.is_active ? 'Faol' : 'Nofaol'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button className="btn-icon" onClick={() => setDeleteId(k.id)}>
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
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Yangi API kalit</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Foydalanuvchi ID</label>
                <input className="input" type="number" value={form.user_id} onChange={e => setForm(p => ({ ...p, user_id: e.target.value }))} placeholder="1" />
              </div>
              <div className="input-group">
                <label className="input-label">Kalit nomi</label>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Production API Key" />
              </div>
              <div className="input-group">
                <label className="input-label">Huquqlar (scopes)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {SCOPES.map(s => (
                    <button
                      key={s}
                      className={`badge ${form.scopes.includes(s) ? 'badge-primary' : ''}`}
                      style={{ cursor: 'pointer', border: '1px solid var(--border)', background: form.scopes.includes(s) ? undefined : 'transparent', color: form.scopes.includes(s) ? undefined : 'var(--text-3)' }}
                      onClick={() => toggleScope(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px' }}>
                  Hech narsa tanlanmasa — barcha huquqlar beriladi
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Muddat tugash sanasi (ixtiyoriy)</label>
                <input className="input" type="date" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Bekor</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />} Yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show new key */}
      {newKeyFull && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> API kalitni saqlang!
              </h3>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '12px' }}>
                Bu kalit faqat bir marta ko'rsatiladi. Endi saqlang!
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-0)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <code style={{ flex: 1, fontSize: '12px', wordBreak: 'break-all', color: 'var(--primary)' }}>{newKeyFull}</code>
                <button className="btn btn-sm btn-ghost" onClick={() => {
                  navigator.clipboard.writeText(newKeyFull);
                  setCopiedFull(true);
                  setTimeout(() => setCopiedFull(false), 2000);
                }}>
                  {copiedFull ? <Check size={13} style={{ color: 'var(--green)' }} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => { setNewKeyFull(null); setCopiedFull(false); }}>
                <Shield size={14} /> Saqladim, yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--red)' }}>Kalitni o'chirish</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '20px', fontSize: '13px', color: 'var(--text-2)' }}>
              Bu API kalitni o'chirmoqchimisiz? Eski integratsiyalar ishlamay qoladi.
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
