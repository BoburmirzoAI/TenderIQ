import { useState } from 'react';
import { Send, Bell, Search, X, CheckCircle, MessageSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';

const mockNotifications = [
  { id: 1, user: 'Bobur S.', title: 'Yangi mos tender', channel: 'telegram', type: 'match', sent_at: '2026-06-17 14:30', is_read: true, is_sent: true },
  { id: 2, user: 'Jasur K.', title: 'Muddat eslatmasi', channel: 'email', type: 'deadline', sent_at: '2026-06-17 09:00', is_read: false, is_sent: true },
  { id: 3, user: 'Dilnoza R.', title: 'Kunlik xulosa', channel: 'telegram', type: 'digest', sent_at: '2026-06-17 08:00', is_read: true, is_sent: true },
  { id: 4, user: 'Aziz T.', title: 'Yangi mos tender', channel: 'telegram', type: 'match', sent_at: '2026-06-16 16:45', is_read: false, is_sent: false },
  { id: 5, user: 'Sherzod U.', title: 'Tizim yangilandi', channel: 'in_app', type: 'system', sent_at: '2026-06-16 12:00', is_read: true, is_sent: true },
  { id: 6, user: 'Nodira A.', title: 'Haftalik hisobot', channel: 'email', type: 'digest', sent_at: '2026-06-15 08:00', is_read: true, is_sent: true },
  { id: 7, user: 'Kamol B.', title: 'Yangi mos tender', channel: 'telegram', type: 'match', sent_at: '2026-06-15 11:30', is_read: false, is_sent: true },
];

const chartData = Array.from({ length: 14 }, (_, i) => ({
  day: `${i + 4}/06`,
  telegram: Math.floor(Math.random() * 120 + 40),
  email: Math.floor(Math.random() * 60 + 10),
  in_app: Math.floor(Math.random() * 200 + 80),
}));

const channelDeliveryData = [
  { channel: 'Telegram', rate: 98.2, sent: 1240, delivered: 1217 },
  { channel: 'Email', rate: 95.4, sent: 450, delivered: 429 },
  { channel: 'In-App', rate: 99.8, sent: 3200, delivered: 3194 },
];

const channelBadge = (c: string) => {
  if (c === 'telegram') return 'badge-cyan';
  if (c === 'email') return 'badge-blue';
  return 'badge-primary';
};

export default function NotificationsPage() {
  const { addToast } = useAdmin();
  const [tab, setTab] = useState<'broadcast' | 'history' | 'stats'>('broadcast');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<Set<string>>(new Set(['in_app']));
  const [target, setTarget] = useState('all');
  const [search, setSearch] = useState('');
  const [detailNotif, setDetailNotif] = useState<typeof mockNotifications[0] | null>(null);
  const [sending, setSending] = useState(false);

  const toggleChannel = (ch: string) => {
    setChannels(prev => {
      const next = new Set(prev);
      next.has(ch) ? next.delete(ch) : next.add(ch);
      return next;
    });
  };

  const sendBroadcast = () => {
    if (!title.trim() || !message.trim()) {
      addToast('Xato', 'Sarlavha va xabar matnini kiriting', 'error');
      return;
    }
    if (channels.size === 0) {
      addToast('Xato', 'Kamida bitta kanal tanlang', 'error');
      return;
    }
    setSending(true);
    addToast('Yuborilmoqda', `${channels.size} kanal orqali ${target === 'all' ? 'barcha' : target} foydalanuvchilarga...`, 'info');
    setTimeout(() => {
      setSending(false);
      addToast('Yuborildi', 'Broadcast muvaffaqiyatli yuborildi', 'success');
      setTitle('');
      setMessage('');
    }, 2000);
  };

  const filteredNotifs = mockNotifications.filter(n =>
    search === '' || n.user.toLowerCase().includes(search.toLowerCase()) || n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)', marginBottom: '24px' }}>Bildirishnomalar</h1>

      <div className="tabs mb-24">
        <button className={`tab ${tab === 'broadcast' ? 'active' : ''}`} onClick={() => setTab('broadcast')}>Broadcast</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Tarix</button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>Statistika</button>
      </div>

      {tab === 'broadcast' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Yangi broadcast</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label">Sarlavha</label>
                <input
                  className="input"
                  placeholder="Bildirishnoma sarlavhasi..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Xabar matni</label>
                <textarea
                  className="input"
                  rows={5}
                  placeholder="Xabar matni..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Kanallar</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {[
                    { id: 'in_app', label: 'In-App' },
                    { id: 'telegram', label: 'Telegram' },
                    { id: 'email', label: 'Email' },
                    { id: 'push', label: 'Push' },
                  ].map(ch => (
                    <label
                      key={ch.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                        border: `1px solid ${channels.has(ch.id) ? 'var(--primary)' : 'var(--border-1)'}`,
                        background: channels.has(ch.id) ? 'var(--primary-soft, rgba(99,102,241,0.12))' : 'var(--bg-1)',
                        fontSize: '13px', fontWeight: 500, color: channels.has(ch.id) ? 'var(--primary)' : 'var(--text-2)',
                        userSelect: 'none', transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ display: 'none' }}
                        checked={channels.has(ch.id)}
                        onChange={() => toggleChannel(ch.id)}
                      />
                      {channels.has(ch.id) && <CheckCircle size={12} />}
                      {ch.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Maqsadli auditoriya</label>
                <select className="input" value={target} onChange={e => setTarget(e.target.value)}>
                  <option value="all">Barcha foydalanuvchilar</option>
                  <option value="free">Faqat Free</option>
                  <option value="pro">Faqat Pro+</option>
                  <option value="business">Faqat Business</option>
                  <option value="custom">Maxsus segment</option>
                </select>
              </div>

              <button
                className="btn btn-primary"
                onClick={sendBroadcast}
                disabled={sending}
                style={{ height: '44px', fontSize: '14px', fontWeight: 600 }}
              >
                {sending ? (
                  <><span className="animate-spin" style={{ display: 'inline-block', marginRight: '6px' }}>⟳</span> Yuborilmoqda...</>
                ) : (
                  <><Send size={15} style={{ marginRight: '6px' }} /> Broadcast yuborish</>
                )}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Ko'rinish (Preview)</span>
            </div>
            <div className="card-body">
              <div style={{
                background: 'var(--bg-0)', border: '1px solid var(--border-1)',
                borderRadius: '12px', padding: '20px', marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Bell size={14} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-0)', fontSize: '13px' }}>{title || 'Sarlavha...'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>TenderIQ • Hozir</div>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                  {message || 'Xabar matni shu yerda ko\'rinadi...'}
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Array.from(channels).map(ch => (
                    <span key={ch} className={`badge ${channelBadge(ch)}`}>{ch}</span>
                  ))}
                  <span className="badge badge-purple">{target === 'all' ? 'Barcha' : target}</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Taxminiy yetkazish
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Array.from(channels).map(ch => (
                    <div key={ch} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-2)' }}>{ch === 'in_app' ? 'In-App' : ch === 'telegram' ? 'Telegram' : ch === 'email' ? 'Email' : 'Push'}</span>
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                        {ch === 'telegram' ? '~98%' : ch === 'email' ? '~95%' : ch === 'push' ? '~85%' : '~99%'}
                      </span>
                    </div>
                  ))}
                  {channels.size === 0 && <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>Kanal tanlanmagan</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Yuborish tarixi</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={14} style={{ color: 'var(--text-4)' }} />
              <input
                className="input"
                placeholder="Qidirish..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ height: '32px', width: '200px', fontSize: '13px' }}
              />
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px' }}>ID</th>
                  <th style={{ padding: '12px 16px' }}>Foydalanuvchi</th>
                  <th style={{ padding: '12px 16px' }}>Sarlavha</th>
                  <th style={{ padding: '12px 16px' }}>Kanal</th>
                  <th style={{ padding: '12px 16px' }}>Tur</th>
                  <th style={{ padding: '12px 16px' }}>Yuborilgan</th>
                  <th style={{ padding: '12px 16px' }}>O'qilgan</th>
                  <th style={{ padding: '12px 16px' }}>Yetkazilgan</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifs.map(n => (
                  <tr
                    key={n.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setDetailNotif(n)}
                  >
                    <td style={{ padding: '12px 16px', color: 'var(--text-4)' }}>#{n.id}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-0)' }}>{n.user}</td>
                    <td style={{ padding: '12px 16px' }}>{n.title}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${channelBadge(n.channel)}`}>{n.channel}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-primary">{n.type}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: '12px' }}>{n.sent_at}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {n.is_read
                        ? <span className="badge badge-green">Ha</span>
                        : <span className="badge badge-yellow">Yo'q</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {n.is_sent
                        ? <span className="badge badge-green">Ha</span>
                        : <span className="badge badge-red">Yo'q</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div>
          <div className="grid-4 mb-24">
            <div className="card stat-card">
              <div className="stat-label">Bugun yuborildi</div>
              <div className="stat-value">342</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">O'qilmagan jami</div>
              <div className="stat-value">1,240</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Umumiy yetkazish</div>
              <div className="stat-value" style={{ color: 'var(--green)' }}>97.8%</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Bugungi xatolar</div>
              <div className="stat-value" style={{ color: 'var(--red)' }}>8</div>
            </div>
          </div>

          <div className="grid-3 mb-24">
            {channelDeliveryData.map(ch => (
              <div key={ch.channel} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-0)', fontSize: '14px', marginBottom: '2px' }}>{ch.channel}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>{ch.delivered.toLocaleString()} / {ch.sent.toLocaleString()} yetkazildi</div>
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: ch.rate >= 98 ? 'var(--green)' : ch.rate >= 90 ? 'var(--yellow)' : 'var(--red)' }}>
                      {ch.rate}%
                    </div>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${ch.rate}%`,
                        background: ch.rate >= 98 ? 'var(--green)' : ch.rate >= 90 ? 'var(--yellow)' : 'var(--red)'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card mb-24">
            <div className="card-header">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Kunlik yuborilgan (14 kun)</span>
            </div>
            <div className="card-body" style={{ height: '340px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="telegram" stroke="var(--cyan)" strokeWidth={2} dot={false} name="Telegram" />
                  <Line type="monotone" dataKey="email" stroke="var(--blue)" strokeWidth={2} dot={false} name="Email" />
                  <Line type="monotone" dataKey="in_app" stroke="var(--primary)" strokeWidth={2} dot={false} name="In-App" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Kanal bo'yicha bugungi yuborishlar</span>
            </div>
            <div className="card-body" style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelDeliveryData}>
                  <XAxis dataKey="channel" stroke="var(--text-4)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="sent" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Yuborilgan" />
                  <Bar dataKey="delivered" fill="var(--green)" radius={[4, 4, 0, 0]} name="Yetkazilgan" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailNotif && (
        <div className="modal-overlay" onClick={() => setDetailNotif(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-0)', fontSize: '15px' }}>Bildirishnoma tafsiloti</span>
              </div>
              <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setDetailNotif(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'ID', value: `#${detailNotif.id}` },
                  { label: 'Foydalanuvchi', value: detailNotif.user },
                  { label: 'Kanal', value: detailNotif.channel },
                  { label: 'Tur', value: detailNotif.type },
                  { label: 'Yuborilgan', value: detailNotif.sent_at },
                  { label: 'Holat', value: detailNotif.is_sent ? 'Yetkazildi' : 'Yetkazilmadi' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--bg-1)', padding: '10px 12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--bg-1)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '6px' }}>Sarlavha</div>
                <div style={{ fontWeight: 700, color: 'var(--text-0)', fontSize: '14px' }}>{detailNotif.title}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailNotif(null)}>Yopish</button>
              <button className="btn btn-primary" onClick={() => {
                addToast('Yuborildi', `${detailNotif.user} ga qayta yuborildi`, 'success');
                setDetailNotif(null);
              }}>
                <Send size={13} /> Qayta yuborish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
