import { useState } from 'react';
import { Search, Download, Edit3, Ban, CheckCircle, Eye, X } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface MockUser {
  id: number;
  full_name: string;
  email: string;
  telegram_id: string | null;
  plan: 'free' | 'pro' | 'business';
  company: string | null;
  registered: string;
  is_active: boolean;
  is_verified: boolean;
}

const mockUsers: MockUser[] = [
  { id: 1, full_name: 'Bobur Sobirjonov', email: 'bobur@mail.uz', telegram_id: '123456', plan: 'business', company: 'TechCorp', registered: '2026-01-15', is_active: true, is_verified: true },
  { id: 2, full_name: 'Jasur Karimov', email: 'jasur@mail.uz', telegram_id: '789012', plan: 'pro', company: 'BuildPro', registered: '2026-02-20', is_active: true, is_verified: true },
  { id: 3, full_name: 'Dilnoza Rahimova', email: 'dilnoza@mail.uz', telegram_id: null, plan: 'free', company: null, registered: '2026-03-10', is_active: true, is_verified: false },
  { id: 4, full_name: 'Aziz Toshmatov', email: 'aziz@mail.uz', telegram_id: '345678', plan: 'pro', company: 'MediSupply', registered: '2026-04-05', is_active: false, is_verified: true },
  { id: 5, full_name: 'Nodira Yusupova', email: 'nodira@mail.uz', telegram_id: '901234', plan: 'free', company: null, registered: '2026-05-12', is_active: true, is_verified: false },
  { id: 6, full_name: 'Sherzod Umarov', email: 'sherzod@mail.uz', telegram_id: null, plan: 'business', company: 'GreenBuild', registered: '2026-05-28', is_active: true, is_verified: true },
  { id: 7, full_name: 'Malika Nurmatova', email: 'malika@mail.uz', telegram_id: '567890', plan: 'free', company: null, registered: '2026-06-01', is_active: true, is_verified: false },
  { id: 8, full_name: 'Otabek Mirzayev', email: 'otabek@mail.uz', telegram_id: '112233', plan: 'pro', company: 'LogiTrans', registered: '2026-06-10', is_active: true, is_verified: true },
];

const planBadge = (plan: string) => {
  const cls = plan === 'business' ? 'badge-purple' : plan === 'pro' ? 'badge-yellow' : 'badge-primary';
  return <span className={`badge ${cls}`}>{plan.toUpperCase()}</span>;
};

export default function UsersPage() {
  const { addToast } = useAdmin();
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editUser, setEditUser] = useState<MockUser | null>(null);
  const [detailUser, setDetailUser] = useState<MockUser | null>(null);

  const filtered = mockUsers.filter((u) => {
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPlan !== 'all' && u.plan !== filterPlan) return false;
    if (filterStatus === 'active' && !u.is_active) return false;
    if (filterStatus === 'inactive' && u.is_active) return false;
    return true;
  });

  const toggleActive = (user: MockUser) => {
    addToast(user.is_active ? 'Bloklandi' : 'Faollashtirildi', `${user.full_name} holati o'zgartirildi`, 'info');
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Foydalanuvchilar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Jami: {mockUsers.length} ta foydalanuvchi</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm" onClick={() => addToast('Export', 'CSV fayl yuklab olindi', 'success')}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="card mb-24">
        <div className="card-body" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-with-icon" style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="input" placeholder="Ism, email yoki telegram ID..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
          </div>
          <select className="input select" style={{ width: '140px' }} value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
            <option value="all">Barcha planlar</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
          </select>
          <select className="input select" style={{ width: '140px' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Barchasi</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Foydalanuvchi</th>
                <th>Telegram</th>
                <th>Plan</th>
                <th>Kompaniya</th>
                <th>Ro'yxatdan</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td style={{ color: 'var(--text-4)' }}>{user.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar avatar-sm" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 700 }}>
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-0)' }}>{user.full_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.telegram_id ? <span className="badge badge-cyan">{user.telegram_id}</span> : <span style={{ color: 'var(--text-4)' }}>—</span>}</td>
                  <td>{planBadge(user.plan)}</td>
                  <td style={{ color: user.company ? 'var(--text-1)' : 'var(--text-4)' }}>{user.company || '—'}</td>
                  <td style={{ color: 'var(--text-3)' }}>{user.registered}</td>
                  <td>
                    {user.is_active
                      ? <span className="badge badge-green">Faol</span>
                      : <span className="badge badge-red">Nofaol</span>
                    }
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" title="Ko'rish" onClick={() => setDetailUser(user)}><Eye size={15} /></button>
                      <button className="btn-icon" title="Tahrirlash" onClick={() => setEditUser(user)}><Edit3 size={15} /></button>
                      <button className="btn-icon" title={user.is_active ? 'Bloklash' : 'Faollashtirish'} onClick={() => toggleActive(user)}>
                        {user.is_active ? <Ban size={15} style={{ color: 'var(--red)' }} /> : <CheckCircle size={15} style={{ color: 'var(--green)' }} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal (centered, not drawer) */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Foydalanuvchini tahrirlash</h3>
              <button className="btn-icon" onClick={() => setEditUser(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">To'liq ism</label>
                <input className="input" defaultValue={editUser.full_name} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" defaultValue={editUser.email} />
              </div>
              <div className="input-group">
                <label className="input-label">Plan</label>
                <select className="input select" defaultValue={editUser.plan}>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-1)' }}>
                  <button className={`toggle ${editUser.is_active ? 'active' : ''}`} />
                  Faol
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-1)' }}>
                  <button className={`toggle ${editUser.is_verified ? 'active' : ''}`} />
                  Tasdiqlangan
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditUser(null)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={() => { addToast('Saqlandi', `${editUser.full_name} yangilandi`, 'success'); setEditUser(null); }}>Saqlash</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailUser && (
        <div className="modal-overlay" onClick={() => setDetailUser(null)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Foydalanuvchi tafsiloti</h3>
              <button className="btn-icon" onClick={() => setDetailUser(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div className="avatar avatar-lg" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 800 }}>
                  {detailUser.full_name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-0)' }}>{detailUser.full_name}</div>
                  <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>{detailUser.email}</div>
                </div>
              </div>
              <div className="grid-2">
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Plan</span><div>{planBadge(detailUser.plan)}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Holat</span><div>{detailUser.is_active ? <span className="badge badge-green">Faol</span> : <span className="badge badge-red">Nofaol</span>}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Telegram</span><div style={{ color: 'var(--text-1)' }}>{detailUser.telegram_id || '—'}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Kompaniya</span><div style={{ color: 'var(--text-1)' }}>{detailUser.company || '—'}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Ro'yxatdan o'tgan</span><div style={{ color: 'var(--text-1)' }}>{detailUser.registered}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Tasdiqlangan</span><div>{detailUser.is_verified ? <span className="badge badge-green">Ha</span> : <span className="badge badge-red">Yo'q</span>}</div></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailUser(null)}>Yopish</button>
              <button className="btn btn-primary" onClick={() => { setDetailUser(null); setEditUser(detailUser); }}>Tahrirlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
