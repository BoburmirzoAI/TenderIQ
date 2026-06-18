import { useState } from 'react';
import { Swords, TrendingUp, TrendingDown, Eye, Search, Filter, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const competitors = [
  { id: 1, name: 'TechBuild Solutions', tenders_won: 145, tenders_lost: 89, win_rate: 62, total_amount: '12.4B', region: 'Toshkent', category: 'IT & Texnologiya', trend: 'up', active: true },
  { id: 2, name: 'Qurilish Plus LLC', tenders_won: 234, tenders_lost: 156, win_rate: 60, total_amount: '28.7B', region: 'Toshkent', category: 'Qurilish', trend: 'up', active: true },
  { id: 3, name: 'MedSupply UZ', tenders_won: 98, tenders_lost: 67, win_rate: 59, total_amount: '5.2B', region: 'Samarqand', category: 'Tibbiyot', trend: 'down', active: true },
  { id: 4, name: 'Agro Trade Group', tenders_won: 178, tenders_lost: 201, win_rate: 47, total_amount: '15.8B', region: 'Farg\'ona', category: 'Qishloq xo\'jaligi', trend: 'down', active: true },
  { id: 5, name: 'EduTech Innovations', tenders_won: 56, tenders_lost: 34, win_rate: 62, total_amount: '3.1B', region: 'Buxoro', category: 'Ta\'lim', trend: 'up', active: false },
  { id: 6, name: 'TransLogistics UZ', tenders_won: 112, tenders_lost: 88, win_rate: 56, total_amount: '9.6B', region: 'Navoiy', category: 'Transport', trend: 'up', active: true },
  { id: 7, name: 'Green Energy Corp', tenders_won: 67, tenders_lost: 45, win_rate: 60, total_amount: '7.3B', region: 'Toshkent', category: 'Energetika', trend: 'up', active: true },
  { id: 8, name: 'FoodService Pro', tenders_won: 89, tenders_lost: 123, win_rate: 42, total_amount: '4.5B', region: 'Andijon', category: 'Oziq-ovqat', trend: 'down', active: false },
];

const categoryStats = [
  { name: 'IT', count: 245, color: '#0ea5e9' },
  { name: 'Qurilish', count: 390, color: '#10b981' },
  { name: 'Tibbiyot', count: 165, color: '#f59e0b' },
  { name: 'Qishloq', count: 379, color: '#ef4444' },
  { name: 'Transport', count: 200, color: '#8b5cf6' },
  { name: 'Energetika', count: 112, color: '#06b6d4' },
];

const monthlyActivity = [
  { month: 'Yan', won: 45, lost: 32 },
  { month: 'Fev', won: 52, lost: 28 },
  { month: 'Mar', won: 61, lost: 35 },
  { month: 'Apr', won: 48, lost: 41 },
  { month: 'May', won: 73, lost: 29 },
  { month: 'Iyun', won: 68, lost: 37 },
];

export default function Competitors() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'list' | 'analytics'>('list');
  const [detail, setDetail] = useState<typeof competitors[0] | null>(null);

  const filtered = competitors.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.region.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Raqobatchilar</h1>
        <div className="tabs">
          <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>Ro'yxat</button>
          <button className={`tab ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>Tahlil</button>
        </div>
      </div>

      {tab === 'list' && (
        <>
          <div className="grid-4 mb-24">
            <div className="card stat-card">
              <div className="flex-between mb-8">
                <span className="stat-label">Jami raqobatchilar</span>
                <Swords size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <div className="stat-value">{competitors.length}</div>
            </div>
            <div className="card stat-card">
              <div className="flex-between mb-8">
                <span className="stat-label">O'rtacha win rate</span>
                <TrendingUp size={16} style={{ color: 'var(--green)' }} />
              </div>
              <div className="stat-value">{Math.round(competitors.reduce((a, c) => a + c.win_rate, 0) / competitors.length)}%</div>
            </div>
            <div className="card stat-card">
              <div className="flex-between mb-8">
                <span className="stat-label">Faol</span>
                <Eye size={16} style={{ color: 'var(--blue)' }} />
              </div>
              <div className="stat-value">{competitors.filter(c => c.active).length}</div>
            </div>
            <div className="card stat-card">
              <div className="flex-between mb-8">
                <span className="stat-label">Kategoriyalar</span>
                <Filter size={16} style={{ color: 'var(--purple)' }} />
              </div>
              <div className="stat-value">{new Set(competitors.map(c => c.category)).size}</div>
            </div>
          </div>

          <div className="card mb-24">
            <div className="card-header flex-between">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Raqobatchilar ro'yxati</span>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input className="input" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: '32px', width: '240px', height: '34px' }} />
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Kompaniya</th>
                    <th>Kategoriya</th>
                    <th>Hudud</th>
                    <th>Yutilgan</th>
                    <th>Yutqazilgan</th>
                    <th>Win Rate</th>
                    <th>Umumiy summa</th>
                    <th>Trend</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} onClick={() => setDetail(c)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 600, color: 'var(--text-0)' }}>{c.name}</td>
                      <td><span className="badge badge-blue">{c.category}</span></td>
                      <td style={{ color: 'var(--text-2)' }}>{c.region}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 600 }}>{c.tenders_won}</td>
                      <td style={{ color: 'var(--red)', fontWeight: 600 }}>{c.tenders_lost}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div className="progress" style={{ width: '60px', height: '6px' }}>
                            <div className="progress-fill" style={{
                              width: `${c.win_rate}%`,
                              background: c.win_rate >= 55 ? 'var(--green)' : c.win_rate >= 45 ? 'var(--yellow)' : 'var(--red)'
                            }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{c.win_rate}%</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>{c.total_amount} UZS</td>
                      <td>
                        {c.trend === 'up'
                          ? <TrendingUp size={16} style={{ color: 'var(--green)' }} />
                          : <TrendingDown size={16} style={{ color: 'var(--red)' }} />
                        }
                      </td>
                      <td><span className={`badge ${c.active ? 'badge-green' : 'badge-red'}`}>{c.active ? 'Faol' : 'Nofaol'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'analytics' && (
        <div className="grid-2 mb-24">
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Oylik faollik</span>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyActivity}>
                  <XAxis dataKey="month" stroke="var(--text-4)" fontSize={12} />
                  <YAxis stroke="var(--text-4)" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', color: 'var(--text-0)' }} />
                  <Bar dataKey="won" fill="var(--green)" radius={[4, 4, 0, 0]} name="Yutilgan" />
                  <Bar dataKey="lost" fill="var(--red)" radius={[4, 4, 0, 0]} name="Yutqazilgan" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Kategoriya bo'yicha</span>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryStats} cx="50%" cy="50%" outerRadius={100} dataKey="count"
                    label={({ name, count }: any) => `${name}: ${count}`}>
                    {categoryStats.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', color: 'var(--text-0)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>{detail.name}</h3>
              <button className="btn-icon" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid-2">
                <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Kategoriya</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-0)' }}>{detail.category}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Hudud</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-0)' }}>{detail.region}</div>
                </div>
              </div>
              <div className="grid-3">
                <div style={{ textAlign: 'center', padding: '16px', background: 'var(--green-soft)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green)' }}>{detail.tenders_won}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Yutilgan</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: 'var(--red-soft)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--red)' }}>{detail.tenders_lost}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Yutqazilgan</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: 'var(--primary-soft)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{detail.win_rate}%</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Win Rate</div>
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Umumiy tender summasi</div>
                <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-0)' }}>{detail.total_amount} UZS</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
