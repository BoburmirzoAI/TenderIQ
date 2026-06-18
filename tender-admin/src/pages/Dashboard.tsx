import { useState } from 'react';
import {
  Users, FileSearch, TrendingUp, Crown, Building, CreditCard,
  Play, Brain, Send, Database, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';

const kpiCards = [
  { label: 'Foydalanuvchilar', value: '1,248', icon: Users, color: 'var(--blue)', bg: 'var(--blue-soft)' },
  { label: 'Faol Tenderlar', value: '3,567', icon: FileSearch, color: 'var(--teal)', bg: 'var(--teal-soft)' },
  { label: 'Bugungi yangi', value: '142', icon: TrendingUp, color: 'var(--green)', bg: 'var(--green-soft)' },
  { label: 'Pro obunalar', value: '86', icon: Crown, color: 'var(--yellow)', bg: 'var(--yellow-soft)' },
  { label: 'Business obunalar', value: '23', icon: Building, color: 'var(--purple)', bg: 'var(--purple-soft)' },
  { label: 'Jami daromad', value: '47.2M', icon: CreditCard, color: 'var(--orange)', bg: 'var(--orange-soft)' },
];

const chartData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  uzex: Math.floor(Math.random() * 60 + 20),
  mc: Math.floor(Math.random() * 40 + 10),
  mygov: Math.floor(Math.random() * 30 + 5),
}));

const planData = [
  { name: 'Free', value: 1139, color: 'var(--text-3)' },
  { name: 'Pro', value: 86, color: 'var(--yellow)' },
  { name: 'Business', value: 23, color: 'var(--purple)' },
];

const auditLog = [
  { time: '14:32', admin: 'admin@tenderiq.uz', action: 'Scraper ishga tushirildi', resource: 'UZEX', detail: 'Manual trigger' },
  { time: '13:15', admin: 'admin@tenderiq.uz', action: 'Foydalanuvchi bloklandi', resource: 'User #42', detail: 'Spam activity' },
  { time: '12:00', admin: 'system', action: 'ML model retrained', resource: 'PriceModel', detail: '2,450 samples' },
  { time: '09:00', admin: 'system', action: 'Daily digest yuborildi', resource: 'Notifications', detail: '156 users' },
  { time: '08:00', admin: 'system', action: 'Backup yaratildi', resource: 'Database', detail: '2.4GB' },
];

const quickActions = [
  { label: 'Scraper ishga tushirish', icon: Play, color: 'var(--green)' },
  { label: 'ML modelni qayta o\'qitish', icon: Brain, color: 'var(--purple)' },
  { label: 'Broadcast notification', icon: Send, color: 'var(--primary)' },
  { label: 'DB backup', icon: Database, color: 'var(--orange)' },
];

export default function Dashboard() {
  const { addToast } = useAdmin();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = (label: string) => {
    setActionLoading(label);
    addToast('Bajarilmoqda', `${label}...`, 'info');
    setTimeout(() => {
      setActionLoading(null);
      addToast('Tayyor', `${label} muvaffaqiyatli bajarildi`, 'success');
    }, 2000);
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Command Center</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Platformani bir qarashda nazorat qiling</p>
        </div>
      </div>

      <div className="grid-6 mb-24">
        {kpiCards.map((card) => (
          <div key={card.label} className="card stat-card">
            <div className="flex-between mb-8">
              <span className="stat-label">{card.label}</span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <card.icon size={16} style={{ color: card.color }} />
              </div>
            </div>
            <div className="stat-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }} className="mb-24">
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Tender yig'ilish dinamikasi (30 kun)</span>
          </div>
          <div className="card-body" style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gUzex" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--teal)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--teal)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMygov" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--purple)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--text-3)' }}
                />
                <Area type="monotone" dataKey="uzex" stroke="var(--primary)" fill="url(#gUzex)" strokeWidth={2} name="UZEX" />
                <Area type="monotone" dataKey="mc" stroke="var(--teal)" fill="url(#gMc)" strokeWidth={2} name="MC" />
                <Area type="monotone" dataKey="mygov" stroke="var(--purple)" fill="url(#gMygov)" strokeWidth={2} name="MyGov" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Obuna taqsimoti</span>
          </div>
          <div className="card-body" style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {planData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="var(--bg-1)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            {planData.map((p) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
                <span style={{ color: 'var(--text-2)' }}>{p.name}: {p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mb-24">
        <div className="card-header">
          <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>So'nggi harakatlar</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Vaqt</th>
                <th>Admin</th>
                <th>Harakat</th>
                <th>Resurs</th>
                <th>Tafsilot</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((row, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-3)' }}>{row.time}</td>
                  <td>{row.admin}</td>
                  <td>{row.action}</td>
                  <td><span className="badge badge-primary">{row.resource}</span></td>
                  <td style={{ color: 'var(--text-3)' }}>{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-4">
        {quickActions.map((action) => (
          <button
            key={action.label}
            className="card stat-card"
            style={{
              cursor: 'pointer', border: '1px solid var(--border-1)',
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'var(--bg-1)', textAlign: 'left', width: '100%'
            }}
            onClick={() => handleAction(action.label)}
            disabled={actionLoading === action.label}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: `${action.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              {actionLoading === action.label
                ? <RefreshCw size={18} className="animate-spin" style={{ color: action.color }} />
                : <action.icon size={18} style={{ color: action.color }} />
              }
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>{action.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Bosing ishga tushirish uchun</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
