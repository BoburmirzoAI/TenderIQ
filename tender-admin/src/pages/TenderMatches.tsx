import { useState } from 'react';
import { Search, Trash2, Eye, Bell, BellOff, Filter, Target } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface Match {
  id: number;
  tenderTitle: string;
  company: string;
  score: number;
  notified: boolean;
  channel: 'telegram' | 'email' | 'both';
  createdAt: string;
}

const mockMatches: Match[] = [
  { id: 1, tenderTitle: 'IT uskunalarni yetkazib berish', company: 'TechCorp LLC', score: 92, notified: true, channel: 'both', createdAt: '2026-06-17 14:30' },
  { id: 2, tenderTitle: 'Binoni ta\'mirlash ishlari', company: 'BuildPro MCHJ', score: 85, notified: true, channel: 'telegram', createdAt: '2026-06-17 12:15' },
  { id: 3, tenderTitle: 'Dori vositalari sotib olish', company: 'MediSupply', score: 78, notified: false, channel: 'email', createdAt: '2026-06-17 10:00' },
  { id: 4, tenderTitle: 'Transport xizmatlari', company: 'LogiTrans MCHJ', score: 71, notified: true, channel: 'telegram', createdAt: '2026-06-16 16:45' },
  { id: 5, tenderTitle: 'Server va tarmoq jihozlari', company: 'TechCorp LLC', score: 88, notified: true, channel: 'both', createdAt: '2026-06-16 14:20' },
  { id: 6, tenderTitle: 'Maktab inventari yetkazish', company: 'EduSupply', score: 62, notified: false, channel: 'email', createdAt: '2026-06-16 09:30' },
  { id: 7, tenderTitle: 'Yo\'l ta\'mirlash loyihasi', company: 'GreenBuild', score: 45, notified: false, channel: 'telegram', createdAt: '2026-06-15 17:00' },
  { id: 8, tenderTitle: 'Oziq-ovqat yetkazib berish', company: 'FoodLine MCHJ', score: 83, notified: true, channel: 'both', createdAt: '2026-06-15 11:10' },
];

const scoreBadge = (score: number) => {
  const cls = score >= 80 ? 'badge-green' : score >= 65 ? 'badge-yellow' : 'badge-red';
  return <span className={`badge ${cls}`}>{score}%</span>;
};

export default function TenderMatches() {
  const { addToast } = useAdmin();
  const [matches, setMatches] = useState(mockMatches);
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterNotified, setFilterNotified] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);
  const [detail, setDetail] = useState<Match | null>(null);

  const companies = [...new Set(mockMatches.map(m => m.company))];

  const filtered = matches.filter(m => {
    if (filterCompany !== 'all' && m.company !== filterCompany) return false;
    if (filterNotified === 'yes' && !m.notified) return false;
    if (filterNotified === 'no' && m.notified) return false;
    if (m.score < minScore || m.score > maxScore) return false;
    return true;
  });

  const stats = {
    total: matches.length,
    avgScore: Math.round(matches.reduce((a, m) => a + m.score, 0) / matches.length),
    highMatches: matches.filter(m => m.score > 80).length,
    notified: matches.filter(m => m.notified).length,
  };

  const deleteMatch = (id: number) => {
    setMatches(prev => prev.filter(m => m.id !== id));
    addToast('O\'chirildi', 'Match o\'chirildi', 'info');
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Tender Matchlar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>AI tomonidan aniqlangan tender moslashuv natijalari</p>
        </div>
      </div>

      <div className="grid-4 mb-24">
        {[
          { label: 'Jami matchlar', value: stats.total, color: 'var(--blue)', bg: 'var(--blue-soft)', icon: Target },
          { label: 'O\'rtacha ball', value: `${stats.avgScore}%`, color: 'var(--teal)', bg: 'var(--teal-soft)', icon: Filter },
          { label: 'Yuqori (>80%)', value: stats.highMatches, color: 'var(--green)', bg: 'var(--green-soft)', icon: Bell },
          { label: 'Xabarnoma yuborilgan', value: stats.notified, color: 'var(--purple)', bg: 'var(--purple-soft)', icon: Bell },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="flex-between mb-8">
              <span className="stat-label">{s.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
            </div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card mb-24">
        <div className="card-body" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="input select" style={{ width: '180px' }} value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
            <option value="all">Barcha kompaniyalar</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input select" style={{ width: '160px' }} value={filterNotified} onChange={e => setFilterNotified(e.target.value)}>
            <option value="all">Barcha holatlar</option>
            <option value="yes">Xabarnoma yuborilgan</option>
            <option value="no">Yuborilmagan</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span>Ball:</span>
            <input type="number" className="input" style={{ width: '70px' }} value={minScore} onChange={e => setMinScore(Number(e.target.value))} min={0} max={100} />
            <span>—</span>
            <input type="number" className="input" style={{ width: '70px' }} value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} min={0} max={100} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tender nomi</th>
                <th>Kompaniya</th>
                <th>Ball</th>
                <th>Xabarnoma</th>
                <th>Kanal</th>
                <th>Sana</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>#{m.id}</td>
                  <td><strong>{m.tenderTitle}</strong></td>
                  <td style={{ color: 'var(--text-3)' }}>{m.company}</td>
                  <td>{scoreBadge(m.score)}</td>
                  <td>
                    {m.notified
                      ? <span className="badge badge-green">Yuborilgan</span>
                      : <span className="badge badge-red">Kutilmoqda</span>}
                  </td>
                  <td><span className="badge badge-cyan">{m.channel}</span></td>
                  <td style={{ fontSize: '12px', color: 'var(--text-4)' }}>{m.createdAt}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-sm" onClick={() => setDetail(m)}><Eye size={13} /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteMatch(m.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-4)', padding: '32px' }}>Natija topilmadi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
            <div className="flex-between mb-16">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Match tafsilotlari</h2>
              <button className="btn btn-sm" onClick={() => setDetail(null)}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><strong>Tender:</strong> {detail.tenderTitle}</div>
              <div><strong>Kompaniya:</strong> {detail.company}</div>
              <div><strong>Ball:</strong> {scoreBadge(detail.score)}</div>
              <div><strong>Kanal:</strong> <span className="badge badge-cyan">{detail.channel}</span></div>
              <div><strong>Yaratilgan:</strong> {detail.createdAt}</div>
              <div><strong>Xabarnoma:</strong> {detail.notified ? 'Yuborilgan' : 'Kutilmoqda'}</div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => { setDetail(null); addToast('OK', 'Batafsil sahifaga o\'tildi', 'info'); }}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
