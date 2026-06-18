import { useState } from 'react';
import { Users, UserPlus, Edit3, Trash2, Eye, X, Shield, Crown, Plus } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface Member {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joined: string;
}

interface Team {
  id: number;
  name: string;
  description: string;
  owner: string;
  members: Member[];
  created_at: string;
}

const initialTeams: Team[] = [
  {
    id: 1, name: 'TechCorp IT Team', description: 'IT va dasturiy ta\'minot bo\'yicha jamoa', owner: 'Bobur Sobirjonov', created_at: '2026-03-15',
    members: [
      { id: 1, name: 'Bobur Sobirjonov', email: 'bobur@techcorp.uz', role: 'owner', joined: '2026-03-15' },
      { id: 2, name: 'Jasur Karimov', email: 'jasur@techcorp.uz', role: 'admin', joined: '2026-03-20' },
      { id: 3, name: 'Dilnoza Rahimova', email: 'dilnoza@techcorp.uz', role: 'member', joined: '2026-04-01' },
    ],
  },
  {
    id: 2, name: 'BuildPro Qurilish', description: 'Qurilish va loyiha boshqaruv jamoasi', owner: 'Aziz Toshmatov', created_at: '2026-04-10',
    members: [
      { id: 4, name: 'Aziz Toshmatov', email: 'aziz@buildpro.uz', role: 'owner', joined: '2026-04-10' },
      { id: 5, name: 'Nodira Yusupova', email: 'nodira@buildpro.uz', role: 'member', joined: '2026-04-15' },
    ],
  },
  {
    id: 3, name: 'MediSupply Team', description: 'Tibbiyot ta\'minot jamoasi', owner: 'Sherzod Umarov', created_at: '2026-02-01',
    members: [
      { id: 6, name: 'Sherzod Umarov', email: 'sherzod@medisupply.uz', role: 'owner', joined: '2026-02-01' },
      { id: 7, name: 'Malika Nurmatova', email: 'malika@medisupply.uz', role: 'admin', joined: '2026-02-10' },
      { id: 8, name: 'Otabek Mirzayev', email: 'otabek@medisupply.uz', role: 'member', joined: '2026-02-15' },
      { id: 9, name: 'Kamola Tursunova', email: 'kamola@medisupply.uz', role: 'member', joined: '2026-03-01' },
    ],
  },
  {
    id: 4, name: 'LogiTrans Logistika', description: 'Transport va logistika jamoasi', owner: 'Farhod Aliyev', created_at: '2026-05-20',
    members: [
      { id: 10, name: 'Farhod Aliyev', email: 'farhod@logitrans.uz', role: 'owner', joined: '2026-05-20' },
      { id: 11, name: 'Sardor Bekmurodov', email: 'sardor@logitrans.uz', role: 'member', joined: '2026-05-25' },
      { id: 12, name: 'Gulnora Ismoilova', email: 'gulnora@logitrans.uz', role: 'member', joined: '2026-06-01' },
    ],
  },
  {
    id: 5, name: 'GreenBuild Eco', description: 'Ekologik qurilish loyihalari jamoasi', owner: 'Ravshan Nazarov', created_at: '2026-01-10',
    members: [
      { id: 13, name: 'Ravshan Nazarov', email: 'ravshan@greenbuild.uz', role: 'owner', joined: '2026-01-10' },
      { id: 14, name: 'Zilola Abdurahimova', email: 'zilola@greenbuild.uz', role: 'admin', joined: '2026-01-15' },
    ],
  },
];

const roleBadge = (role: string) => {
  const cls = role === 'owner' ? 'badge-purple' : role === 'admin' ? 'badge-yellow' : 'badge-primary';
  const icon = role === 'owner' ? <Crown size={10} /> : role === 'admin' ? <Shield size={10} /> : null;
  return <span className={`badge ${cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{icon}{role}</span>;
};

export default function TeamsPage() {
  const { addToast } = useAdmin();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [detailTeam, setDetailTeam] = useState<Team | null>(null);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; description: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Team | null>(null);

  const totalMembers = teams.reduce((s, t) => s + t.members.length, 0);

  const handleDelete = (team: Team) => {
    setTeams(prev => prev.filter(t => t.id !== team.id));
    setDeleteConfirm(null);
    addToast('O\'chirildi', `${team.name} jamoasi o'chirildi`, 'info');
  };

  const handleRemoveMember = (member: Member) => {
    if (!detailTeam) return;
    setTeams(prev => prev.map(t =>
      t.id === detailTeam.id ? { ...t, members: t.members.filter(m => m.id !== member.id) } : t
    ));
    setDetailTeam(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== member.id) } : null);
    addToast('A\'zo olib tashlandi', `${member.name} jamoadan chiqarildi`, 'info');
  };

  const handleCreate = () => {
    if (!createName.trim()) return;
    const newTeam: Team = {
      id: Date.now(),
      name: createName.trim(),
      description: createDesc.trim(),
      owner: 'Admin',
      members: [],
      created_at: new Date().toISOString().slice(0, 10),
    };
    setTeams(prev => [...prev, newTeam]);
    setShowCreate(false);
    setCreateName('');
    setCreateDesc('');
    addToast('Jamoa yaratildi', `${newTeam.name} muvaffaqiyatli yaratildi`, 'success');
  };

  const openEdit = (team: Team) => {
    setEditTeam(team);
    setEditForm({ name: team.name, description: team.description });
  };

  const saveEdit = () => {
    if (!editTeam || !editForm) return;
    setTeams(prev => prev.map(t => t.id === editTeam.id ? { ...t, name: editForm.name, description: editForm.description } : t));
    addToast('Saqlandi', `${editForm.name} jamoasi yangilandi`, 'success');
    setEditTeam(null);
    setEditForm(null);
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Jamoalar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Barcha jamoalar va a'zolar</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Yangi jamoa
        </button>
      </div>

      <div className="grid-3 mb-24">
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Jami jamoalar</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} style={{ color: 'var(--blue)' }} />
            </div>
          </div>
          <div className="stat-value">{teams.length}</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Jami a'zolar</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={16} style={{ color: 'var(--green)' }} />
            </div>
          </div>
          <div className="stat-value">{totalMembers}</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Faol jamoalar</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} style={{ color: 'var(--teal)' }} />
            </div>
          </div>
          <div className="stat-value">{teams.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nomi</th>
                <th>Tavsif</th>
                <th>Egasi</th>
                <th>A'zolar</th>
                <th>Yaratilgan</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, idx) => (
                <tr key={team.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--bg-1)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-4)' }}>{team.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-0)' }}>{team.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-3)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.description}</td>
                  <td style={{ padding: '12px 16px' }}>{team.owner}</td>
                  <td style={{ padding: '12px 16px' }}><span className="badge badge-primary">{team.members.length}</span></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{team.created_at}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="table-actions">
                      <button className="btn-icon" title="Ko'rish" onClick={() => setDetailTeam(team)}><Eye size={14} /></button>
                      <button className="btn-icon" title="Tahrirlash" onClick={() => openEdit(team)}><Edit3 size={14} /></button>
                      <button className="btn-icon" title="O'chirish" onClick={() => setDeleteConfirm(team)}><Trash2 size={14} style={{ color: 'var(--red)' }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailTeam && (
        <div className="modal-overlay" onClick={() => setDetailTeam(null)}>
          <div className="modal" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>{detailTeam.name}</h3>
              <button className="btn-icon" onClick={() => setDetailTeam(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Egasi</span><div style={{ fontWeight: 600, color: 'var(--text-0)' }}>{detailTeam.owner}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Yaratilgan</span><div style={{ color: 'var(--text-1)' }}>{detailTeam.created_at}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Tavsif</span><div style={{ color: 'var(--text-1)' }}>{detailTeam.description || '—'}</div></div>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-0)' }}>A'zolar ({detailTeam.members.length})</h4>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Ism</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Qo'shilgan</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailTeam.members.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>{m.name}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-3)' }}>{m.email}</td>
                        <td>{roleBadge(m.role)}</td>
                        <td style={{ color: 'var(--text-3)' }}>{m.joined}</td>
                        <td>
                          {m.role !== 'owner' && (
                            <button className="btn-icon" title="Chiqarish" onClick={() => handleRemoveMember(m)}>
                              <Trash2 size={12} style={{ color: 'var(--red)' }} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailTeam(null)}>Yopish</button>
              <button className="btn btn-primary" onClick={() => addToast('A\'zo qo\'shish', 'Yangi a\'zo qo\'shish funksiyasi', 'info')}>
                <UserPlus size={14} /> A'zo qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTeam && editForm && (
        <div className="modal-overlay" onClick={() => { setEditTeam(null); setEditForm(null); }}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Jamoani tahrirlash</h3>
              <button className="btn-icon" onClick={() => { setEditTeam(null); setEditForm(null); }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Jamoa nomi</label>
                <input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Tavsif</label>
                <input className="input" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setEditTeam(null); setEditForm(null); }}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={saveEdit}>Saqlash</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Yangi jamoa yaratish</h3>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Jamoa nomi *</label>
                <input className="input" placeholder="Masalan: Marketing Team" value={createName} onChange={e => setCreateName(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Tavsif</label>
                <input className="input" placeholder="Jamoa haqida qisqacha..." value={createDesc} onChange={e => setCreateDesc(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleCreate}>Yaratish</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Jamoani o'chirish</h3>
              <button className="btn-icon" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-1)', fontSize: '14px' }}>
                <strong>{deleteConfirm.name}</strong> jamoasini o'chirishni tasdiqlaysizmi?
                Bu amalni bekor qilib bo'lmaydi.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Bekor qilish</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
