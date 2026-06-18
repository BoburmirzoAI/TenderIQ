import { useState } from 'react';
import { TrendingUp, DollarSign, MapPin, Tag, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';

const categoryData = [
  { name: 'IT', count: 245, color: 'var(--blue)' },
  { name: 'Qurilish', count: 312, color: 'var(--orange)' },
  { name: 'Tibbiyot', count: 178, color: 'var(--green)' },
  { name: 'Transport', count: 156, color: 'var(--purple)' },
  { name: 'Ta\'lim', count: 134, color: 'var(--teal)' },
  { name: 'Oziq-ovqat', count: 98, color: 'var(--yellow)' },
  { name: 'Energetika', count: 87, color: 'var(--red)' },
  { name: 'Kommunal', count: 65, color: 'var(--cyan)' },
];

const regionData = [
  { name: 'Toshkent', amount: 45.2 },
  { name: 'Samarqand', amount: 28.1 },
  { name: 'Buxoro', amount: 22.5 },
  { name: 'Farg\'ona', amount: 19.8 },
  { name: 'Andijon', amount: 17.3 },
  { name: 'Navoiy', amount: 15.6 },
  { name: 'Namangan', amount: 12.4 },
  { name: 'Qashqadaryo', amount: 11.2 },
  { name: 'Surxondaryo', amount: 8.9 },
  { name: 'Xorazm', amount: 7.5 },
];

const anomalies = [
  { id: 1, tender: 'IT uskunalar tenderi #4521', type: 'price', severity: 'high', details: 'Narx o\'rtachadan 340% yuqori — 4.5 mlrd so\'m (o\'rtacha: 1.02 mlrd)' },
  { id: 2, tender: 'Qurilish tenderi #3890', type: 'deadline', severity: 'medium', details: 'Juda qisqa muddat — 3 kun (o\'rtacha: 21 kun)' },
  { id: 3, tender: 'Transport tenderi #4102', type: 'requirements', severity: 'low', details: 'Talablar soni juda kam — 2 ta (o\'rtacha: 8 ta)' },
  { id: 4, tender: 'Tibbiyot tenderi #4388', type: 'price', severity: 'high', details: 'Narx juda past — 12 mln (o\'rtacha: 280 mln)' },
  { id: 5, tender: 'Energetika tenderi #4450', type: 'deadline', severity: 'medium', details: 'Muddatdan keyin e\'lon qilingan — deadline o\'tgan' },
  { id: 6, tender: 'Qurilish tenderi #4501', type: 'requirements', severity: 'high', details: 'O\'ta tor texnik talablar — faqat 1 ta kompaniya mos keladi' },
];

const severityBadge = (s: string) => {
  const cls = s === 'high' ? 'badge-red' : s === 'medium' ? 'badge-yellow' : 'badge-blue';
  const label = s === 'high' ? 'Yuqori' : s === 'medium' ? 'O\'rta' : 'Past';
  return <span className={`badge ${cls}`}>{label}</span>;
};

const typeBadge = (t: string) => {
  const cls = t === 'price' ? 'badge-purple' : t === 'deadline' ? 'badge-cyan' : 'badge-green';
  const label = t === 'price' ? 'Narx' : t === 'deadline' ? 'Muddat' : 'Talablar';
  return <span className={`badge ${cls}`}>{label}</span>;
};

export default function Analytics() {
  const { addToast } = useAdmin();

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Analitika</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Bozor tahlili va anomaliyalar</p>
        </div>
      </div>

      <div className="grid-4 mb-24">
        {[
          { label: 'Umumiy bozor qiymati', value: '188.5 mlrd', icon: DollarSign, color: 'var(--green)', bg: 'var(--green-soft)' },
          { label: 'O\'rtacha tender summasi', value: '148.7 mln', icon: TrendingUp, color: 'var(--blue)', bg: 'var(--blue-soft)' },
          { label: 'Top kategoriya', value: 'Qurilish', icon: Tag, color: 'var(--orange)', bg: 'var(--orange-soft)' },
          { label: 'Top hudud', value: 'Toshkent', icon: MapPin, color: 'var(--purple)', bg: 'var(--purple-soft)' },
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

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="card-header"><h3>Kategoriya bo'yicha tenderlar</h3></div>
          <div className="card-body" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Hudud bo'yicha summa (mlrd so'm)</h3></div>
          <div className="card-body" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="amount" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} style={{ color: 'var(--orange)' }} />
          <h3>Aniqlangan anomaliyalar</h3>
          <span className="badge badge-red" style={{ marginLeft: '8px' }}>{anomalies.length}</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tender</th>
                <th>Turi</th>
                <th>Darajasi</th>
                <th>Tafsilotlar</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map(a => (
                <tr key={a.id}>
                  <td>#{a.id}</td>
                  <td><strong style={{ fontSize: '13px' }}>{a.tender}</strong></td>
                  <td>{typeBadge(a.type)}</td>
                  <td>{severityBadge(a.severity)}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-3)', maxWidth: '350px' }}>{a.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
