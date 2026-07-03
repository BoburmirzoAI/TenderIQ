import { useCallback, useEffect, useState } from 'react';
import { Users, Trash2, Eye, X, Shield, Crown, RefreshCw, Search, Download, Plus, BarChart3, Target, Building, FileText, CreditCard, Activity } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { teamsApi, type AdminTeam, type AdminTeamStats, type AdminTeamMember } from '../api/admin';

const roleBadge = (role: string) => {
  const cls = role === 'owner' ? 'badge-purple' : role === 'admin' ? 'badge-yellow' : 'badge-primary';
  const icon = role === 'owner' ? <Crown size={10} /> : role === 'admin' ? <Shield size={10} /> : null;
  return (
    <span className={`badge ${cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {icon}{role}
    </span>
  );
};

export default function TeamsPage() {
  const { addToast, setActiveTab } = useAdmin();
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [stats, setStats] = useState<AdminTeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailTeam, setDetailTeam] = useState<AdminTeam | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AdminTeam | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', company_id: '', owner_id: '', max_members: '5' });
  const [creating, setCreating] = useState(false);

  const createTeam = async () => {
    if (!createForm.name.trim() || !createForm.company_id.trim() || !createForm.owner_id.trim()) return;
    setCreating(true);
    try {
      await teamsApi.create({
        name: createForm.name,
        company_id: Number(createForm.company_id),
        owner_id: Number(createForm.owner_id),
        max_members: Number(createForm.max_members) || 5,
      });
      addToast('Yaratildi', 'Jamoa muvaffaqiyatli yaratildi', 'success');
      setShowCreate(false);
      setCreateForm({ name: '', company_id: '', owner_id: '', max_members: '5' });
      load();
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Yaratishda xato', 'error');
    } finally { setCreating(false); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([teamsApi.list(), teamsApi.stats()]);
      setTeams(list);
      setStats(s);
    } catch {
      addToast('Xatolik', "Ma'lumot yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const handleDelete = async (team: AdminTeam) => {
    setDeleting(true);
    try {
      await teamsApi.delete(team.id);
      setTeams(prev => prev.filter(t => t.id !== team.id));
      setDeleteConfirm(null);
      addToast("O'chirildi", `${team.name} jamoasi o'chirildi`, 'info');
    } catch {
      addToast('Xatolik', "O'chirishda xato", 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveMember = async (member: AdminTeamMember) => {
    if (!detailTeam) return;
    try {
      await teamsApi.removeMember(detailTeam.id, member.id);
      const updatedMembers = detailTeam.members.filter(m => m.id !== member.id);
      const updatedTeam = { ...detailTeam, members: updatedMembers, member_count: updatedMembers.length };
      setDetailTeam(updatedTeam);
      setTeams(prev => prev.map(t => t.id === detailTeam.id ? updatedTeam : t));
      addToast("A'zo olib tashlandi", `${member.email ?? member.user_id} jamoadan chiqarildi`, 'info');
    } catch {
      addToast('Xatolik', "A'zoni olib tashlashda xato", 'error');
    }
  };

  const filtered = teams.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) ||
      (t.company_name ?? '').toLowerCase().includes(q) ||
      (t.owner_name ?? '').toLowerCase().includes(q) ||
      (t.owner_email ?? '').toLowerCase().includes(q);
  });

  const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    exportCSV('jamoalar.csv',
      ['Nomi', 'Kompaniya', 'Egasi', 'A\'zolar soni', 'Maks a\'zolar', 'Yaratilgan'],
      filtered.map(t => [t.name, t.company_name ?? '', t.owner_name ?? t.owner_email ?? '', t.member_count, t.max_members, t.created_at])
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
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Jamoalar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Foydalanuvchi jamoalarini boshqarish</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
          <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}><Plus size={13} /> Yangi jamoa</button>
          <button className="btn btn-ghost btn-sm" onClick={handleExport} title="CSV yuklash"><Download size={13} /> CSV</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Kompaniyalar', tab: 'companies', icon: Building, color: 'var(--teal)' },
          { label: 'Foydalanuvchilar', tab: 'users', icon: Users, color: 'var(--primary)' },
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

      <div className="card mb-16">
        <div className="card-body" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="input" style={{ paddingLeft: '36px' }} placeholder="Jamoa nomi, kompaniya yoki egasi..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>{filtered.length} ta</span>
        </div>
      </div>

      {stats && (
        <div className="grid-4 mb-24">
          {[
            { label: 'Jami jamoalar',  value: stats.total_teams,                    color: 'var(--primary)' },
            { label: 'Jami a\'zolar',  value: stats.total_members,                  color: 'var(--green)' },
            { label: 'O\'rtacha a\'zo', value: stats.avg_members.toFixed(1),         color: 'var(--teal)' },
            { label: 'Bo\'sh jamoalar', value: teams.filter(t => t.member_count <= 1).length, color: 'var(--yellow)' },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-label mb-8">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
          <Users size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <p>Hozircha jamoa yo'q</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: '16px' }}>
          {filtered.map(team => (
            <div key={team.id} className="card">
              <div className="card-header flex-between">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)' }}>{team.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '2px' }}>
                    {team.company_name ?? `Company #${team.company_id}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => setDetailTeam(team)}>
                    <Eye size={13} /> A'zolar
                  </button>
                  <button className="btn-icon" onClick={() => setDeleteConfirm(team)}>
                    <Trash2 size={14} style={{ color: 'var(--red)' }} />
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-2)' }}>
                  <span>
                    <Users size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    {team.member_count} / {team.max_members} a'zo
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{team.created_at}</span>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Egasi</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-1)' }}>
                    {team.owner_name ?? team.owner_email ?? `User #${team.owner_id}`}
                  </div>
                </div>
                <div style={{ height: '4px', borderRadius: '2px', background: 'var(--bg-2)', marginTop: '12px' }}>
                  <div style={{
                    width: `${Math.min(100, (team.member_count / team.max_members) * 100)}%`,
                    height: '100%', borderRadius: '2px',
                    background: team.member_count >= team.max_members ? 'var(--red)' : 'var(--primary)',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detailTeam && (
        <div className="modal-overlay" onClick={() => setDetailTeam(null)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>{detailTeam.name} — A'zolar</h3>
              <button className="btn-icon" onClick={() => setDetailTeam(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '0' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ padding: '10px 16px' }}>Foydalanuvchi</th>
                    <th style={{ padding: '10px 16px' }}>Rol</th>
                    <th style={{ padding: '10px 16px' }}>Qo'shilgan</th>
                    <th style={{ padding: '10px 16px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {detailTeam.members.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{m.full_name ?? m.email ?? `#${m.user_id}`}</div>
                        {m.email && m.full_name && <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{m.email}</div>}
                      </td>
                      <td style={{ padding: '10px 16px' }}>{roleBadge(m.role)}</td>
                      <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-4)' }}>{m.joined}</td>
                      <td style={{ padding: '10px 16px' }}>
                        {m.role !== 'owner' && (
                          <button className="btn-icon" onClick={() => handleRemoveMember(m)}>
                            <X size={13} style={{ color: 'var(--red)' }} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailTeam(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--red)' }}>Jamoani o'chirish</h3>
              <button className="btn-icon" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '20px', fontSize: '13px', color: 'var(--text-2)' }}>
              <strong>{deleteConfirm.name}</strong> jamoasini o'chirmoqchimisiz? Barcha a'zoliklar ham o'chiriladi.
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Bekor</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)} disabled={deleting}>
                {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />} O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} style={{ color: 'var(--primary)' }} /> Yangi jamoa yaratish
              </h3>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Jamoa nomi <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="input" placeholder="Jamoa nomi" value={createForm.name}
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Kompaniya ID <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="input" type="number" placeholder="1" value={createForm.company_id}
                    onChange={e => setCreateForm(p => ({ ...p, company_id: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Egasi (User ID) <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="input" type="number" placeholder="1" value={createForm.owner_id}
                    onChange={e => setCreateForm(p => ({ ...p, owner_id: e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Max a'zolar soni</label>
                <input className="input" type="number" placeholder="5" value={createForm.max_members}
                  onChange={e => setCreateForm(p => ({ ...p, max_members: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={createTeam} disabled={creating || !createForm.name.trim() || !createForm.company_id.trim() || !createForm.owner_id.trim()}>
                {creating ? <><RefreshCw size={13} className="animate-spin" /> Yaratilmoqda...</> : <><Plus size={13} /> Yaratish</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
