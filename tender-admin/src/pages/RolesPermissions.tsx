import { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Plus, Trash2, RefreshCw, X, Edit2, Key, ChevronDown, ChevronRight, UserCheck, BarChart3, Target, Building, FileText, CreditCard, Activity } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { rolesApi, type Role, type Permission, type AdminUser } from '../api/admin';

const RESOURCE_COLORS: Record<string, string> = {
  users: 'var(--primary)', tenders: 'var(--teal)', companies: 'var(--purple)',
  financials: 'var(--green)', notifications: 'var(--yellow)', analytics: 'var(--primary)',
  audit_log: 'var(--text-3)', settings: 'var(--red)', roles: 'var(--purple)', health: 'var(--teal)',
};

const ACTION_LABELS: Record<string, string> = {
  view: 'Ko\'rish', edit: 'Tahrirlash', delete: 'O\'chirish',
  manage: 'Boshqarish', send: 'Yuborish', message: 'Xabar',
};

type Tab = 'roles' | 'permissions' | 'users';

export default function RolesPermissionsPage() {
  const { addToast, setActiveTab } = useAdmin();
  const [tab, setTab] = useState<Tab>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<number | null>(null);

  // Role modal
  const [roleModal, setRoleModal] = useState<{ open: boolean; role?: Role }>({ open: false });
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  // Permission modal
  const [permModal, setPermModal] = useState(false);
  const [permName, setPermName] = useState('');
  const [permResource, setPermResource] = useState('');
  const [permAction, setPermAction] = useState('');
  const [permDesc, setPermDesc] = useState('');

  // Promote modal
  const [promoteModal, setPromoteModal] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteReason, setPromoteReason] = useState('');

  // User-role assign modal
  const [assignModal, setAssignModal] = useState<{ open: boolean; user?: AdminUser }>({ open: false });
  const [assignedRoles, setAssignedRoles] = useState<Set<number>>(new Set());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p, a] = await Promise.all([
        rolesApi.list(),
        rolesApi.listPermissions(),
        rolesApi.listAdmins(),
      ]);
      setRoles(r);
      setPermissions(p);
      setAdmins(a);
    } catch { addToast('Xatolik', 'Ma\'lumotlarni yuklashda xato', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Group permissions by resource
  const permByResource = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.resource] = acc[p.resource] || []).push(p);
    return acc;
  }, {});

  // ── Role modal handlers ──
  const openCreateRole = () => {
    setRoleName(''); setRoleDesc(''); setSelectedPerms(new Set());
    setRoleModal({ open: true });
  };
  const openEditRole = (role: Role) => {
    setRoleName(role.name); setRoleDesc(role.description || '');
    setSelectedPerms(new Set(role.permissions.map(p => p.id)));
    setRoleModal({ open: true, role });
  };
  const closeRoleModal = () => setRoleModal({ open: false });

  const saveRole = async () => {
    if (!roleName.trim()) return;
    setSaving(true);
    try {
      const payload = { name: roleName.trim(), description: roleDesc, permission_ids: Array.from(selectedPerms) };
      if (roleModal.role) {
        const updated = await rolesApi.update(roleModal.role.id, payload);
        setRoles(prev => prev.map(r => r.id === roleModal.role!.id ? updated : r));
        addToast('Yangilandi', `"${updated.name}" roli yangilandi`, 'success');
      } else {
        const created = await rolesApi.create(payload);
        setRoles(prev => [...prev, created]);
        addToast('Yaratildi', `"${created.name}" roli yaratildi`, 'success');
      }
      closeRoleModal();
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Saqlashda xato', 'error');
    } finally { setSaving(false); }
  };

  const deleteRole = async (role: Role) => {
    if (!confirm(`"${role.name}" rolini o'chirasizmi?`)) return;
    try {
      await rolesApi.delete(role.id);
      setRoles(prev => prev.filter(r => r.id !== role.id));
      addToast('O\'chirildi', `"${role.name}" o'chirildi`, 'info');
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'O\'chirishda xato', 'error');
    }
  };

  const togglePerm = (id: number) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllResource = (resource: string, perms: Permission[]) => {
    const ids = perms.map(p => p.id);
    const allSelected = ids.every(id => selectedPerms.has(id));
    setSelectedPerms(prev => {
      const next = new Set(prev);
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  // ── Permission modal handlers ──
  const createPermission = async () => {
    if (!permName.trim() || !permResource.trim() || !permAction.trim()) return;
    setSaving(true);
    try {
      const p = await rolesApi.createPermission({ name: permName, resource: permResource, action: permAction, description: permDesc });
      setPermissions(prev => [...prev, p]);
      addToast('Yaratildi', `"${p.name}" permission yaratildi`, 'success');
      setPermModal(false); setPermName(''); setPermResource(''); setPermAction(''); setPermDesc('');
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Xato', 'error');
    } finally { setSaving(false); }
  };

  const deletePermission = async (p: Permission) => {
    if (p.is_system) return addToast('Xato', 'Tizim permissionlarini o\'chirish mumkin emas', 'error');
    if (!confirm(`"${p.name}" permission o'chirilsinmi?`)) return;
    try {
      await rolesApi.deletePermission(p.id);
      setPermissions(prev => prev.filter(x => x.id !== p.id));
      addToast('O\'chirildi', `"${p.name}" o'chirildi`, 'info');
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Xato', 'error');
    }
  };

  // ── Admin promote/demote ──
  const promote = async () => {
    if (!promoteEmail.trim()) return;
    setSaving(true);
    try {
      await rolesApi.promote(promoteEmail, promoteReason);
      addToast('Tayinlandi', `${promoteEmail} ga admin huquqi berildi`, 'success');
      setPromoteModal(false); setPromoteEmail(''); setPromoteReason('');
      fetchAll();
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Xato', 'error');
    } finally { setSaving(false); }
  };

  const demote = async (user: AdminUser) => {
    if (!confirm(`${user.full_name} dan admin huquqini olishni tasdiqlaysizmi?`)) return;
    try {
      await rolesApi.demote(user.id);
      setAdmins(prev => prev.filter(a => a.id !== user.id));
      addToast('Olib tashlandi', `${user.full_name} admin emas`, 'info');
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Xato', 'error');
    }
  };

  // ── User-role assign ──
  const openAssignModal = async (user: AdminUser) => {
    try {
      const userRoles = await rolesApi.getUserRoles(user.id);
      setAssignedRoles(new Set(userRoles.map(r => r.id)));
      setAssignModal({ open: true, user });
    } catch { addToast('Xatolik', 'Rollarni yuklashda xato', 'error'); }
  };

  const saveAssignRoles = async () => {
    if (!assignModal.user) return;
    setSaving(true);
    try {
      await rolesApi.assignUserRoles(assignModal.user.id, Array.from(assignedRoles));
      addToast('Saqlandi', `${assignModal.user.full_name} rollari yangilandi`, 'success');
      setAssignModal({ open: false });
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Xato', 'error');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
      <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} />
    </div>
  );

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Rollar va huquqlar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
            {roles.length} rol · {permissions.length} permission · {admins.length} admin
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {tab === 'roles' && <button className="btn btn-primary btn-sm" onClick={openCreateRole}><Plus size={14} /> Rol qo'shish</button>}
          {tab === 'permissions' && <button className="btn btn-primary btn-sm" onClick={() => setPermModal(true)}><Plus size={14} /> Permission qo'shish</button>}
          {tab === 'users' && <button className="btn btn-primary btn-sm" onClick={() => setPromoteModal(true)}><Plus size={14} /> Admin qo'shish</button>}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Foydalanuvchilar', tab: 'users', icon: Users, color: 'var(--primary)' },
          { label: 'Kompaniyalar', tab: 'companies', icon: Building, color: 'var(--teal)' },
          { label: 'Jamoalar', tab: 'teams', icon: Users, color: 'var(--green)' },
          { label: 'Audit Log', tab: 'audit_log', icon: Activity, color: 'var(--yellow)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--red)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="card mb-16" style={{ padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-1)' }}>
          {([['roles', `Rollar (${roles.length})`, Shield], ['permissions', `Permissionlar (${permissions.length})`, Key], ['users', `Adminlar (${admins.length})`, Users]] as const).map(([t, label, Icon]) => (
            <button key={t} onClick={() => setTab(t as Tab)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 20px', fontSize: '13px', fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--primary)' : 'var(--text-3)', borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent', background: 'none', cursor: 'pointer' }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ROLES TAB ── */}
      {tab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {roles.map(role => (
            <div key={role.id} className="card" style={{ border: role.is_system ? '1px solid var(--primary)30' : '1px solid var(--border-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer' }}
                onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={16} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {role.name}
                      {role.is_system && <span className="badge badge-primary" style={{ fontSize: '10px' }}>Tizim</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{role.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{role.permissions.length} permission · {role.user_count} foydalanuvchi</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-icon" onClick={e => { e.stopPropagation(); openEditRole(role); }} title="Tahrirlash">
                      <Edit2 size={14} style={{ color: 'var(--primary)' }} />
                    </button>
                    {!role.is_system && (
                      <button className="btn-icon" onClick={e => { e.stopPropagation(); deleteRole(role); }} title="O'chirish">
                        <Trash2 size={14} style={{ color: 'var(--red)' }} />
                      </button>
                    )}
                  </div>
                  {expandedRole === role.id ? <ChevronDown size={16} style={{ color: 'var(--text-3)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />}
                </div>
              </div>
              {expandedRole === role.id && (
                <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border-1)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {role.permissions.length === 0
                      ? <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>Permission yo'q</span>
                      : role.permissions.map(p => (
                        <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: `${RESOURCE_COLORS[p.resource] || 'var(--primary)'}18`, color: RESOURCE_COLORS[p.resource] || 'var(--primary)', border: `1px solid ${RESOURCE_COLORS[p.resource] || 'var(--primary)'}30` }}>
                          {p.resource}.{p.action}
                        </span>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── PERMISSIONS TAB ── */}
      {tab === 'permissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(permByResource).map(([resource, perms]) => (
            <div key={resource} className="card">
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: RESOURCE_COLORS[resource] || 'var(--text-0)', textTransform: 'capitalize' }}>
                  {resource} <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: '12px' }}>({perms.length})</span>
                </span>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Nom</th><th>Amal</th><th>Tavsif</th><th>Tur</th><th></th></tr></thead>
                  <tbody>
                    {perms.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-0)', fontWeight: 600 }}>{p.name}</td>
                        <td><span className="badge badge-primary">{ACTION_LABELS[p.action] || p.action}</span></td>
                        <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>{p.description || '—'}</td>
                        <td>{p.is_system ? <span className="badge badge-yellow">Tizim</span> : <span className="badge badge-primary">Custom</span>}</td>
                        <td>
                          {!p.is_system && (
                            <button className="btn-icon" onClick={() => deletePermission(p)}>
                              <Trash2 size={14} style={{ color: 'var(--red)' }} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Foydalanuvchi</th><th>Daraja</th><th>Holat</th><th>Ro'yxatdan</th><th>Amallar</th></tr></thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-4)' }}>Adminlar yo'q</td></tr>
                ) : admins.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                          {a.full_name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-0)' }}>{a.full_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {a.is_superadmin
                        ? <span className="badge badge-purple"><Shield size={10} /> SuperAdmin</span>
                        : <span className="badge badge-primary"><Users size={10} /> Admin</span>}
                    </td>
                    <td>{a.is_active ? <span className="badge badge-green">Faol</span> : <span className="badge badge-red">Nofaol</span>}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{new Date(a.created_at).toLocaleDateString('uz')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn-icon" title="Rollarni tayinlash" onClick={() => openAssignModal(a)}>
                          <UserCheck size={14} style={{ color: 'var(--primary)' }} />
                        </button>
                        {!a.is_superadmin && (
                          <button className="btn-icon" title="Admin huquqini olish" onClick={() => demote(a)}>
                            <Trash2 size={14} style={{ color: 'var(--red)' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ROLE CREATE/EDIT MODAL ── */}
      {roleModal.open && (
        <div className="modal-overlay" onClick={closeRoleModal}>
          <div className="modal" style={{ maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>
                {roleModal.role ? `"${roleModal.role.name}" ni tahrirlash` : 'Yangi rol yaratish'}
              </h3>
              <button className="btn-icon" onClick={closeRoleModal}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Rol nomi <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="input" placeholder="moderator" value={roleName}
                  onChange={e => setRoleName(e.target.value)}
                  disabled={roleModal.role?.is_system} />
              </div>
              <div className="input-group">
                <label className="input-label">Tavsif</label>
                <input className="input" placeholder="Rol tavsifi..." value={roleDesc} onChange={e => setRoleDesc(e.target.value)} />
              </div>
              <div>
                <label className="input-label" style={{ marginBottom: '10px', display: 'block' }}>
                  Permissionlar — <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{selectedPerms.size}</span> ta tanlangan
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(permByResource).map(([resource, perms]) => {
                    const allSelected = perms.every(p => selectedPerms.has(p.id));
                    const someSelected = perms.some(p => selectedPerms.has(p.id));
                    return (
                      <div key={resource} style={{ border: '1px solid var(--border-1)', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg-1)', borderBottom: someSelected ? '1px solid var(--border-1)' : 'none' }}>
                          <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                            onChange={() => toggleAllResource(resource, perms)} style={{ cursor: 'pointer' }} />
                          <span style={{ fontWeight: 700, fontSize: '12px', color: RESOURCE_COLORS[resource] || 'var(--text-0)', textTransform: 'capitalize' }}>{resource}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px 12px' }}>
                          {perms.map(p => (
                            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', background: selectedPerms.has(p.id) ? `${RESOURCE_COLORS[p.resource] || 'var(--primary)'}18` : 'var(--bg-0)', border: `1px solid ${selectedPerms.has(p.id) ? (RESOURCE_COLORS[p.resource] || 'var(--primary)') : 'var(--border-1)'}`, fontSize: '12px', fontWeight: selectedPerms.has(p.id) ? 600 : 400, color: selectedPerms.has(p.id) ? (RESOURCE_COLORS[p.resource] || 'var(--primary)') : 'var(--text-2)', transition: 'all 0.15s' }}>
                              <input type="checkbox" checked={selectedPerms.has(p.id)} onChange={() => togglePerm(p.id)} style={{ display: 'none' }} />
                              {ACTION_LABELS[p.action] || p.action}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeRoleModal}>Bekor qilish</button>
              <button className="btn btn-primary" disabled={!roleName.trim() || saving} onClick={saveRole}>
                {saving ? <><RefreshCw size={13} className="animate-spin" /> Saqlanmoqda...</> : <><Shield size={13} /> Saqlash</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PERMISSION CREATE MODAL ── */}
      {permModal && (
        <div className="modal-overlay" onClick={() => setPermModal(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Yangi permission</h3>
              <button className="btn-icon" onClick={() => setPermModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Nom <span style={{ color: 'var(--red)' }}>*</span> <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>(masalan: reports.export)</span></label>
                <input className="input" placeholder="resource.action" value={permName} onChange={e => setPermName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Resurs <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="input" placeholder="reports" value={permResource} onChange={e => setPermResource(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Amal <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="input" placeholder="export" value={permAction} onChange={e => setPermAction(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Tavsif</label>
                <input className="input" placeholder="Permission tavsifi..." value={permDesc} onChange={e => setPermDesc(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPermModal(false)}>Bekor qilish</button>
              <button className="btn btn-primary" disabled={!permName.trim() || !permResource.trim() || !permAction.trim() || saving} onClick={createPermission}>
                {saving ? <><RefreshCw size={13} className="animate-spin" /> Yaratilmoqda...</> : <><Key size={13} /> Yaratish</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROMOTE MODAL ── */}
      {promoteModal && (
        <div className="modal-overlay" onClick={() => setPromoteModal(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Admin tayinlash</h3>
              <button className="btn-icon" onClick={() => setPromoteModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Email <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="input" type="email" placeholder="user@example.com" value={promoteEmail} onChange={e => setPromoteEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Sabab</label>
                <input className="input" placeholder="Tayinlash sababi..." value={promoteReason} onChange={e => setPromoteReason(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPromoteModal(false)}>Bekor qilish</button>
              <button className="btn btn-primary" disabled={!promoteEmail.trim() || saving} onClick={promote}>
                {saving ? <><RefreshCw size={13} className="animate-spin" /> Tayinlanmoqda...</> : <><Shield size={13} /> Tayinlash</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGN ROLES MODAL ── */}
      {assignModal.open && assignModal.user && (
        <div className="modal-overlay" onClick={() => setAssignModal({ open: false })}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>{assignModal.user.full_name} — rollar</h3>
              <button className="btn-icon" onClick={() => setAssignModal({ open: false })}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roles.map(role => (
                <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', border: `1px solid ${assignedRoles.has(role.id) ? 'var(--primary)' : 'var(--border-1)'}`, background: assignedRoles.has(role.id) ? 'var(--primary-soft)' : 'var(--bg-0)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={assignedRoles.has(role.id)}
                    onChange={() => setAssignedRoles(prev => { const s = new Set(prev); s.has(role.id) ? s.delete(role.id) : s.add(role.id); return s; })} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-0)' }}>{role.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{role.permissions.length} permission</div>
                  </div>
                  {role.is_system && <span className="badge badge-primary" style={{ fontSize: '10px' }}>Tizim</span>}
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setAssignModal({ open: false })}>Bekor qilish</button>
              <button className="btn btn-primary" disabled={saving} onClick={saveAssignRoles}>
                {saving ? <><RefreshCw size={13} className="animate-spin" /> Saqlanmoqda...</> : <><UserCheck size={13} /> Saqlash</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
