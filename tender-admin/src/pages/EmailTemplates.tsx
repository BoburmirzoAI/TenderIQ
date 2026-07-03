import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Edit3, Eye, Mail, RefreshCw, Save, X, Bell, Users, BarChart3, FileText, Settings, Target } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAdmin } from '../hooks/useAdmin';
import { type AdminEmailTemplate, emailTemplatesApi } from '../api/admin';

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  auth:         { label: 'Autentifikatsiya', color: 'badge-primary' },
  tender:       { label: 'Tender',           color: 'badge-teal' },
  subscription: { label: 'Obuna',            color: 'badge-yellow' },
  system:       { label: 'Tizim',            color: 'badge-purple' },
};

const renderPreview = (text: string) => {
  const escaped = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return escaped.replace(/{{(\w+)}}/g, (_, key) =>
    `<span style="background:rgba(14,165,233,0.15);color:var(--primary);padding:1px 5px;border-radius:4px;font-weight:600">{{${key}}}</span>`
  );
};

export default function EmailTemplates() {
  const { addToast, setActiveTab } = useAdmin();

  const [templates, setTemplates] = useState<AdminEmailTemplate[]>([]);
  const [selected, setSelected] = useState<AdminEmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [unsaved, setUnsaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [discardModal, setDiscardModal] = useState<AdminEmailTemplate | null>(null);

  const [stats, setStats] = useState<Record<string, number>>({});

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        emailTemplatesApi.list(),
        emailTemplatesApi.stats(),
      ]);
      setTemplates(list);
      setStats(s);
      if (list.length > 0 && !selected) setSelected(list[0]);
    } catch {
      addToast('Xatolik', "Shablonlarni yuklab bo'lmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, selected]);

  useEffect(() => { loadAll(); }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const startEdit = () => {
    if (!selected) return;
    setEditSubject(selected.subject);
    setEditBody(selected.body);
    setEditing(true);
    setUnsaved(false);
    setPreview(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await emailTemplatesApi.update(selected.slug, {
        subject: editSubject,
        body: editBody,
      });
      setTemplates(prev => prev.map(t => t.slug === updated.slug ? updated : t));
      setSelected(updated);
      setEditing(false);
      setUnsaved(false);
      addToast('Saqlandi', `${updated.name} yangilandi`, 'success');
    } catch {
      addToast('Xatolik', "Saqlashda xato yuz berdi", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setEditing(false);
    setUnsaved(false);
    setDiscardModal(null);
    addToast('Bekor qilindi', "O'zgartirishlar bekor qilindi", 'info');
  };

  const selectTemplate = (t: AdminEmailTemplate) => {
    if (unsaved) { setDiscardModal(t); return; }
    setSelected(t);
    setEditing(false);
    setPreview(false);
  };

  const filtered = templates.filter(t => filterCat === 'all' || t.category === filterCat);

  // ── Render ────────────────────────────────────────────────────────────────

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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Email Templates</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Foydalanuvchilarga ketadigan email shablonlari</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Bildirishnomalar', tab: 'notifications', icon: Bell, color: 'var(--primary)' },
          { label: 'Foydalanuvchilar', tab: 'users', icon: Users, color: 'var(--teal)' },
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--green)' },
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
          { label: 'Jami shablonlar',   value: stats.total ?? templates.length,        color: 'var(--primary)' },
          { label: 'Autentifikatsiya',  value: stats.auth ?? 0,                        color: 'var(--teal)' },
          { label: 'Tender',            value: stats.tender ?? 0,                      color: 'var(--green)' },
          { label: 'Obuna',             value: stats.subscription ?? 0,                color: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-label mb-8">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', alignItems: 'start' }}>

        {/* Left: template list */}
        <div className="card" style={{ position: 'sticky', top: '16px' }}>
          <div className="card-body" style={{ padding: '12px' }}>
            <select
              className="input select mb-12"
              style={{ width: '100%', marginBottom: '10px' }}
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
            >
              <option value="all">Barcha kategoriyalar</option>
              <option value="auth">Autentifikatsiya</option>
              <option value="tender">Tender</option>
              <option value="subscription">Obuna</option>
              <option value="system">Tizim</option>
            </select>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filtered.map(t => (
                <button
                  key={t.slug}
                  onClick={() => selectTemplate(t)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    gap: '4px', padding: '10px 12px', borderRadius: '8px', border: 'none',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    background: selected?.slug === t.slug ? 'var(--bg-active)' : 'transparent',
                    borderLeft: selected?.slug === t.slug ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                    <Mail size={13} style={{ color: selected?.slug === t.slug ? 'var(--primary)' : 'var(--text-3)', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: selected?.slug === t.slug ? 'var(--text-0)' : 'var(--text-1)' }}>
                      {t.name}
                    </span>
                  </div>
                  <span
                    className={`badge ${CATEGORY_LABELS[t.category]?.color ?? 'badge-primary'}`}
                    style={{ fontSize: '10px' }}
                  >
                    {CATEGORY_LABELS[t.category]?.label ?? t.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: editor */}
        {selected && (
          <div className="card">
            <div className="card-header flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', background: 'var(--primary-soft)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={16} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-0)' }}>{selected.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    Oxirgi yangilanish: {selected.updated_at.slice(0, 10)}
                  </div>
                </div>
                <span className={`badge ${CATEGORY_LABELS[selected.category]?.color ?? 'badge-primary'}`}>
                  {CATEGORY_LABELS[selected.category]?.label ?? selected.category}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!editing ? (
                  <>
                    <button className="btn btn-sm btn-ghost" onClick={() => setPreview(!preview)}>
                      <Eye size={13} /> {preview ? 'Oddiy' : "Ko'rinish"}
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={startEdit}>
                      <Edit3 size={13} /> Tahrirlash
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-sm btn-ghost" onClick={() => unsaved ? handleDiscard() : setEditing(false)}>
                      <X size={13} /> Bekor
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />} Saqlash
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Description */}
              {selected.description && (
                <div style={{ padding: '10px 14px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)', fontSize: '12px', color: 'var(--text-3)' }}>
                  {selected.description}
                </div>
              )}

              {/* Variables */}
              {selected.variables.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>
                    Mavjud o'zgaruvchilar
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selected.variables.map(v => (
                      <code key={v} style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '5px',
                        background: 'rgba(14,165,233,0.1)', color: 'var(--primary)',
                        border: '1px solid rgba(14,165,233,0.2)', fontWeight: 600,
                      }}>
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject */}
              <div className="input-group">
                <label className="input-label">Mavzu (Subject)</label>
                {editing ? (
                  <input
                    className="input"
                    value={editSubject}
                    onChange={e => { setEditSubject(e.target.value); setUnsaved(true); }}
                  />
                ) : (
                  <div
                    style={{ padding: '10px 12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)', fontSize: '13px', color: 'var(--text-1)' }}
                    dangerouslySetInnerHTML={{ __html: renderPreview(selected.subject) }}
                  />
                )}
              </div>

              {/* Body */}
              <div className="input-group">
                <div className="flex-between mb-8">
                  <label className="input-label" style={{ margin: 0 }}>Xabar matni</label>
                  {!editing && (
                    <button className="btn btn-sm btn-ghost" style={{ height: '24px', fontSize: '11px' }} onClick={() => setPreview(!preview)}>
                      {preview ? <><RefreshCw size={11} /> Oddiy</> : <><Eye size={11} /> Ko'rinish</>}
                    </button>
                  )}
                </div>
                {editing ? (
                  <textarea
                    value={editBody}
                    onChange={e => { setEditBody(e.target.value); setUnsaved(true); }}
                    style={{
                      width: '100%', minHeight: '340px', padding: '14px',
                      background: 'var(--bg-0)', border: '1px solid var(--border-1)',
                      borderRadius: '8px', color: 'var(--text-0)', fontSize: '13px',
                      fontFamily: 'monospace', lineHeight: '1.7', resize: 'vertical',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                ) : preview ? (
                  <div
                    style={{
                      padding: '20px', background: 'var(--bg-0)', borderRadius: '8px',
                      border: '1px solid var(--border-1)', minHeight: '340px',
                      fontSize: '13px', lineHeight: '1.8', color: 'var(--text-1)', whiteSpace: 'pre-wrap',
                    }}
                    dangerouslySetInnerHTML={{ __html: renderPreview(selected.body) }}
                  />
                ) : (
                  <pre style={{
                    padding: '14px', background: 'var(--bg-0)', borderRadius: '8px',
                    border: '1px solid var(--border-1)', minHeight: '340px',
                    fontSize: '12px', lineHeight: '1.7', color: 'var(--text-1)',
                    whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0, overflowX: 'auto',
                  }}>
                    {selected.body}
                  </pre>
                )}
              </div>

              {editing && unsaved && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--yellow)', padding: '8px 12px', background: 'rgba(234,179,8,0.08)', borderRadius: '6px', border: '1px solid rgba(234,179,8,0.2)' }}>
                  <AlertTriangle size={14} /> Saqlanmagan o'zgartirishlar mavjud
                </div>
              )}
            </div>

            {editing && (
              <div className="card-footer flex-between">
                <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>
                  O'zgaruvchilarni <code style={{ color: 'var(--primary)' }}>{'{{variable_name}}'}</code> formatida yozing
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost" onClick={() => unsaved ? handleDiscard() : setEditing(false)}>
                    <X size={14} /> Bekor
                  </button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />} Saqlash
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Discard confirm modal */}
      {discardModal && (
        <div className="modal-overlay" onClick={() => setDiscardModal(null)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> Saqlanmagan o'zgarishlar
              </h3>
              <button className="btn-icon" onClick={() => setDiscardModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '20px', fontSize: '13px', color: 'var(--text-2)' }}>
              Hozirgi shablonda saqlanmagan o'zgartirishlar bor. Davom etsangiz ular yo'qoladi.
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDiscardModal(null)}>Qaytish</button>
              <button className="btn btn-danger" onClick={() => {
                setSelected(discardModal);
                setEditing(false);
                setUnsaved(false);
                setDiscardModal(null);
              }}>
                Ha, o'tish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
