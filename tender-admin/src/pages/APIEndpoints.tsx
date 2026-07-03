import { useCallback, useEffect, useState } from 'react';
import { Globe, Activity, AlertTriangle, Search, RefreshCw, ShieldCheck, ShieldOff, Plus, Trash2, Power, Save, X, Users, Lock, Zap, Database, BarChart3, FileText, Settings, Key } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { apiEndpointsApi, type APIRoute, type APIOverviewStats, type APIPermissionRule } from '../api/admin';

const METHOD_COLORS: Record<string, string> = {
  GET: 'badge-green', POST: 'badge-primary', PATCH: 'badge-yellow',
  DELETE: 'badge-red', PUT: 'badge-orange',
};

export default function APIEndpoints() {
  const { addToast, setActiveTab } = useAdmin();

  const [routes, setRoutes] = useState<APIRoute[]>([]);
  const [stats, setStats] = useState<APIOverviewStats | null>(null);
  const [permissions, setPermissions] = useState<APIPermissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'routes' | 'permissions'>('routes');

  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterAuth, setFilterAuth] = useState('all');

  // Permission form
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<APIPermissionRule | null>(null);
  const [formPath, setFormPath] = useState('');
  const [formMethod, setFormMethod] = useState('GET');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formRoles, setFormRoles] = useState('');
  const [formBlocked, setFormBlocked] = useState('');
  const [formRateLimit, setFormRateLimit] = useState('');
  const [formRateWindow, setFormRateWindow] = useState('60');
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s, p] = await Promise.all([
        apiEndpointsApi.routes(),
        apiEndpointsApi.stats(),
        apiEndpointsApi.permissions(),
      ]);
      setRoutes(r);
      setStats(s);
      setPermissions(p);
    } catch {
      addToast('Xatolik', "Ma'lumot yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const allTags = [...new Set(routes.flatMap(r => r.tags))].sort();

  const filtered = routes.filter(r => {
    if (filterMethod !== 'all' && !r.methods.includes(filterMethod)) return false;
    if (filterTag !== 'all' && !r.tags.includes(filterTag)) return false;
    if (filterAuth === 'auth' && !r.requires_auth) return false;
    if (filterAuth === 'public' && r.requires_auth) return false;
    if (search && !r.path.toLowerCase().includes(search.toLowerCase()) &&
        !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getPermForRoute = (path: string, method: string) =>
    permissions.find(p => p.path === path && p.method === method);

  const resetForm = () => {
    setFormPath(''); setFormMethod('GET'); setFormEnabled(true);
    setFormRoles(''); setFormBlocked(''); setFormRateLimit('');
    setFormRateWindow('60'); setFormDesc(''); setEditingRule(null);
  };

  const openNewForm = (path?: string, method?: string) => {
    resetForm();
    if (path) setFormPath(path);
    if (method) setFormMethod(method);
    setShowForm(true);
  };

  const openEditForm = (rule: APIPermissionRule) => {
    setEditingRule(rule);
    setFormPath(rule.path);
    setFormMethod(rule.method);
    setFormEnabled(rule.is_enabled);
    setFormRoles(rule.allowed_roles?.join(', ') || '');
    setFormBlocked(rule.blocked_user_ids?.join(', ') || '');
    setFormRateLimit(rule.rate_limit?.toString() || '');
    setFormRateWindow(rule.rate_window.toString());
    setFormDesc(rule.description || '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formPath.trim()) return;
    setSaving(true);
    try {
      const payload = {
        path: formPath.trim(),
        method: formMethod,
        is_enabled: formEnabled,
        allowed_roles: formRoles.trim() ? formRoles.split(',').map(s => s.trim()).filter(Boolean) : null,
        blocked_user_ids: formBlocked.trim() ? formBlocked.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : null,
        rate_limit: formRateLimit.trim() ? parseInt(formRateLimit) : null,
        rate_window: parseInt(formRateWindow) || 60,
        description: formDesc.trim() || null,
      };

      if (editingRule) {
        const updated = await apiEndpointsApi.updatePermission(editingRule.id, payload);
        setPermissions(prev => prev.map(p => p.id === editingRule.id ? updated : p));
        addToast('Yangilandi', 'Qoida muvaffaqiyatli yangilandi', 'success');
      } else {
        const created = await apiEndpointsApi.createPermission(payload as any);
        setPermissions(prev => [...prev, created]);
        addToast('Yaratildi', 'Yangi qoida qo\'shildi', 'success');
      }
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Saqlab bo\'lmadi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: APIPermissionRule) => {
    try {
      const updated = await apiEndpointsApi.togglePermission(rule.id);
      setPermissions(prev => prev.map(p => p.id === rule.id ? updated : p));
      addToast(updated.is_enabled ? 'Yoqildi' : 'O\'chirildi',
        `${rule.method} ${rule.path}`, updated.is_enabled ? 'success' : 'info');
    } catch {
      addToast('Xatolik', 'Holatni o\'zgartirib bo\'lmadi', 'error');
    }
  };

  const handleDelete = async (rule: APIPermissionRule) => {
    if (!confirm(`${rule.method} ${rule.path} qoidasini o'chirmoqchimisiz?`)) return;
    try {
      await apiEndpointsApi.deletePermission(rule.id);
      setPermissions(prev => prev.filter(p => p.id !== rule.id));
      addToast('O\'chirildi', 'Qoida o\'chirildi', 'success');
    } catch {
      addToast('Xatolik', 'O\'chirib bo\'lmadi', 'error');
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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>API Endpointlar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Endpointlar, ruxsatlar va cheklovlarni boshqarish</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /> Yangilash</button>
          {tab === 'permissions' && (
            <button className="btn btn-primary btn-sm" onClick={() => openNewForm()}><Plus size={13} /> Yangi qoida</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-0)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { id: 'routes' as const, label: 'Endpointlar', icon: Globe, count: routes.length },
          { id: 'permissions' as const, label: 'Ruxsatlar', icon: Lock, count: permissions.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'white' : 'transparent',
              color: tab === t.id ? 'var(--primary)' : 'var(--text-3)',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <t.icon size={14} /> {t.label}
            <span style={{
              background: tab === t.id ? 'var(--primary-soft)' : 'var(--bg-1)',
              padding: '1px 6px', borderRadius: '6px', fontSize: '11px',
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'API Keys', tab: 'api_keys', icon: Key, color: 'var(--primary)' },
          { label: 'Infrastructure', tab: 'infrastructure', icon: Database, color: 'var(--teal)' },
          { label: 'Platform Health', tab: 'health', icon: Activity, color: 'var(--green)' },
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
      {stats && (
        <div className="grid-4 mb-24">
          {[
            { label: 'Jami endpointlar', value: stats.total_routes, color: 'var(--primary)' },
            { label: 'Permission qoidalari', value: permissions.length, color: 'var(--teal)' },
            { label: 'O\'chirilgan', value: permissions.filter(p => !p.is_enabled).length, color: 'var(--red)' },
            { label: 'Rate limited', value: permissions.filter(p => p.rate_limit).length, color: 'var(--yellow)' },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-label mb-8">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Routes Tab */}
      {tab === 'routes' && (
        <>
          <div className="card mb-16">
            <div className="card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input className="input" style={{ paddingLeft: '32px' }} placeholder="Path yoki nom bo'yicha..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="input select" style={{ width: '140px' }} value={filterMethod} onChange={e => setFilterMethod(e.target.value)}>
                <option value="all">Barcha metodlar</option>
                {['GET', 'POST', 'PATCH', 'DELETE', 'PUT'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select className="input select" style={{ width: '160px' }} value={filterTag} onChange={e => setFilterTag(e.target.value)}>
                <option value="all">Barcha teglar</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="input select" style={{ width: '140px' }} value={filterAuth} onChange={e => setFilterAuth(e.target.value)}>
                <option value="all">Hammasi</option>
                <option value="auth">Auth talab</option>
                <option value="public">Ochiq</option>
              </select>
              <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>{filtered.length} ta</span>
            </div>
          </div>

          <div className="card mb-24">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Metod</th>
                    <th style={{ padding: '12px 16px' }}>Path</th>
                    <th style={{ padding: '12px 16px' }}>Teglar</th>
                    <th style={{ padding: '12px 16px' }}>Auth</th>
                    <th style={{ padding: '12px 16px' }}>Permission</th>
                    <th style={{ padding: '12px 16px' }}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const perm = r.methods.length === 1 ? getPermForRoute(r.path, r.methods[0]) : null;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px' }}>
                          {r.methods.map(m => (
                            <span key={m} className={`badge ${METHOD_COLORS[m] ?? 'badge-purple'}`} style={{ marginRight: '4px', fontSize: '11px' }}>{m}</span>
                          ))}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <code style={{ fontSize: '12px', color: 'var(--text-0)', fontFamily: 'monospace' }}>{r.path}</code>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {r.tags.map(t => (
                            <span key={t} className="badge badge-purple" style={{ fontSize: '10px', marginRight: '4px' }}>{t}</span>
                          ))}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {r.requires_auth ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--green)', fontSize: '12px' }}>
                              <ShieldCheck size={13} /> Auth
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-4)', fontSize: '12px' }}>
                              <ShieldOff size={13} /> Ochiq
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {perm ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {!perm.is_enabled && <span className="badge badge-red" style={{ fontSize: '10px' }}>O'chirilgan</span>}
                              {perm.is_enabled && perm.allowed_roles?.length ? <span className="badge badge-primary" style={{ fontSize: '10px' }}>{perm.allowed_roles.length} role</span> : null}
                              {perm.blocked_user_ids?.length ? <span className="badge badge-red" style={{ fontSize: '10px' }}>{perm.blocked_user_ids.length} blocked</span> : null}
                              {perm.rate_limit ? <span className="badge badge-yellow" style={{ fontSize: '10px' }}>{perm.rate_limit}/min</span> : null}
                              {perm.is_enabled && !perm.allowed_roles?.length && !perm.blocked_user_ids?.length && !perm.rate_limit && <span className="badge badge-green" style={{ fontSize: '10px' }}>Ochiq</span>}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-4)', fontSize: '11px' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {r.methods.map(m => (
                            <button key={m} className="btn btn-ghost btn-sm" style={{ fontSize: '11px', padding: '2px 8px' }}
                              onClick={() => {
                                const existing = getPermForRoute(r.path, m);
                                if (existing) openEditForm(existing);
                                else openNewForm(r.path, m);
                              }}
                            >
                              {getPermForRoute(r.path, m) ? 'Tahrirlash' : '+ Qoida'}
                            </button>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Permissions Tab */}
      {tab === 'permissions' && (
        <div className="card">
          {permissions.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
              <Lock size={40} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Hali permission qoidalari yo'q</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Endpointlar tabidan qoida qo'shing yoki "Yangi qoida" tugmasini bosing</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Holat</th>
                    <th style={{ padding: '12px 16px' }}>Metod</th>
                    <th style={{ padding: '12px 16px' }}>Path</th>
                    <th style={{ padding: '12px 16px' }}>Rollar</th>
                    <th style={{ padding: '12px 16px' }}>Bloklangan</th>
                    <th style={{ padding: '12px 16px' }}>Rate Limit</th>
                    <th style={{ padding: '12px 16px' }}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', opacity: p.is_enabled ? 1 : 0.5 }}>
                      <td style={{ padding: '10px 16px' }}>
                        <button
                          onClick={() => handleToggle(p)}
                          style={{
                            width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', position: 'relative',
                            background: p.is_enabled ? 'var(--green)' : 'var(--border-1)',
                            transition: 'background 0.2s',
                          }}
                        >
                          <div style={{
                            width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                            position: 'absolute', top: '2px', transition: 'left 0.2s',
                            left: p.is_enabled ? '18px' : '2px',
                          }} />
                        </button>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span className={`badge ${METHOD_COLORS[p.method] ?? 'badge-purple'}`} style={{ fontSize: '11px' }}>{p.method}</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <code style={{ fontSize: '12px', fontFamily: 'monospace' }}>{p.path}</code>
                        {p.description && <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>{p.description}</div>}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {p.allowed_roles?.length ? (
                          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                            {p.allowed_roles.map(r => <span key={r} className="badge badge-primary" style={{ fontSize: '10px' }}>{r}</span>)}
                          </div>
                        ) : <span style={{ color: 'var(--text-4)', fontSize: '11px' }}>Barchaga</span>}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {p.blocked_user_ids?.length ? (
                          <span className="badge badge-red" style={{ fontSize: '10px' }}>
                            <Users size={10} /> {p.blocked_user_ids.length} ta user
                          </span>
                        ) : <span style={{ color: 'var(--text-4)', fontSize: '11px' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {p.rate_limit ? (
                          <span className="badge badge-yellow" style={{ fontSize: '10px' }}>
                            <Zap size={10} /> {p.rate_limit} / {p.rate_window}s
                          </span>
                        ) : <span style={{ color: 'var(--text-4)', fontSize: '11px' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => openEditForm(p)}>
                            <Save size={12} />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: 'var(--red)' }} onClick={() => handleDelete(p)}>
                            <Trash2 size={12} />
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
      )}

      {/* Permission Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} style={{ color: 'var(--primary)' }} />
                {editingRule ? 'Qoidani tahrirlash' : 'Yangi permission qoidasi'}
              </h3>
              <button className="btn-icon" onClick={() => { setShowForm(false); resetForm(); }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Endpoint path</label>
                    <input className="input" value={formPath} onChange={e => setFormPath(e.target.value)}
                      placeholder="/api/v1/tenders/" disabled={!!editingRule} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Metod</label>
                    <select className="input select" value={formMethod} onChange={e => setFormMethod(e.target.value)} disabled={!!editingRule}>
                      {['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="input-label" style={{ margin: 0 }}>Endpoint holati</label>
                    <button
                      onClick={() => setFormEnabled(!formEnabled)}
                      style={{
                        width: '42px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', position: 'relative',
                        background: formEnabled ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                        position: 'absolute', top: '2px',
                        left: formEnabled ? '22px' : '2px',
                        transition: 'left 0.2s',
                      }} />
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: formEnabled ? 'var(--green)' : 'var(--red)' }}>
                    {formEnabled ? 'Yoqilgan — foydalanuvchilar foydalana oladi' : 'O\'chirilgan — 403 qaytariladi'}
                  </span>
                </div>

                <div className="input-group">
                  <label className="input-label">Ruxsat berilgan rollar (vergul bilan)</label>
                  <input className="input" value={formRoles} onChange={e => setFormRoles(e.target.value)}
                    placeholder="admin, manager, editor — bo'sh = barchaga" />
                  <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>Faqat shu rollardagi foydalanuvchilar kirishi mumkin. Bo'sh qoldirsa — cheklov yo'q</span>
                </div>

                <div className="input-group">
                  <label className="input-label">Bloklangan user ID'lar (vergul bilan)</label>
                  <input className="input" value={formBlocked} onChange={e => setFormBlocked(e.target.value)}
                    placeholder="1, 5, 23 — bo'sh = hech kim bloklanmagan" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Rate limit (so'rovlar soni)</label>
                    <input className="input" type="number" value={formRateLimit} onChange={e => setFormRateLimit(e.target.value)}
                      placeholder="Bo'sh = cheklovsiz" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Vaqt oynasi (soniya)</label>
                    <input className="input" type="number" value={formRateWindow} onChange={e => setFormRateWindow(e.target.value)} />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Izoh</label>
                  <input className="input" value={formDesc} onChange={e => setFormDesc(e.target.value)}
                    placeholder="Ixtiyoriy izoh..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); resetForm(); }}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !formPath.trim()}>
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {editingRule ? 'Yangilash' : 'Yaratish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
