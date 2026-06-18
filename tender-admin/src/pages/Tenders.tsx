import { useState } from 'react';
import { Play, RefreshCw, Search, Edit3, Trash2, CheckSquare, X } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

const scrapers = [
  { id: 'uzex', name: 'UZEX', lastRun: '2026-06-17 14:20', lastCount: 45, status: 'idle' as const },
  { id: 'mc', name: 'MC.uz', lastRun: '2026-06-17 14:05', lastCount: 28, status: 'idle' as const },
  { id: 'mygov', name: 'MyGov', lastRun: '2026-06-17 13:45', lastCount: 67, status: 'idle' as const },
];

const statusColors: Record<string, string> = {
  active: 'badge-green', closed: 'badge-red', cancelled: 'badge-yellow', awarded: 'badge-purple',
};

const sourceColors: Record<string, string> = {
  uzex: 'badge-primary', mc: 'badge-teal', mygov: 'badge-cyan',
};

const mockTenders = [
  { id: 1, title: 'IT uskunalarni yetkazib berish', source: 'uzex', category: 'IT', region: 'Toshkent', amount: 450000000, status: 'active', deadline: '2026-06-25', published: '2026-06-15' },
  { id: 2, title: 'Binoni ta\'mirlash ishlari', source: 'mc', category: 'Qurilish', region: 'Samarqand', amount: 1200000000, status: 'active', deadline: '2026-06-30', published: '2026-06-14' },
  { id: 3, title: 'Dori vositalari sotib olish', source: 'mygov', category: 'Tibbiyot', region: 'Buxoro', amount: 320000000, status: 'closed', deadline: '2026-06-10', published: '2026-06-01' },
  { id: 4, title: 'Transport xizmatlari', source: 'uzex', category: 'Transport', region: 'Farg\'ona', amount: 89000000, status: 'active', deadline: '2026-07-05', published: '2026-06-16' },
  { id: 5, title: 'Maktab inventari yetkazish', source: 'mc', category: 'Ta\'lim', region: 'Andijon', amount: 156000000, status: 'awarded', deadline: '2026-06-08', published: '2026-05-25' },
  { id: 6, title: 'Yo\'l ta\'mirlash loyihasi', source: 'mygov', category: 'Qurilish', region: 'Navoiy', amount: 3500000000, status: 'active', deadline: '2026-07-15', published: '2026-06-17' },
  { id: 7, title: 'Server va tarmoq jihozlari', source: 'uzex', category: 'IT', region: 'Toshkent', amount: 780000000, status: 'cancelled', deadline: '2026-06-20', published: '2026-06-10' },
];

const fmtAmount = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} mln`;
  return n.toLocaleString();
};

const stats = {
  total: mockTenders.length,
  active: mockTenders.filter(t => t.status === 'active').length,
  closed: mockTenders.filter(t => t.status === 'closed').length,
  cancelled: mockTenders.filter(t => t.status === 'cancelled').length,
  awarded: mockTenders.filter(t => t.status === 'awarded').length,
};

export default function TendersPage() {
  const { addToast } = useAdmin();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [scraperStates, setScraperStates] = useState<Record<string, string>>({});
  const [editTender, setEditTender] = useState<typeof mockTenders[0] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const triggerScraper = (id: string) => {
    setScraperStates(p => ({ ...p, [id]: 'running' }));
    addToast('Scraper', `${id.toUpperCase()} ishga tushirildi`, 'info');
    setTimeout(() => {
      setScraperStates(p => ({ ...p, [id]: 'idle' }));
      addToast('Tayyor', `${id.toUpperCase()} scraper tugadi`, 'success');
    }, 3000);
  };

  const filtered = mockTenders.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterSource !== 'all' && t.source !== filterSource) return false;
    return true;
  });

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(t => t.id)));
  };

  return (
    <div className="page-container">
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)', marginBottom: '24px' }}>Tenderlar</h1>

      <div className="grid-3 mb-24">
        {scrapers.map(s => (
          <div key={s.id} className="card stat-card">
            <div className="flex-between mb-8">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>{s.name}</span>
              <span className={`badge ${(scraperStates[s.id] || s.status) === 'running' ? 'badge-yellow' : 'badge-green'}`}>
                {(scraperStates[s.id] || s.status) === 'running' ? 'Ishlayapti...' : 'Tayyor'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '4px' }}>Oxirgi: {s.lastRun}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>Topildi: {s.lastCount} ta</div>
            <button
              className="btn btn-sm btn-primary btn-full"
              onClick={() => triggerScraper(s.id)}
              disabled={(scraperStates[s.id] || s.status) === 'running'}
            >
              {(scraperStates[s.id] || s.status) === 'running'
                ? <><RefreshCw size={14} className="animate-spin" /> Ishlayapti...</>
                : <><Play size={14} /> Ishga tushirish</>
              }
            </button>
          </div>
        ))}
      </div>

      <div className="card mb-16" style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-3)' }}>Jami: <b style={{ color: 'var(--text-0)' }}>{stats.total}</b></span>
          <span style={{ color: 'var(--green)' }}>Faol: <b>{stats.active}</b></span>
          <span style={{ color: 'var(--red)' }}>Yopilgan: <b>{stats.closed}</b></span>
          <span style={{ color: 'var(--yellow)' }}>Bekor: <b>{stats.cancelled}</b></span>
          <span style={{ color: 'var(--purple)' }}>G'olib: <b>{stats.awarded}</b></span>
        </div>
      </div>

      <div className="card mb-16">
        <div className="card-body" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-with-icon" style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="input" placeholder="Tender nomi..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
          </div>
          <select className="input select" style={{ width: '130px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Barcha holat</option>
            <option value="active">Faol</option>
            <option value="closed">Yopilgan</option>
            <option value="cancelled">Bekor</option>
            <option value="awarded">G'olib</option>
          </select>
          <select className="input select" style={{ width: '130px' }} value={filterSource} onChange={e => setFilterSource(e.target.value)}>
            <option value="all">Barcha manba</option>
            <option value="uzex">UZEX</option>
            <option value="mc">MC</option>
            <option value="mygov">MyGov</option>
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="card mb-16" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--primary-soft)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-0)' }}>{selected.size} ta tanlandi</span>
          <button className="btn btn-sm btn-danger" onClick={() => { addToast('O\'chirildi', `${selected.size} ta tender o'chirildi`, 'info'); setSelected(new Set()); }}>
            <Trash2 size={14} /> O'chirish
          </button>
          <button className="btn btn-sm" onClick={() => setSelected(new Set())}>Bekor qilish</button>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                <th>ID</th>
                <th>Nomi</th>
                <th>Manba</th>
                <th>Kategoriya</th>
                <th>Hudud</th>
                <th>Summa (UZS)</th>
                <th>Holat</th>
                <th>Muddat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td><input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} /></td>
                  <td style={{ color: 'var(--text-4)' }}>{t.id}</td>
                  <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</td>
                  <td><span className={`badge ${sourceColors[t.source]}`}>{t.source.toUpperCase()}</span></td>
                  <td style={{ color: 'var(--text-2)' }}>{t.category}</td>
                  <td style={{ color: 'var(--text-2)' }}>{t.region}</td>
                  <td style={{ fontWeight: 600 }}>{fmtAmount(t.amount)}</td>
                  <td><span className={`badge ${statusColors[t.status]}`}>{t.status}</span></td>
                  <td style={{ color: 'var(--text-3)' }}>{t.deadline}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" onClick={() => setEditTender(t)}><Edit3 size={15} /></button>
                      <button className="btn-icon" onClick={() => addToast('O\'chirildi', `Tender #${t.id} o'chirildi`, 'info')}><Trash2 size={15} style={{ color: 'var(--red)' }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editTender && (
        <div className="modal-overlay" onClick={() => setEditTender(null)}>
          <div className="modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Tenderni tahrirlash #{editTender.id}</h3>
              <button className="btn-icon" onClick={() => setEditTender(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group"><label className="input-label">Nomi</label><input className="input" defaultValue={editTender.title} /></div>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Kategoriya</label><input className="input" defaultValue={editTender.category} /></div>
                <div className="input-group"><label className="input-label">Hudud</label><input className="input" defaultValue={editTender.region} /></div>
              </div>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Summa (UZS)</label><input className="input" type="number" defaultValue={editTender.amount} /></div>
                <div className="input-group">
                  <label className="input-label">Holat</label>
                  <select className="input select" defaultValue={editTender.status}>
                    <option value="active">Faol</option>
                    <option value="closed">Yopilgan</option>
                    <option value="cancelled">Bekor</option>
                    <option value="awarded">G'olib aniqlangan</option>
                  </select>
                </div>
              </div>
              <div className="input-group"><label className="input-label">Muddat</label><input className="input" type="date" defaultValue={editTender.deadline} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditTender(null)}>Bekor</button>
              <button className="btn btn-primary" onClick={() => { addToast('Saqlandi', `Tender #${editTender.id} yangilandi`, 'success'); setEditTender(null); }}>Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
