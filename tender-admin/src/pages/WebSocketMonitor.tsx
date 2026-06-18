import { useState } from 'react';
import { Wifi, MessageSquare, TrendingUp, Clock, Radio, Zap, X, AlertTriangle, User } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface WsConnection {
  id: string;
  user: string;
  user_email: string;
  user_plan: string;
  connected_at: string;
  messages_sent: number;
  messages_received: number;
  last_activity: string;
  channel: string;
}

interface WsEvent {
  id: number;
  type: 'tender_new' | 'stats_update' | 'notification' | 'activity';
  channel: string;
  message: string;
  timestamp: string;
}

const mockConnections: WsConnection[] = [
  { id: 'ws-001', user: 'Bobur Sobirjonov', user_email: 'bobur@mail.uz', user_plan: 'business', connected_at: '2026-06-17 08:15', messages_sent: 142, messages_received: 89, last_activity: '2026-06-17 14:28', channel: 'tenders' },
  { id: 'ws-002', user: 'Jasur Karimov', user_email: 'jasur@mail.uz', user_plan: 'pro', connected_at: '2026-06-17 09:30', messages_sent: 87, messages_received: 56, last_activity: '2026-06-17 14:25', channel: 'tenders' },
  { id: 'ws-003', user: 'Sherzod Umarov', user_email: 'sherzod@mail.uz', user_plan: 'pro', connected_at: '2026-06-17 10:00', messages_sent: 56, messages_received: 34, last_activity: '2026-06-17 14:30', channel: 'notifications' },
  { id: 'ws-004', user: 'Dilnoza Rahimova', user_email: 'dilnoza@mail.uz', user_plan: 'business', connected_at: '2026-06-17 11:45', messages_sent: 34, messages_received: 21, last_activity: '2026-06-17 14:22', channel: 'stats' },
  { id: 'ws-005', user: 'Otabek Mirzayev', user_email: 'otabek@mail.uz', user_plan: 'free', connected_at: '2026-06-17 12:20', messages_sent: 23, messages_received: 15, last_activity: '2026-06-17 14:29', channel: 'tenders' },
];

const mockEvents: WsEvent[] = [
  { id: 1, type: 'tender_new', channel: 'tenders', message: 'Yangi tender: IT uskunalar yetkazib berish (UZEX)', timestamp: '14:30:12' },
  { id: 2, type: 'notification', channel: 'notifications', message: 'Bildirishnoma yuborildi: 12 ta foydalanuvchiga', timestamp: '14:29:45' },
  { id: 3, type: 'stats_update', channel: 'stats', message: 'Dashboard statistikasi yangilandi', timestamp: '14:28:30' },
  { id: 4, type: 'tender_new', channel: 'tenders', message: 'Yangi tender: Transport xizmatlari (MC.uz)', timestamp: '14:27:15' },
  { id: 5, type: 'activity', channel: 'tenders', message: 'Tender #1024 holati o\'zgartirildi: active -> awarded', timestamp: '14:25:50' },
  { id: 6, type: 'notification', channel: 'notifications', message: 'Deadline eslatmasi: 5 ta tender ertaga tugaydi', timestamp: '14:24:00' },
  { id: 7, type: 'tender_new', channel: 'tenders', message: 'Yangi tender: Dori vositalari (MyGov)', timestamp: '14:22:30' },
  { id: 8, type: 'stats_update', channel: 'stats', message: 'ML model natijalari yangilandi', timestamp: '14:20:15' },
  { id: 9, type: 'activity', channel: 'tenders', message: 'Foydalanuvchi #45 tender saqladi: #1031', timestamp: '14:18:45' },
  { id: 10, type: 'notification', channel: 'notifications', message: 'Yangi match topildi: 3 ta foydalanuvchi uchun', timestamp: '14:16:20' },
  { id: 11, type: 'tender_new', channel: 'tenders', message: 'Yangi tender: Qurilish materiallari (UZEX)', timestamp: '14:14:00' },
  { id: 12, type: 'stats_update', channel: 'stats', message: 'Scraper natijasi: 28 ta yangi tender', timestamp: '14:12:30' },
  { id: 13, type: 'activity', channel: 'tenders', message: 'Tender #1055 muddati uzaytirildi', timestamp: '14:10:15' },
  { id: 14, type: 'notification', channel: 'notifications', message: 'Haftalik hisobot yuborildi: 156 ta foydalanuvchi', timestamp: '14:08:00' },
  { id: 15, type: 'tender_new', channel: 'tenders', message: 'Yangi tender: Server jihozlari (MC.uz)', timestamp: '14:05:45' },
];

const eventTypeColors: Record<string, string> = {
  tender_new: 'badge-green',
  stats_update: 'badge-primary',
  notification: 'badge-yellow',
  activity: 'badge-cyan',
};

const eventTypeLabels: Record<string, string> = {
  tender_new: 'Yangi tender',
  stats_update: 'Stats',
  notification: 'Bildirishnoma',
  activity: 'Faoliyat',
};

const channelStats = [
  { name: 'tenders', subscribers: 3, icon: Radio, color: 'var(--green)' },
  { name: 'stats', subscribers: 1, icon: TrendingUp, color: 'var(--blue)' },
  { name: 'notifications', subscribers: 1, icon: MessageSquare, color: 'var(--yellow)' },
];

const planBadge = (plan: string) => {
  if (plan === 'business') return 'badge-purple';
  if (plan === 'pro') return 'badge-blue';
  return 'badge-primary';
};

const getConnectedDuration = (connected_at: string) => {
  const parts = connected_at.split(' ')[1].split(':');
  const connectedMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  const nowParts = '14:30'.split(':');
  const nowMinutes = parseInt(nowParts[0]) * 60 + parseInt(nowParts[1]);
  const diff = nowMinutes - connectedMinutes;
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff / 60)}s ${diff % 60}m`;
};

export default function WebSocketMonitor() {
  const { addToast } = useAdmin();
  const [eventFilter, setEventFilter] = useState('all');
  const [selectedConn, setSelectedConn] = useState<WsConnection | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<WsConnection | null>(null);
  const [connections, setConnections] = useState(mockConnections);
  const [testMsgLoading, setTestMsgLoading] = useState(false);

  const filteredEvents = eventFilter === 'all'
    ? mockEvents
    : mockEvents.filter(e => e.type === eventFilter);

  const disconnectUser = (conn: WsConnection) => {
    setConnections(p => p.filter(c => c.id !== conn.id));
    setConfirmDisconnect(null);
    setSelectedConn(null);
    addToast('Uzildi', `${conn.user} ulanishi uzildi`, 'success');
  };

  const sendTestMessage = () => {
    setTestMsgLoading(true);
    addToast('Test', 'Test xabari barcha kanallarga yuborilmoqda...', 'info');
    setTimeout(() => {
      setTestMsgLoading(false);
      addToast('Yuborildi', `Test xabari ${connections.length} ta ulanishga yetkazildi`, 'success');
    }, 1200);
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>WebSocket Monitor</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Real-time ulanishlar va xabarlar</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-sm btn-primary"
            onClick={sendTestMessage}
            disabled={testMsgLoading}
          >
            {testMsgLoading
              ? <><Zap size={13} className="animate-spin" /> Yuborilmoqda</>
              : <><Zap size={13} /> Test xabar</>}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 600 }}>Live</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-24">
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Faol ulanishlar</span>
            <Wifi size={16} style={{ color: 'var(--green)' }} />
          </div>
          <div className="stat-value">{connections.length}</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Xabarlar/min</span>
            <MessageSquare size={16} style={{ color: 'var(--blue)' }} />
          </div>
          <div className="stat-value">24</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Bugungi pik</span>
            <TrendingUp size={16} style={{ color: 'var(--yellow)' }} />
          </div>
          <div className="stat-value">12</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Uptime</span>
            <Clock size={16} style={{ color: 'var(--teal)' }} />
          </div>
          <div className="stat-value">99.9%</div>
        </div>
      </div>

      {/* Channel subscriptions */}
      <div className="grid-3 mb-24">
        {channelStats.map(ch => (
          <div key={ch.name} className="card">
            <div className="card-body flex-between">
              <span style={{ fontWeight: 700, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ch.icon size={15} style={{ color: ch.color }} />
                </div>
                <span>#{ch.name}</span>
              </span>
              <span className="badge badge-primary" style={{ fontSize: '12px' }}>
                {ch.subscribers} obunachi
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: '24px' }}>
        {/* Active connections */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Faol ulanishlar ({connections.length})</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ padding: '10px 14px' }}>Foydalanuvchi</th>
                  <th style={{ padding: '10px 14px' }}>Kanal</th>
                  <th style={{ padding: '10px 14px' }}>Davomiylik</th>
                  <th style={{ padding: '10px 14px' }}>Xabarlar</th>
                  <th style={{ padding: '10px 14px' }}></th>
                </tr>
              </thead>
              <tbody>
                {connections.map(conn => (
                  <tr
                    key={conn.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedConn(conn)}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>{conn.user}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-4)' }}>{conn.id}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="badge badge-cyan" style={{ fontSize: '10px' }}>{conn.channel}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-3)' }}>
                      {getConnectedDuration(conn.connected_at)}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--green)' }}>↑{conn.messages_sent}</span>
                      {' '}
                      <span style={{ color: 'var(--blue)' }}>↓{conn.messages_received}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-sm btn-danger"
                        style={{ fontSize: '11px', padding: '2px 6px' }}
                        onClick={() => setConfirmDisconnect(conn)}
                      >
                        Uzish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event log */}
        <div className="card">
          <div className="card-body">
            <div className="flex-between mb-16">
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-0)' }}>Event log</h3>
              <select
                className="input"
                style={{ width: '160px', fontSize: '12px' }}
                value={eventFilter}
                onChange={e => setEventFilter(e.target.value)}
              >
                <option value="all">Barchasi</option>
                <option value="tender_new">Yangi tender</option>
                <option value="stats_update">Stats</option>
                <option value="notification">Bildirishnoma</option>
                <option value="activity">Faoliyat</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '420px', overflowY: 'auto' }}>
              {filteredEvents.map(event => (
                <div key={event.id} style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: 'var(--bg-1)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span className={`badge ${eventTypeColors[event.type]}`} style={{ fontSize: '10px' }}>
                      {eventTypeLabels[event.type]}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'monospace' }}>
                      {event.timestamp}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-4)' }}>· #{event.channel}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {event.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connection detail modal */}
      {selectedConn && (
        <div className="modal-overlay" onClick={() => setSelectedConn(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Ulanish tafsiloti</span>
              </div>
              <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setSelectedConn(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px', background: 'var(--bg-1)', borderRadius: '10px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'var(--primary)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0
                }}>
                  <User size={20} style={{ color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-0)', fontSize: '15px' }}>{selectedConn.user}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{selectedConn.user_email}</div>
                  <span className={`badge ${planBadge(selectedConn.user_plan)}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                    {selectedConn.user_plan.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '10px' }}>
                {[
                  { label: 'ID', value: selectedConn.id },
                  { label: 'Kanal', value: `#${selectedConn.channel}` },
                  { label: 'Ulangan vaqt', value: selectedConn.connected_at.split(' ')[1] },
                  { label: 'Davomiylik', value: getConnectedDuration(selectedConn.connected_at) },
                  { label: 'Yuborilgan xabarlar', value: String(selectedConn.messages_sent) },
                  { label: 'Qabul qilingan', value: String(selectedConn.messages_received) },
                  { label: 'Oxirgi faollik', value: selectedConn.last_activity.split(' ')[1] },
                  { label: 'Holat', value: 'Faol' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '10px 12px', background: 'var(--bg-1)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '3px' }}>{item.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedConn(null)}>Yopish</button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setSelectedConn(null);
                  setConfirmDisconnect(selectedConn);
                }}
              >
                Ulanishni uzish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect confirmation */}
      {confirmDisconnect && (
        <div className="modal-overlay" onClick={() => setConfirmDisconnect(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} style={{ color: 'var(--red)' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Ulanishni uzish</span>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-1)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-0)' }}>{confirmDisconnect.user}</strong> foydalanuvchisining WebSocket ulanishini uzmoqchimisiz?
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '8px' }}>
                Foydalanuvchi real-time yangilanishlarni ololmaydi.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmDisconnect(null)}>Bekor qilish</button>
              <button className="btn btn-danger" onClick={() => disconnectUser(confirmDisconnect)}>
                Ha, uzish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
