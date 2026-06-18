import { useState } from 'react';
import { Building, CheckCircle, XCircle, Edit3, Trash2, Shield, Search, X, Plus, Eye } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface Company {
  id: number;
  name: string;
  stir: string;
  director: string;
  email: string;
  phone: string;
  region: string;
  industry: string;
  verified: boolean;
  owner: string;
}

const initialCompanies: Company[] = [
  { id: 1, name: 'TechCorp Solutions', stir: '302456789', director: 'Bobur Sobirjonov', email: 'info@techcorp.uz', phone: '+998901234567', region: 'Toshkent', industry: 'IT', verified: true, owner: 'Bobur Sobirjonov' },
  { id: 2, name: 'BuildPro Construction', stir: '304567891', director: 'Aziz Toshmatov', email: 'info@buildpro.uz', phone: '+998912345678', region: 'Samarqand', industry: 'Qurilish', verified: true, owner: 'Aziz Toshmatov' },
  { id: 3, name: 'MediSupply Trading', stir: '301234567', director: 'Sherzod Umarov', email: 'info@medisupply.uz', phone: '+998933456789', region: 'Buxoro', industry: 'Tibbiyot', verified: true, owner: 'Sherzod Umarov' },
  { id: 4, name: 'LogiTrans Logistics', stir: '305678912', director: 'Farhod Aliyev', email: 'info@logitrans.uz', phone: '+998944567890', region: 'Farg\'ona', industry: 'Transport', verified: false, owner: 'Farhod Aliyev' },
  { id: 5, name: 'GreenBuild Eco', stir: '303456789', director: 'Ravshan Nazarov', email: 'info@greenbuild.uz', phone: '+998955678901', region: 'Navoiy', industry: 'Qurilish', verified: false, owner: 'Ravshan Nazarov' },
  { id: 6, name: 'EduSupply Partners', stir: '306789123', director: 'Kamola Tursunova', email: 'info@edusupply.uz', phone: '+998966789012', region: 'Andijon', industry: 'Ta\'lim', verified: true, owner: 'Kamola Tursunova' },
];

const emptyForm: Omit<Company, 'id'> = {
  name: '', stir: '', director: '', email: '', phone: '', region: '', industry: '', verified: false, owner: '',
};

export default function Companies() {
  const { addToast } = useAdmin();
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [search, setSearch] = useState('');
  const [detailCompany, setDetailCompany] = useState<Company | null>(null);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState<Company | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<Omit<Company, 'id'>>(emptyForm);

  const verified = companies.filter(c => c.verified).length;
  const unverified = companies.filter(c => !c.verified).length;

  const filtered = companies.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.stir.includes(q) || c.director.toLowerCase().includes(q);
  });

  const openEdit = (company: Company) => {
    setEditCompany(company);
    setEditForm({ ...company });
  };

  const saveEdit = () => {
    if (!editForm) return;
    setCompanies(prev => prev.map(c => c.id === editForm.id ? editForm : c));
    addToast('Saqlandi', `${editForm.name} ma'lumotlari yangilandi`, 'success');
    setEditCompany(null);
    setEditForm(null);
  };

  const handleVerify = (company: Company) => {
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, verified: true } : c));
    addToast('Tasdiqlandi', `${company.name} tasdiqlandi`, 'success');
  };

  const handleDelete = (company: Company) => {
    setCompanies(prev => prev.filter(c => c.id !== company.id));
    addToast('O\'chirildi', `${company.name} o'chirildi`, 'info');
  };

  const handleCreate = () => {
    if (!createForm.name.trim()) return;
    const newCompany: Company = { id: Date.now(), ...createForm };
    setCompanies(prev => [...prev, newCompany]);
    setShowCreate(false);
    setCreateForm(emptyForm);
    addToast('Qo\'shildi', `${newCompany.name} muvaffaqiyatli qo'shildi`, 'success');
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Kompaniyalar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Barcha kompaniya profillari</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Kompaniya qo'shish
        </button>
      </div>

      <div className="grid-3 mb-24">
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Jami kompaniyalar</span>
            <Building size={16} style={{ color: 'var(--blue)' }} />
          </div>
          <div className="stat-value">{companies.length}</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Tasdiqlangan</span>
            <CheckCircle size={16} style={{ color: 'var(--green)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{verified}</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Tasdiqlanmagan</span>
            <XCircle size={16} style={{ color: 'var(--orange)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--orange)' }}>{unverified}</div>
        </div>
      </div>

      <div className="card mb-24">
        <div className="card-body" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="input" placeholder="Nomi, STIR yoki direktor..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nomi</th>
                <th>STIR</th>
                <th>Direktor</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Hudud</th>
                <th>Soha</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr key={c.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--bg-1)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-4)' }}>{c.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-0)' }} onClick={() => setDetailCompany(c)}>{c.name}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px' }}>{c.stir}</td>
                  <td style={{ padding: '12px 16px' }}>{c.director}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-3)' }}>{c.email}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px' }}>{c.phone}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-3)' }}>{c.region || '—'}</td>
                  <td style={{ padding: '12px 16px' }}><span className="badge badge-primary">{c.industry}</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${c.verified ? 'badge-green' : 'badge-yellow'}`}>
                      {c.verified ? 'Tasdiqlangan' : 'Kutilmoqda'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="table-actions">
                      <button className="btn-icon" title="Ko'rish" onClick={() => setDetailCompany(c)}><Eye size={14} /></button>
                      <button className="btn-icon" title="Tahrirlash" onClick={() => openEdit(c)}><Edit3 size={14} /></button>
                      {!c.verified && <button className="btn-icon" title="Tasdiqlash" onClick={() => handleVerify(c)}><Shield size={14} style={{ color: 'var(--green)' }} /></button>}
                      <button className="btn-icon" title="O'chirish" onClick={() => handleDelete(c)}><Trash2 size={14} style={{ color: 'var(--red)' }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailCompany && (
        <div className="modal-overlay" onClick={() => setDetailCompany(null)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>{detailCompany.name}</h3>
              <button className="btn-icon" onClick={() => setDetailCompany(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap: '16px' }}>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>STIR</span><div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{detailCompany.stir}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Holat</span><div><span className={`badge ${detailCompany.verified ? 'badge-green' : 'badge-yellow'}`}>{detailCompany.verified ? 'Tasdiqlangan' : 'Kutilmoqda'}</span></div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Direktor</span><div style={{ color: 'var(--text-1)', fontWeight: 600 }}>{detailCompany.director}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Egasi</span><div style={{ color: 'var(--text-1)' }}>{detailCompany.owner}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Email</span><div style={{ color: 'var(--text-1)' }}>{detailCompany.email}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Telefon</span><div style={{ color: 'var(--text-1)' }}>{detailCompany.phone}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Hudud</span><div style={{ color: 'var(--text-1)' }}>{detailCompany.region || '—'}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Soha</span><div><span className="badge badge-primary">{detailCompany.industry}</span></div></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailCompany(null)}>Yopish</button>
              <button className="btn btn-primary" onClick={() => { setDetailCompany(null); openEdit(detailCompany); }}>Tahrirlash</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editCompany && editForm && (
        <div className="modal-overlay" onClick={() => { setEditCompany(null); setEditForm(null); }}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Kompaniyani tahrirlash</h3>
              <button className="btn-icon" onClick={() => { setEditCompany(null); setEditForm(null); }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Nomi</label>
                <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">STIR</label>
                <input className="input" value={editForm.stir} onChange={(e) => setEditForm({ ...editForm, stir: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Direktor</label>
                <input className="input" value={editForm.director} onChange={(e) => setEditForm({ ...editForm, director: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Telefon</label>
                <input className="input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Hudud</label>
                <input className="input" value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Soha</label>
                <input className="input" value={editForm.industry} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setEditCompany(null); setEditForm(null); }}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={saveEdit}>Saqlash</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Kompaniya qo'shish</h3>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Nomi *</label>
                <input className="input" placeholder="Kompaniya nomi" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">STIR</label>
                <input className="input" placeholder="302456789" value={createForm.stir} onChange={e => setCreateForm({ ...createForm, stir: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Direktor</label>
                <input className="input" placeholder="F.I.O" value={createForm.director} onChange={e => setCreateForm({ ...createForm, director: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" type="email" placeholder="info@company.uz" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Telefon</label>
                <input className="input" placeholder="+998901234567" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Hudud</label>
                <input className="input" placeholder="Toshkent" value={createForm.region} onChange={e => setCreateForm({ ...createForm, region: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Soha</label>
                <input className="input" placeholder="IT, Qurilish, Tibbiyot..." value={createForm.industry} onChange={e => setCreateForm({ ...createForm, industry: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleCreate}>Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
