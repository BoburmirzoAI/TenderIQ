import { useState, useEffect, useCallback } from 'react';
import {
  Search, Download, Edit3, Ban, CheckCircle, Eye, X, Send, RefreshCw,
  Trash2, Mail, MessageCircle, Users, Crown, UserX, UserCheck, Shield, UserPlus, Lock,
  BarChart3, Target, Building, FileText, CreditCard, Activity
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { usersApi, type AdminUser } from '../api/admin';

const planBadge = (plan: string) => {
  const cls = plan === 'business' ? 'badge-purple' : plan === 'pro' ? 'badge-yellow' : 'badge-primary';
  return <span className={`badge ${cls}`}>{plan.toUpperCase()}</span>;
};

const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function UsersPage() {
  const { addToast, setActiveTab } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [msgUser, setMsgUser] = useState<AdminUser | null>(null);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgChannel, setMsgChannel] = useState<'email' | 'telegram' | 'both'>('email');
  const [msgSending, setMsgSending] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', full_name: '', password: '', phone: '', is_admin: false, is_active: true, is_verified: true });
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const perPage = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (search) params.search = search;
      if (filterPlan) params.plan = filterPlan;
      if (filterStatus) params.is_active = filterStatus;
      const res = await usersApi.list(params);
      setUsers(res.data);
      setTotal(res.total);
      setSelectedIds(new Set());
    } catch {
      addToast('Xatolik', 'Foydalanuvchilarni yuklashda xato', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterPlan, filterStatus]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(total / perPage);

  const activeCount = users.filter(u => u.is_active).length;
  const proCount = users.filter(u => u.current_plan === 'pro').length;
  const businessCount = users.filter(u => u.current_plan === 'business').length;
  const adminCount = users.filter(u => u.is_admin || u.is_superadmin).length;

  const toggleActive = async (user: AdminUser) => {
    try {
      const res = await usersApi.toggleActive(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: res.is_active } : u));
      if (detailUser?.id === user.id) setDetailUser(prev => prev ? { ...prev, is_active: res.is_active } : null);
      addToast(res.is_active ? 'Faollashtirildi' : 'Bloklandi', `${user.full_name} holati o'zgartirildi`, 'info');
    } catch {
      addToast('Xatolik', "Holat o'zgartirishda xato", 'error');
    }
  };

  const deleteUser = async (user: AdminUser) => {
    if (!confirm(`${user.full_name} ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await usersApi.delete(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setTotal(prev => prev - 1);
      if (detailUser?.id === user.id) setDetailUser(null);
      addToast("O'chirildi", `${user.full_name} o'chirildi`, 'success');
    } catch {
      addToast('Xatolik', "O'chirishda xato", 'error');
    }
  };

  const saveRole = async () => {
    if (!editUser) return;
    try {
      const updated = await usersApi.updateRole(editUser.id, {
        is_admin: editUser.is_admin,
        is_verified: editUser.is_verified,
        is_active: editUser.is_active,
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      addToast('Saqlandi', `${updated.full_name} yangilandi`, 'success');
      setEditUser(null);
    } catch {
      addToast('Xatolik', 'Saqlashda xato', 'error');
    }
  };

  const sendMessage = async () => {
    if (!msgBody.trim() || !msgUser) return;
    setMsgSending(true);
    try {
      const channels: string[] = [];
      if (msgChannel === 'email' || msgChannel === 'both') channels.push('email');
      if ((msgChannel === 'telegram' || msgChannel === 'both') && msgUser.telegram_id) channels.push('telegram');
      channels.push('in_app');
      await usersApi.sendMessage(msgUser.id, { title: msgTitle || 'Admin xabari', message: msgBody, channels });
      addToast('Yuborildi', `${msgUser.full_name} ga xabar yuborildi`, 'success');
      setMsgUser(null); setMsgTitle(''); setMsgBody('');
    } catch {
      addToast('Xatolik', 'Xabar yuborishda xato', 'error');
    } finally {
      setMsgSending(false);
    }
  };

  const createUser = async () => {
    if (!createForm.email.trim() || !createForm.full_name.trim() || !createForm.password.trim()) return;
    setCreating(true);
    try {
      await usersApi.create({
        email: createForm.email,
        full_name: createForm.full_name,
        password: createForm.password,
        phone: createForm.phone || undefined,
        is_admin: createForm.is_admin,
        is_active: createForm.is_active,
        is_verified: createForm.is_verified,
      });
      addToast('Yaratildi', `${createForm.full_name} muvaffaqiyatli yaratildi`, 'success');
      setShowCreate(false);
      setCreateForm({ email: '', full_name: '', password: '', phone: '', is_admin: false, is_active: true, is_verified: true });
      fetchUsers();
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Yaratishda xato', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleExport = () => {
    const data = selectedIds.size > 0 ? users.filter(u => selectedIds.has(u.id)) : users;
    exportCSV('foydalanuvchilar.csv',
      ['ID', 'Ism', 'Email', 'Telefon', 'Telegram', 'Plan', 'Kompaniya', "Ro'yxatdan o'tgan", 'Holat', 'Admin', 'Tasdiqlangan'],
      data.map(u => [u.id, u.full_name, u.email, u.phone || '', u.telegram_id || '', u.current_plan, u.company_name || '', new Date(u.created_at).toLocaleDateString('uz'), u.is_active ? 'Faol' : 'Nofaol', u.is_admin ? 'Ha' : 'Yo\'q', u.is_verified ? 'Ha' : 'Yo\'q'])
    );
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map(u => u.id)));
    }
  };

  const bulkToggle = async (activate: boolean) => {
    const targets = users.filter(u => selectedIds.has(u.id) && u.is_active !== activate);
    for (const u of targets) {
      try {
        await usersApi.toggleActive(u.id);
      } catch {}
    }
    addToast('Bajarildi', `${targets.length} ta foydalanuvchi ${activate ? 'faollashtirildi' : 'bloklandi'}`, 'success');
    fetchUsers();
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex-between mb-16">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Foydalanuvchilar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Jami: {total} ta foydalanuvchi · Sahifa {page}/{totalPages || 1}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}>
            <UserPlus size={13} /> Yangi foydalanuvchi
          </button>
          <button className="btn btn-sm btn-ghost" onClick={handleExport} disabled={users.length === 0}>
            <Download size={13} /> {selectedIds.size > 0 ? `${selectedIds.size} ta eksport` : 'CSV'}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Kompaniyalar', tab: 'companies', icon: Building, color: 'var(--teal)' },
          { label: 'Jamoalar', tab: 'teams', icon: Users, color: 'var(--primary)' },
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--green)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--yellow)' },
          { label: 'Moliya', tab: 'financials', icon: CreditCard, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--red)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }} className="mb-16">
        {[
          { label: 'Jami', value: total, icon: Users, color: 'var(--primary)', onClick: () => { setFilterPlan(''); setFilterStatus(''); } },
          { label: 'Faol', value: activeCount, icon: UserCheck, color: 'var(--green)', onClick: () => { setFilterStatus('true'); setFilterPlan(''); } },
          { label: 'Nofaol', value: users.length - activeCount, icon: UserX, color: 'var(--red)', onClick: () => { setFilterStatus('false'); setFilterPlan(''); } },
          { label: 'Pro', value: proCount, icon: Crown, color: 'var(--yellow)', onClick: () => { setFilterPlan('pro'); setFilterStatus(''); } },
          { label: 'Business', value: businessCount, icon: Shield, color: 'var(--purple)', onClick: () => { setFilterPlan('business'); setFilterStatus(''); } },
        ].map(s => (
          <button key={s.label} onClick={() => { s.onClick(); setPage(1); }} className="card stat-card" style={{
            cursor: 'pointer', border: '1px solid var(--border)', textAlign: 'left', width: '100%',
            transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = s.color)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div className="flex-between mb-4">
              <span className="stat-label" style={{ fontSize: '11px' }}>{s.label}</span>
              <s.icon size={14} style={{ color: s.color }} />
            </div>
            <div className="stat-value" style={{ fontSize: '20px', color: s.color }}>{s.value}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-16">
        <div className="card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="input" placeholder="Ism, email yoki telefon..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: '36px' }} />
          </div>
          <select className="input select" style={{ width: '130px' }} value={filterPlan}
            onChange={e => { setFilterPlan(e.target.value); setPage(1); }}>
            <option value="">Barcha planlar</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
          </select>
          <select className="input select" style={{ width: '130px' }} value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">Barcha holat</option>
            <option value="true">Faol</option>
            <option value="false">Nofaol</option>
          </select>
          {(search || filterPlan || filterStatus) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterPlan(''); setFilterStatus(''); setPage(1); }}
              style={{ color: 'var(--red)', fontSize: '11px' }}>
              <X size={12} /> Tozalash
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="card mb-16" style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary)' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>{selectedIds.size} ta tanlangan</span>
            <div style={{ flex: 1 }} />
            <button className="btn btn-sm btn-ghost" onClick={() => bulkToggle(true)} style={{ color: 'var(--green)' }}>
              <CheckCircle size={13} /> Faollashtirish
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => bulkToggle(false)} style={{ color: 'var(--red)' }}>
              <Ban size={13} /> Bloklash
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => setSelectedIds(new Set())}>
              <X size={13} /> Bekor
            </button>
          </div>
        </div>
      )}

      {/* Main content: Table + Detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: detailUser ? '1fr 380px' : '1fr', gap: '12px', transition: 'grid-template-columns 0.2s' }}>
        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
              <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto' }} />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '32px', padding: '8px' }}>
                      <input type="checkbox" checked={selectedIds.size === users.length && users.length > 0}
                        onChange={toggleSelectAll} style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                    </th>
                    <th>#</th><th>Foydalanuvchi</th><th>Telegram</th><th>Plan</th><th>Kompaniya</th><th>Ro'yxatdan</th><th>Holat</th><th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-4)' }}>Foydalanuvchilar topilmadi</td></tr>
                  ) : users.map((user) => (
                    <tr key={user.id}
                      style={{
                        cursor: 'pointer',
                        background: detailUser?.id === user.id ? 'var(--bg-active)' : selectedIds.has(user.id) ? 'var(--primary-soft)' : 'transparent',
                        borderLeft: detailUser?.id === user.id ? '3px solid var(--primary)' : '3px solid transparent',
                      }}
                      onClick={() => setDetailUser(detailUser?.id === user.id ? null : user)}
                      onMouseEnter={e => { if (detailUser?.id !== user.id && !selectedIds.has(user.id)) e.currentTarget.style.background = 'var(--bg-0)'; }}
                      onMouseLeave={e => { if (detailUser?.id !== user.id && !selectedIds.has(user.id)) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '8px' }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(user.id)}
                          onChange={() => toggleSelect(user.id)} style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                      </td>
                      <td style={{ color: 'var(--text-4)', fontSize: '12px' }}>{user.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar avatar-sm" style={{
                            background: user.is_admin ? 'rgba(248,81,73,0.15)' : 'var(--primary-soft)',
                            color: user.is_admin ? 'var(--red)' : 'var(--primary)', fontWeight: 700,
                          }}>
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {user.full_name}
                              {user.is_admin && <Shield size={11} style={{ color: 'var(--red)' }} />}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.telegram_id ? <span className="badge badge-cyan" style={{ fontSize: '10px' }}>{user.telegram_id}</span> : <span style={{ color: 'var(--text-5)' }}>—</span>}</td>
                      <td>{planBadge(user.current_plan)}</td>
                      <td style={{ color: user.company_name ? 'var(--text-1)' : 'var(--text-5)', fontSize: '12px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.company_name || '—'}</td>
                      <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{new Date(user.created_at).toLocaleDateString('uz')}</td>
                      <td>{user.is_active ? <span className="badge badge-green">Faol</span> : <span className="badge badge-red">Nofaol</span>}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="table-actions">
                          <button className="btn-icon" title="Tahrirlash" onClick={() => setEditUser({ ...user })}><Edit3 size={14} /></button>
                          <button className="btn-icon" title="Xabar" onClick={() => { setMsgUser(user); setMsgChannel(user.telegram_id ? 'both' : 'email'); }} style={{ color: 'var(--primary)' }}><Send size={14} /></button>
                          <button className="btn-icon" title={user.is_active ? 'Bloklash' : 'Faollashtirish'} onClick={() => toggleActive(user)}>
                            {user.is_active ? <Ban size={14} style={{ color: 'var(--red)' }} /> : <CheckCircle size={14} style={{ color: 'var(--green)' }} />}
                          </button>
                          <button className="btn-icon" title="O'chirish" onClick={() => deleteUser(user)}><Trash2 size={14} style={{ color: 'var(--red)' }} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center' }}>
              <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage(1)}>«</button>
              <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setPage(p)} style={{ minWidth: '32px' }}>{p}</button>
                );
              })}
              <button className="btn btn-sm btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <button className="btn btn-sm btn-ghost" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
          )}
        </div>

        {/* Detail Side Panel */}
        {detailUser && (
          <div className="card" style={{ position: 'sticky', top: '12px', alignSelf: 'start', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-0)' }}>Profil</h3>
              <button onClick={() => setDetailUser(null)} style={{ border: 'none', background: 'var(--bg-0)', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'var(--text-3)' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: '20px 16px' }}>
              {/* Avatar + name */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div className="avatar avatar-lg" style={{
                  background: detailUser.is_admin ? 'rgba(248,81,73,0.15)' : 'var(--primary-soft)',
                  color: detailUser.is_admin ? 'var(--red)' : 'var(--primary)',
                  fontWeight: 800, width: '56px', height: '56px', fontSize: '22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', margin: '0 auto 10px',
                }}>
                  {detailUser.full_name.charAt(0)}
                </div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-0)' }}>{detailUser.full_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{detailUser.email}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
                  {planBadge(detailUser.current_plan)}
                  {detailUser.is_active ? <span className="badge badge-green">Faol</span> : <span className="badge badge-red">Nofaol</span>}
                  {detailUser.is_admin && <span className="badge badge-red">Admin</span>}
                </div>
              </div>

              {/* Info rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Telefon', value: detailUser.phone || "Kiritilmagan" },
                  { label: 'Telegram', value: detailUser.telegram_id || "Bog'lanmagan" },
                  { label: 'Kompaniya', value: detailUser.company_name || "Yo'q" },
                  { label: "Ro'yxatdan", value: new Date(detailUser.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }) },
                  { label: 'Tasdiqlangan', value: detailUser.is_verified ? 'Ha' : "Yo'q" },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-0)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>{item.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                <button className="btn btn-sm btn-ghost" style={{ justifyContent: 'flex-start', width: '100%' }}
                  onClick={() => { setEditUser({ ...detailUser }); }}>
                  <Edit3 size={13} /> Tahrirlash
                </button>
                <button className="btn btn-sm btn-ghost" style={{ justifyContent: 'flex-start', width: '100%', color: 'var(--primary)' }}
                  onClick={() => { setMsgUser(detailUser); setMsgChannel(detailUser.telegram_id ? 'both' : 'email'); }}>
                  <Send size={13} /> Xabar yuborish
                </button>
                <button className="btn btn-sm btn-ghost" style={{ justifyContent: 'flex-start', width: '100%', color: detailUser.is_active ? 'var(--red)' : 'var(--green)' }}
                  onClick={() => toggleActive(detailUser)}>
                  {detailUser.is_active ? <><Ban size={13} /> Bloklash</> : <><CheckCircle size={13} /> Faollashtirish</>}
                </button>
                <button className="btn btn-sm btn-ghost" style={{ justifyContent: 'flex-start', width: '100%', color: 'var(--red)' }}
                  onClick={() => deleteUser(detailUser)}>
                  <Trash2 size={13} /> O'chirish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Foydalanuvchini tahrirlash</h3>
              <button className="btn-icon" onClick={() => setEditUser(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" value={editUser.email} disabled style={{ opacity: 0.6 }} />
              </div>
              {[
                { key: 'is_active', label: 'Faol', desc: "Foydalanuvchi tizimga kira oladi" },
                { key: 'is_verified', label: 'Tasdiqlangan', desc: 'Email tasdiqlangan' },
                { key: 'is_admin', label: 'Admin', desc: 'Admin paneliga kirish huquqi' },
              ].map(({ key, label, desc }) => (
                <label key={key} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                  background: (editUser[key as keyof AdminUser] as boolean) ? 'var(--bg-active)' : 'var(--bg-0)',
                  borderRadius: '8px', border: `1px solid ${(editUser[key as keyof AdminUser] as boolean) ? 'var(--primary)' : 'var(--border-1)'}`,
                  cursor: 'pointer',
                }}>
                  <input type="checkbox" checked={editUser[key as keyof AdminUser] as boolean}
                    onChange={e => setEditUser({ ...editUser, [key]: e.target.checked })}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>{label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditUser(null)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={saveRole}>Saqlash</button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={16} style={{ color: 'var(--primary)' }} /> Yangi foydalanuvchi
              </h3>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">To'liq ism <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="input" placeholder="Ism Familiya" value={createForm.full_name}
                    onChange={e => setCreateForm(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Telefon</label>
                  <input className="input" placeholder="+998901234567" value={createForm.phone}
                    onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Email <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="input" type="email" placeholder="user@example.com" value={createForm.email}
                  onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Parol <span style={{ color: 'var(--red)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                  <input className="input" type={showPassword ? 'text' : 'password'} placeholder="Kamida 6 belgi" value={createForm.password}
                    onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} style={{ paddingLeft: '36px', paddingRight: '36px' }} />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: '4px' }}>
                    <Eye size={14} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'is_active', label: 'Faol', color: 'var(--green)' },
                  { key: 'is_verified', label: 'Tasdiqlangan', color: 'var(--teal)' },
                  { key: 'is_admin', label: 'Admin', color: 'var(--red)' },
                ].map(({ key, label, color }) => (
                  <label key={key} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    background: (createForm as any)[key] ? `${color}15` : 'var(--bg-0)',
                    border: `1px solid ${(createForm as any)[key] ? color : 'var(--border-1)'}`,
                    color: (createForm as any)[key] ? color : 'var(--text-3)',
                  }}>
                    <input type="checkbox" checked={(createForm as any)[key]}
                      onChange={e => setCreateForm(p => ({ ...p, [key]: e.target.checked }))}
                      style={{ accentColor: color, width: '14px', height: '14px' }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)} disabled={creating}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={createUser}
                disabled={creating || !createForm.email.trim() || !createForm.full_name.trim() || createForm.password.length < 6}>
                {creating ? <><RefreshCw size={13} className="animate-spin" /> Yaratilmoqda...</> : <><UserPlus size={13} /> Yaratish</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {msgUser && (
        <div className="modal-overlay" onClick={() => setMsgUser(null)}>
          <div className="modal" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={16} style={{ color: 'var(--primary)' }} /> Xabar yuborish
              </h3>
              <button className="btn-icon" onClick={() => setMsgUser(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                <div className="avatar avatar-sm" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>
                  {msgUser.full_name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>{msgUser.full_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{msgUser.email}</div>
                </div>
                {planBadge(msgUser.current_plan)}
              </div>
              <div className="input-group">
                <label className="input-label">Kanal</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {([{ val: 'email', label: 'Email', icon: Mail, disabled: false }, { val: 'telegram', label: 'Telegram', icon: MessageCircle, disabled: !msgUser.telegram_id }, { val: 'both', label: 'Ikkalasi', icon: Send, disabled: !msgUser.telegram_id }] as const).map(ch => (
                    <button key={ch.val} disabled={ch.disabled} onClick={() => !ch.disabled && setMsgChannel(ch.val)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', border: `1px solid ${msgChannel === ch.val ? 'var(--primary)' : 'var(--border-1)'}`, background: msgChannel === ch.val ? 'var(--bg-active)' : 'var(--bg-0)', color: ch.disabled ? 'var(--text-4)' : msgChannel === ch.val ? 'var(--primary)' : 'var(--text-2)', cursor: ch.disabled ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}>
                      <ch.icon size={13} />{ch.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Sarlavha</label>
                <input className="input" placeholder="Xabar sarlavhasi..." value={msgTitle} onChange={e => setMsgTitle(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Xabar <span style={{ color: 'var(--red)' }}>*</span></label>
                <textarea placeholder="Xabar matni..." value={msgBody} onChange={e => setMsgBody(e.target.value)}
                  style={{ width: '100%', minHeight: '100px', padding: '10px 12px', background: 'var(--bg-0)', border: '1px solid var(--border-1)', borderRadius: '8px', color: 'var(--text-0)', fontSize: '13px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setMsgUser(null)} disabled={msgSending}>Bekor qilish</button>
              <button className="btn btn-primary" disabled={!msgBody.trim() || msgSending} onClick={sendMessage} style={{ minWidth: '110px' }}>
                {msgSending ? <><RefreshCw size={13} className="animate-spin" /> Yuborilmoqda...</> : <><Send size={13} /> Yuborish</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
