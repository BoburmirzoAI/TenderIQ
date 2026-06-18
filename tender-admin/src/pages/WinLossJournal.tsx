import { useState } from 'react';
import { Trophy, XCircle, TrendingUp, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';

interface JournalEntry {
  id: number;
  tender: string;
  result: 'win' | 'loss';
  amount: number;
  competitor: string;
  lessons: string;
  date: string;
}

const mockEntries: JournalEntry[] = [
  { id: 1, tender: 'IT uskunalarni yetkazib berish', result: 'win', amount: 450000000, competitor: 'TechWorld', lessons: 'Narx strategiyasi to\'g\'ri tanlangan. Texnik taklif sifati yuqori bo\'ldi.', date: '2026-06-10' },
  { id: 2, tender: 'Binoni ta\'mirlash ishlari', result: 'loss', amount: 1200000000, competitor: 'BuildMax', lessons: 'Raqobatchi narxi 15% pastroq edi. Keyingi safar bozor narxini chuqurroq tahlil qilish kerak.', date: '2026-06-08' },
  { id: 3, tender: 'Dori vositalari sotib olish', result: 'win', amount: 320000000, competitor: 'MedTrade', lessons: 'Sertifikatlar va litsenziyalar to\'liq bo\'lgani uchun ustunlik ega bo\'ldik.', date: '2026-05-28' },
  { id: 4, tender: 'Transport xizmatlari', result: 'loss', amount: 89000000, competitor: 'TransLogic', lessons: 'Mashina parki yetarli emasligi sababli ballar past bo\'ldi.', date: '2026-05-20' },
  { id: 5, tender: 'Maktab inventari yetkazish', result: 'win', amount: 156000000, competitor: 'EduSupply', lessons: 'Mahalliy ishlab chiqaruvchi ekanligimiz afzallik berdi.', date: '2026-05-15' },
  { id: 6, tender: 'Server va tarmoq jihozlari', result: 'win', amount: 780000000, competitor: 'NetSolutions', lessons: 'Texnik xodimlar tajribasi va kafolat shartlari hal qiluvchi omil bo\'ldi.', date: '2026-05-10' },
  { id: 7, tender: 'Oziq-ovqat yetkazib berish', result: 'loss', amount: 195000000, competitor: 'FoodMaster', lessons: 'Logistika xarajatlari yuqori, samaradorlikni oshirish kerak.', date: '2026-05-05' },
  { id: 8, tender: 'Yo\'l ta\'mirlash loyihasi', result: 'loss', amount: 3500000000, competitor: 'RoadBuild Pro', lessons: 'Tajriba yetarli emas edi, portfelni kengaytirish zarur.', date: '2026-04-28' },
  { id: 9, tender: 'Tibbiy asbob-uskunalar', result: 'win', amount: 540000000, competitor: 'MedEquip', lessons: 'ISO sertifikati va xalqaro brend vakili ekanligimiz yordam berdi.', date: '2026-04-20' },
  { id: 10, tender: 'Elektr jihozlari ta\'minoti', result: 'win', amount: 280000000, competitor: 'ElectroPower', lessons: 'Tezkor yetkazib berish muddati va past narx strategiyasi ishladi.', date: '2026-04-15' },
];

const fmtAmount = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${Math.round(n / 1e6).toLocaleString('ru-RU')} mln`;
  return n.toLocaleString('ru-RU');
};

const wins = mockEntries.filter(e => e.result === 'win').length;
const losses = mockEntries.filter(e => e.result === 'loss').length;
const winRate = Math.round((wins / mockEntries.length) * 100);
const avgDealSize = Math.round(mockEntries.reduce((s, e) => s + e.amount, 0) / mockEntries.length);

const winRateOverTime = [
  { month: 'Yan', rate: 50 }, { month: 'Fev', rate: 55 }, { month: 'Mar', rate: 60 },
  { month: 'Apr', rate: 58 }, { month: 'May', rate: 65 }, { month: 'Iyun', rate: winRate },
];

const winsByCategory = [
  { name: 'IT', value: 3, color: 'var(--blue)' },
  { name: 'Tibbiyot', value: 2, color: 'var(--green)' },
  { name: 'Ta\'lim', value: 1, color: 'var(--yellow)' },
];

const lossReasons = [
  { reason: 'Narx yuqori', count: 3 },
  { reason: 'Tajriba yetarli emas', count: 2 },
  { reason: 'Texnik imkoniyat', count: 1 },
  { reason: 'Logistika', count: 1 },
];

const tdStyle: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };

const formatDate = (d: string) => {
  const [y, m, day] = d.split('-');
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
  return `${day} ${months[parseInt(m) - 1]} ${y}`;
};

export default function WinLossJournal() {
  const { addToast } = useAdmin();
  const [tab, setTab] = useState<'entries' | 'stats'>('entries');
  const [detailEntry, setDetailEntry] = useState<JournalEntry | null>(null);

  const handleSaveEntry = () => {
    addToast('Saqlandi', 'Yozuv muvaffaqiyatli saqlandi', 'success');
    setDetailEntry(null);
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Yutish/Yutqazish jurnali</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Tender natijalarini kuzatish</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-4 mb-24">
        <div className="card stat-card" style={{ border: '1px solid var(--border)' }}>
          <span className="stat-label">Jami tenderlar</span>
          <div className="stat-value" style={{ marginTop: '8px' }}>{mockEntries.length}</div>
        </div>
        <div className="card stat-card" style={{ border: '1px solid var(--border)' }}>
          <div className="flex-between mb-8">
            <span className="stat-label">Yutishlar</span>
            <Trophy size={16} style={{ color: 'var(--green)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{wins}</div>
        </div>
        <div className="card stat-card" style={{ border: '1px solid var(--border)' }}>
          <div className="flex-between mb-8">
            <span className="stat-label">Yutqazishlar</span>
            <XCircle size={16} style={{ color: 'var(--red)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{losses}</div>
        </div>
        <div className="card stat-card" style={{ border: '1px solid var(--border)' }}>
          <div className="flex-between mb-8">
            <span className="stat-label">Yutish darajasi</span>
            <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value">{winRate}%</div>
        </div>
      </div>

      {/* Avg deal size banner */}
      <div className="card mb-24" style={{ border: '1px solid var(--border)' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 600 }}>O'rtacha bitim hajmi:</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>{fmtAmount(avgDealSize)} so'm</div>
        </div>
      </div>

      <div className="tabs mb-24">
        <button className={`tab ${tab === 'entries' ? 'active' : ''}`} onClick={() => setTab('entries')}>Yozuvlar</button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>Statistika</button>
      </div>

      {tab === 'entries' && (
        <div className="card" style={{ border: '1px solid var(--border)' }}>
          <div className="table-wrap">
            <table className="table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '44px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: '110px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={tdStyle}>ID</th>
                  <th style={tdStyle}>Tender</th>
                  <th style={tdStyle}>Natija</th>
                  <th style={tdStyle}>Summa</th>
                  <th style={tdStyle}>Raqobatchi</th>
                  <th style={tdStyle}>Xulosa</th>
                  <th style={tdStyle}>Sana</th>
                </tr>
              </thead>
              <tbody>
                {mockEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onClick={() => setDetailEntry(entry)}
                  >
                    <td style={tdStyle}>{entry.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.tender}</td>
                    <td style={tdStyle}>
                      <span className={`badge ${entry.result === 'win' ? 'badge-green' : 'badge-red'}`}>
                        {entry.result === 'win' ? 'Yutdi' : 'Yutqazdi'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{fmtAmount(entry.amount)}</td>
                    <td style={tdStyle}>
                      <span className="badge badge-blue">{entry.competitor}</span>
                    </td>
                    <td style={{ ...tdStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: '13px' }}>
                      {entry.lessons}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '13px', color: 'var(--text-4)' }}>{formatDate(entry.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid-2" style={{ gap: '24px' }}>
          <div className="card" style={{ border: '1px solid var(--border)' }}>
            <div className="card-body">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-0)' }}>Yutish darajasi dinamikasi</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={winRateOverTime}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card" style={{ border: '1px solid var(--border)' }}>
            <div className="card-body">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-0)' }}>Kategoriya bo'yicha yutishlar</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={winsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(props: any) => `${props.name}: ${props.value}`}>
                    {winsByCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card" style={{ gridColumn: '1 / -1', border: '1px solid var(--border)' }}>
            <div className="card-body">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-0)' }}>Yutqazish sabablari</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={lossReasons}>
                  <XAxis dataKey="reason" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--red)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailEntry && (
        <div className="modal-overlay" onClick={() => setDetailEntry(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-0)', marginBottom: '4px' }}>{detailEntry.tender}</h2>
                <span className={`badge ${detailEntry.result === 'win' ? 'badge-green' : 'badge-red'}`}>
                  {detailEntry.result === 'win' ? 'G\'alaba' : 'Mag\'lubiyat'}
                </span>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => setDetailEntry(null)}><X size={14} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid-2" style={{ gap: '12px' }}>
                <div style={{ padding: '14px', background: 'var(--bg-1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Summa</div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: detailEntry.result === 'win' ? 'var(--green)' : 'var(--red)' }}>
                    {fmtAmount(detailEntry.amount)} so'm
  </div>
                </div>
                <div style={{ padding: '14px', background: 'var(--bg-1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Raqobatchi</div>
                  <span className="badge badge-blue" style={{ fontSize: '13px' }}>{detailEntry.competitor}</span>
                </div>
                <div style={{ padding: '14px', background: 'var(--bg-1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Sana</div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{formatDate(detailEntry.date)}</div>
                </div>
                <div style={{ padding: '14px', background: 'var(--bg-1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Yozuv ID</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', fontFamily: 'monospace' }}>#{detailEntry.id}</div>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-0)', marginBottom: '10px' }}>Xulosa va saboqlar</h4>
                <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '16px', fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.7', border: '1px solid var(--border)' }}>
                  {detailEntry.lessons}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailEntry(null)}>Yopish</button>
              <button className="btn btn-primary" onClick={handleSaveEntry}>Tahrirlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
