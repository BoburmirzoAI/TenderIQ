import { useState } from 'react';
import { Search, Bell, Users, Trash2, Eye, X } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface SavedSearch {
  id: number;
  user: string;
  name: string;
  filters: Record<string, string | number | boolean>;
  notify: boolean;
  created_at: string;
  last_triggered: string | null;
  results_count: number;
}

const mockSearches: SavedSearch[] = [
  { id: 1, user: 'Bobur Sobirjonov', name: 'IT tenderlar Toshkent', filters: { category: 'IT', region: 'Toshkent', min_amount: 100000000, source: 'all' }, notify: true, created_at: '2026-05-10', last_triggered: '2026-06-17', results_count: 24 },
  { id: 2, user: 'Jasur Karimov', name: 'Qurilish 500M+', filters: { category: 'Qurilish', min_amount: 500000000, status: 'active' }, notify: true, created_at: '2026-04-22', last_triggered: '2026-06-16', results_count: 15 },
  { id: 3, user: 'Dilnoza Rahimova', name: 'Tibbiyot barcha hududlar', filters: { category: 'Tibbiyot', region: 'all' }, notify: false, created_at: '2026-05-30', last_triggered: null, results_count: 8 },
  { id: 4, user: 'Aziz Toshmatov', name: 'Transport UZEX', filters: { category: 'Transport', source: 'uzex', status: 'active' }, notify: true, created_at: '2026-03-15', last_triggered: '2026-06-15', results_count: 31 },
  { id: 5, user: 'Sherzod Umarov', name: 'Dori va tibbiy jihozlar', filters: { category: 'Tibbiyot', keywords: 'dori, tibbiy, farmatsevtik', min_amount: 50000000 }, notify: true, created_at: '2026-06-01', last_triggered: '2026-06-17', results_count: 12 },
  { id: 6, user: 'Nodira Yusupova', name: 'Samarqand tenderlar', filters: { region: 'Samarqand', status: 'active' }, notify: false, created_at: '2026-05-15', last_triggered: '2026-06-10', results_count: 19 },
  { id: 7, user: 'Otabek Mirzayev', name: 'Server va tarmoq', filters: { keywords: 'server, tarmoq, IT infratuzilma', min_amount: 200000000, source: 'all' }, notify: true, created_at: '2026-06-05', last_triggered: '2026-06-16', results_count: 7 },
  { id: 8, user: 'Malika Nurmatova', name: 'Ta\'lim sohasidagi tenderlar', filters: { category: 'Ta\'lim', region: 'all', status: 'active' }, notify: false, created_at: '2026-06-12', last_triggered: null, results_count: 5 },
];

const activeAlerts = mockSearches.filter(s => s.notify).length;
const uniqueUsers = new Set(mockSearches.map(s => s.user)).size;

const tdStyle: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };

export default function SavedSearches() {
  const { addToast } = useAdmin();
  const [detailSearch, setDetailSearch] = useState<SavedSearch | null>(null);
  const [filterModalSearch, setFilterModalSearch] = useState<SavedSearch | null>(null);
  const [searches, setSearches] = useState(mockSearches);

  const handleDelete = (s: SavedSearch) => {
    setSearches(prev => prev.filter(x => x.id !== s.id));
    addToast('O\'chirildi', `"${s.name}" qidiruvi o'chirildi`, 'info');
  };

  const toggleNotify = (s: SavedSearch) => {
    setSearches(prev => prev.map(x => x.id === s.id ? { ...x, notify: !x.notify } : x));
    addToast('Yangilandi', `"${s.name}" bildirishnomasi ${s.notify ? 'o\'chirildi' : 'yoqildi'}`, 'info');
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Saqlangan qidiruvlar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Foydalanuvchilarning saqlangan qidiruvlari</p>
        </div>
      </div>

      <div className="grid-3 mb-24">
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Jami qidiruvlar</span>
            <Search size={16} style={{ color: 'var(--blue)' }} />
          </div>
          <div className="stat-value">{searches.length}</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Faol bildirishnomalar</span>
            <Bell size={16} style={{ color: 'var(--green)' }} />
          </div>
          <div className="stat-value">{searches.filter(s => s.notify).length}</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Foydalanuvchilar</span>
            <Users size={16} style={{ color: 'var(--purple)' }} />
          </div>
          <div className="stat-value">{uniqueUsers}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '48px' }} />
              <col style={{ width: '160px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '160px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '100px' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={tdStyle}>ID</th>
                <th style={tdStyle}>Foydalanuvchi</th>
                <th style={tdStyle}>Qidiruv nomi</th>
                <th style={tdStyle}>Filtrlar</th>
                <th style={tdStyle}>Bildirishnoma</th>
                <th style={tdStyle}>Yaratilgan</th>
                <th style={tdStyle}>Oxirgi</th>
                <th style={tdStyle}>Natijalar</th>
                <th style={tdStyle}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {searches.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>{s.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{s.user}</td>
                  <td style={{ ...tdStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</td>
                  <td style={tdStyle}>
                    <button
                      className="badge badge-blue"
                      style={{ cursor: 'pointer', background: 'none', border: '1px solid var(--blue)', color: 'var(--blue)', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}
                      onClick={() => setFilterModalSearch(s)}
                    >
                      {Object.keys(s.filters).length} filtr
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => toggleNotify(s)}
                      style={{
                        width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: s.notify ? 'var(--green)' : 'var(--bg-3)',
                        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: '2px', left: s.notify ? '18px' : '2px',
                        width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                        transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '12px' }}>{s.created_at}</td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-3)' }}>{s.last_triggered || '-'}</td>
                  <td style={tdStyle}><span className="badge badge-primary">{s.results_count}</span></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => setDetailSearch(s)}><Eye size={14} /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter JSON Modal */}
      {filterModalSearch && (
        <div className="modal-overlay" onClick={() => setFilterModalSearch(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-0)' }}>
                Filtrlar — {filterModalSearch.name}
              </h2>
              <button className="btn btn-sm btn-ghost" onClick={() => setFilterModalSearch(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.8', whiteSpace: 'pre-wrap', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                {JSON.stringify(filterModalSearch.filters, null, 2)}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setFilterModalSearch(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailSearch && (
        <div className="modal-overlay" onClick={() => setDetailSearch(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-0)' }}>{detailSearch.name}</h2>
              <button className="btn btn-sm btn-ghost" onClick={() => setDetailSearch(null)}><X size={14} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="stat-label">Foydalanuvchi:</span>
                <span style={{ fontWeight: 600 }}>{detailSearch.user}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span><span className="stat-label">Yaratilgan:</span> {detailSearch.created_at}</span>
                <span><span className="stat-label">Oxirgi:</span> {detailSearch.last_triggered || 'Hali ishga tushmagan'}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="stat-label">Natijalar:</span>
                <span className="badge badge-primary">{detailSearch.results_count}</span>
                <span className="stat-label" style={{ marginLeft: '12px' }}>Bildirishnoma:</span>
                <span className={`badge ${detailSearch.notify ? 'badge-green' : 'badge-red'}`}>{detailSearch.notify ? 'Yoqilgan' : 'O\'chirilgan'}</span>
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-0)' }}>Filtrlar (JSON)</h3>
                <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  {JSON.stringify(detailSearch.filters, null, 2)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailSearch(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
