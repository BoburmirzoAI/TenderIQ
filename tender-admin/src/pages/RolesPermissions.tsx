import { useState } from 'react';
import { Shield, Users, Lock, Search, Edit3, Plus, Trash2, X } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface Role {
  id: number;
  name: string;
  label: string;
  description: string;
  usersCount: number;
  permissionsCount: number;
  color: string;
}

interface Permission {
  key: string;
  label: string;
  description: string;
  module: string;
}

interface UserRole {
  id: number;
  name: string;
  email: string;
  role: string;
}

const initialRoles: Role[] = [
  { id: 1, name: 'superadmin', label: 'Super Admin', description: 'Barcha huquqlarga ega — platformani to\'liq boshqaradi', usersCount: 2, permissionsCount: 12, color: 'var(--red)' },
  { id: 2, name: 'admin', label: 'Admin', description: 'Asosiy boshqaruv huquqlari — foydalanuvchi va tenderlarni boshqaradi', usersCount: 5, permissionsCount: 9, color: 'var(--orange)' },
  { id: 3, name: 'user', label: 'Foydalanuvchi', description: 'Asosiy funksiyalar — tenderlarni ko\'rish va ariza berish', usersCount: 1200, permissionsCount: 5, color: 'var(--blue)' },
  { id: 4, name: 'viewer', label: 'Kuzatuvchi', description: 'Faqat ko\'rish huquqi — hech narsa o\'zgartira olmaydi', usersCount: 41, permissionsCount: 2, color: 'var(--text-3)' },
];

const initialPermissions: Permission[] = [
  { key: 'manage_users', label: 'Foydalanuvchilarni boshqarish', description: 'Foydalanuvchilarni qo\'shish, tahrirlash, bloklash', module: 'users' },
  { key: 'manage_tenders', label: 'Tenderlarni boshqarish', description: 'Tenderlarni tahrirlash va o\'chirish', module: 'tenders' },
  { key: 'manage_payments', label: 'To\'lovlarni boshqarish', description: 'To\'lovlarni ko\'rish va qaytarish', module: 'payments' },
  { key: 'view_reports', label: 'Hisobotlarni ko\'rish', description: 'Barcha hisobotlarga kirish', module: 'reports' },
  { key: 'use_ml', label: 'ML dan foydalanish', description: 'AI bashorat funksiyalarini ishlatish', module: 'ml' },
  { key: 'manage_bot', label: 'Botni boshqarish', description: 'Telegram bot sozlamalarini o\'zgartirish', module: 'bot' },
  { key: 'manage_settings', label: 'Sozlamalarni boshqarish', description: 'Platforma sozlamalarini o\'zgartirish', module: 'settings' },
  { key: 'export_data', label: 'Ma\'lumotlarni eksport qilish', description: 'CSV/Excel/PDF eksport', module: 'reports' },
  { key: 'manage_teams', label: 'Jamoalarni boshqarish', description: 'Jamoa a\'zolarini qo\'shish va o\'chirish', module: 'users' },
  { key: 'view_analytics', label: 'Analitikani ko\'rish', description: 'Batafsil analitik ma\'lumotlar', module: 'reports' },
  { key: 'manage_subscriptions', label: 'Obunalarni boshqarish', description: 'Obuna rejalarini o\'zgartirish', module: 'payments' },
  { key: 'manage_companies', label: 'Kompaniyalarni boshqarish', description: 'Kompaniya profillarini tahrirlash', module: 'tenders' },
];

const rolePermissions: Record<string, string[]> = {
  superadmin: initialPermissions.map(p => p.key),
  admin: ['manage_users', 'manage_tenders', 'manage_payments', 'view_reports', 'use_ml', 'manage_bot', 'export_data', 'view_analytics', 'manage_companies'],
  user: ['view_reports', 'use_ml', 'export_data', 'view_analytics', 'manage_companies'],
  viewer: ['view_reports', 'view_analytics'],
};

const mockUserRoles: UserRole[] = [
  { id: 1, name: 'Bobur Sobirjonov', email: 'bobur@mail.uz', role: 'superadmin' },
  { id: 2, name: 'Jasur Karimov', email: 'jasur@mail.uz', role: 'admin' },
  { id: 3, name: 'Dilnoza Rahimova', email: 'dilnoza@mail.uz', role: 'user' },
  { id: 4, name: 'Aziz Toshmatov', email: 'aziz@mail.uz', role: 'admin' },
  { id: 5, name: 'Nodira Yusupova', email: 'nodira@mail.uz', role: 'user' },
  { id: 6, name: 'Sherzod Umarov', email: 'sherzod@mail.uz', role: 'admin' },
  { id: 7, name: 'Malika Nurmatova', email: 'malika@mail.uz', role: 'viewer' },
  { id: 8, name: 'Otabek Mirzayev', email: 'otabek@mail.uz', role: 'user' },
  { id: 9, name: 'Sardor Aliyev', email: 'sardor@mail.uz', role: 'superadmin' },
  { id: 10, name: 'Kamola Tursunova', email: 'kamola@mail.uz', role: 'viewer' },
];

const modules = ['users', 'tenders', 'payments', 'reports', 'ml', 'bot', 'settings'];
const moduleLabels: Record<string, string> = {
  users: 'Foydalanuvchilar', tenders: 'Tenderlar', payments: 'To\'lovlar',
  reports: 'Hisobotlar', ml: 'ML / AI', bot: 'Telegram Bot', settings: 'Sozlamalar',
};

const roleBadge = (role: string) => {
  const cls = role === 'superadmin' ? 'badge-red' : role === 'admin' ? 'badge-yellow' : role === 'user' ? 'badge-blue' : 'badge-primary';
  return <span className={`badge ${cls}`}>{role}</span>;
};

export default function RolesPermissions() {
  const { addToast } = useAdmin();
  const [tab, setTab] = useState<'roles' | 'permissions' | 'user-roles'>('roles');
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [permRole, setPermRole] = useState('admin');
  const [perms, setPerms] = useState<Record<string, string[]>>(rolePermissions);
  const [userRoles, setUserRoles] = useState(mockUserRoles);
  const [search, setSearch] = useState('');

  // New role modal
  const [showNewRole, setShowNewRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);

  // New permission modal
  const [showNewPerm, setShowNewPerm] = useState(false);
  const [newPermKey, setNewPermKey] = useState('');
  const [newPermLabel, setNewPermLabel] = useState('');
  const [newPermDesc, setNewPermDesc] = useState('');
  const [newPermModule, setNewPermModule] = useState('users');

  const togglePerm = (permKey: string) => {
    setPerms(prev => {
      const current = prev[permRole] || [];
      const updated = current.includes(permKey) ? current.filter(k => k !== permKey) : [...current, permKey];
      return { ...prev, [permRole]: updated };
    });
    addToast('Ruxsat', `${permKey} — ${permRole} uchun o'zgartirildi`, 'info');
  };

  const changeUserRole = (userId: number, newRole: string) => {
    setUserRoles(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    addToast('Rol o\'zgartirildi', `Foydalanuvchi roli ${newRole} ga o'zgartirildi`, 'success');
  };

  const filteredUsers = userRoles.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteRole = (role: Role) => {
    setRoles(prev => prev.filter(r => r.id !== role.id));
    addToast('O\'chirildi', `${role.label} roli o'chirildi`, 'info');
  };

  const handleSaveNewRole = () => {
    if (!newRoleName.trim() || !newRoleLabel.trim()) return;
    const newRole: Role = {
      id: Date.now(),
      name: newRoleName.trim().toLowerCase().replace(/\s+/g, '_'),
      label: newRoleLabel.trim(),
      description: newRoleDesc.trim(),
      usersCount: 0,
      permissionsCount: newRolePerms.length,
      color: 'var(--primary)',
    };
    setRoles(prev => [...prev, newRole]);
    setPerms(prev => ({ ...prev, [newRole.name]: newRolePerms }));
    setShowNewRole(false);
    setNewRoleName('');
    setNewRoleLabel('');
    setNewRoleDesc('');
    setNewRolePerms([]);
    addToast('Rol qo\'shildi', `${newRole.label} roli muvaffaqiyatli yaratildi`, 'success');
  };

  const handleSaveNewPerm = () => {
    if (!newPermKey.trim() || !newPermLabel.trim()) return;
    const newPerm: Permission = {
      key: newPermKey.trim().toLowerCase().replace(/\s+/g, '_'),
      label: newPermLabel.trim(),
      description: newPermDesc.trim(),
      module: newPermModule,
    };
    setPermissions(prev => [...prev, newPerm]);
    setShowNewPerm(false);
    setNewPermKey('');
    setNewPermLabel('');
    setNewPermDesc('');
    setNewPermModule('users');
    addToast('Ruxsat qo\'shildi', `${newPerm.label} ruxsati muvaffaqiyatli yaratildi`, 'success');
  };

  const toggleNewRolePerm = (key: string) => {
    setNewRolePerms(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Rollar va Ruxsatnomalar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Foydalanuvchi rollari va huquqlarini boshqaring</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {tab === 'roles' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewRole(true)}>
              <Plus size={14} /> Yangi role
            </button>
          )}
          {tab === 'permissions' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewPerm(true)}>
              <Plus size={14} /> Yangi permission
            </button>
          )}
        </div>
      </div>

      <div className="tabs mb-24">
        <button className={`tab ${tab === 'roles' ? 'active' : ''}`} onClick={() => setTab('roles')}>
          <Shield size={14} /> Rollar
        </button>
        <button className={`tab ${tab === 'permissions' ? 'active' : ''}`} onClick={() => setTab('permissions')}>
          <Lock size={14} /> Ruxsatnomalar
        </button>
        <button className={`tab ${tab === 'user-roles' ? 'active' : ''}`} onClick={() => setTab('user-roles')}>
          <Users size={14} /> Foydalanuvchi rollari
        </button>
      </div>

      {tab === 'roles' && (
        <div className="card">
          <div className="card-header"><h3>Rollar</h3></div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Rol nomi</th>
                  <th>Tavsif</th>
                  <th>Foydalanuvchilar</th>
                  <th>Ruxsatlar soni</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: role.color }} />
                        <strong>{role.label}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>({role.name})</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-3)' }}>{role.description}</td>
                    <td><span className="badge badge-blue">{role.usersCount}</span></td>
                    <td><span className="badge badge-green">{role.permissionsCount}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-sm" onClick={() => setEditRole(role)}>
                          <Edit3 size={13} /> Tahrirlash
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteRole(role)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'permissions' && (
        <>
          <div className="card mb-24">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Rol tanlang:</span>
              <select className="input select" style={{ width: '200px' }} value={permRole} onChange={e => setPermRole(e.target.value)}>
                {roles.map(r => <option key={r.name} value={r.name}>{r.label}</option>)}
              </select>
              <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>
                {(perms[permRole] || []).length} / {permissions.length} ruxsat faol
              </span>
            </div>
          </div>

          {modules.map(mod => {
            const modPerms = permissions.filter(p => p.module === mod);
            if (modPerms.length === 0) return null;
            return (
              <div key={mod} className="mb-24">
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {moduleLabels[mod] || mod}
                </h3>
                <div className="grid-3">
                  {modPerms.map(perm => {
                    const enabled = (perms[permRole] || []).includes(perm.key);
                    return (
                      <div key={perm.key} className="card" style={{ cursor: 'pointer' }} onClick={() => togglePerm(perm.key)}>
                        <div className="card-body">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ fontSize: '13px' }}>{perm.label}</strong>
                            <div className={`toggle ${enabled ? 'active' : ''}`} />
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-4)', margin: 0 }}>{perm.description}</p>
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'monospace' }}>{perm.key}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab === 'user-roles' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Foydalanuvchi rollari</h3>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
              <input className="input" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ism</th>
                  <th>Email</th>
                  <th>Joriy rol</th>
                  <th>Rolni o'zgartirish</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td><strong>{user.name}</strong></td>
                    <td style={{ color: 'var(--text-3)' }}>{user.email}</td>
                    <td>{roleBadge(user.role)}</td>
                    <td>
                      <select
                        className="input select"
                        style={{ width: '160px' }}
                        value={user.role}
                        onChange={e => changeUserRole(user.id, e.target.value)}
                      >
                        {roles.map(r => <option key={r.name} value={r.name}>{r.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editRole && (
        <div className="modal-overlay" onClick={() => setEditRole(null)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Rolni tahrirlash</h3>
              <button className="btn-icon" onClick={() => setEditRole(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Rol nomi (label)</label>
                <input className="input" defaultValue={editRole.label} />
              </div>
              <div className="input-group">
                <label className="input-label">Tavsif</label>
                <input className="input" defaultValue={editRole.description} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditRole(null)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={() => { setEditRole(null); addToast('Saqlandi', `${editRole.label} roli yangilandi`, 'success'); }}>
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Role Modal */}
      {showNewRole && (
        <div className="modal-overlay" onClick={() => setShowNewRole(false)}>
          <div className="modal" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Yangi rol yaratish</h3>
              <button className="btn-icon" onClick={() => setShowNewRole(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Rol kodi (name)</label>
                <input className="input" placeholder="masalan: moderator" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Rol nomi (label)</label>
                <input className="input" placeholder="masalan: Moderator" value={newRoleLabel} onChange={e => setNewRoleLabel(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Tavsif</label>
                <input className="input" placeholder="Rol haqida qisqacha..." value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} />
              </div>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '10px' }}>Ruxsatlar</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {permissions.map(p => (
                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newRolePerms.includes(p.key)}
                        onChange={() => toggleNewRolePerm(p.key)}
                        style={{ width: '14px', height: '14px' }}
                      />
                      <span style={{ color: 'var(--text-1)' }}>{p.label}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'monospace' }}>({p.key})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowNewRole(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleSaveNewRole}>Saqlash</button>
            </div>
          </div>
        </div>
      )}

      {/* New Permission Modal */}
      {showNewPerm && (
        <div className="modal-overlay" onClick={() => setShowNewPerm(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Yangi ruxsat yaratish</h3>
              <button className="btn-icon" onClick={() => setShowNewPerm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Ruxsat kodi (key)</label>
                <input className="input" placeholder="masalan: view_dashboard" value={newPermKey} onChange={e => setNewPermKey(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Nomi</label>
                <input className="input" placeholder="masalan: Dashboardni ko'rish" value={newPermLabel} onChange={e => setNewPermLabel(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Tavsif</label>
                <input className="input" placeholder="Ruxsat haqida qisqacha..." value={newPermDesc} onChange={e => setNewPermDesc(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Modul</label>
                <select className="input select" value={newPermModule} onChange={e => setNewPermModule(e.target.value)}>
                  {modules.map(m => <option key={m} value={m}>{moduleLabels[m]}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowNewPerm(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleSaveNewPerm}>Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
