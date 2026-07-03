import { useState, useEffect, useCallback } from 'react';
import { Send, RefreshCw, Download, Search, Plus, X, BarChart3, Target, Users, FileText, CreditCard, MailOpen } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { notificationsApi, type AdminNotification, type NotificationStats } from '../api/admin';

const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function NotificationsPage() {
  const { addToast, setActiveTab } = useAdmin();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'list' | 'stats' | 'broadcast'>('list');
  const perPage = 20;

  // Broadcast state
  const [bTitle, setBTitle] = useState('');
  const [bMsg, setBMsg] = useState('');
  const [bTarget, setBTarget] = useState('all');
  const [bSending, setBSending] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [nUserId, setNUserId] = useState('');
  const [nTitle, setNTitle] = useState('');
  const [nMsg, setNMsg] = useState('');
  const [nSending, setNSending] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({ page, per_page: perPage });
      setNotifications(res.data);
      setTotal(res.total);
    } catch { addToast('Xatolik', 'Bildirishnomalarni yuklashda xato', 'error'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    if (tab === 'stats') {
      notificationsApi.stats().then(setStats).catch(() => {});
    }
  }, [tab]);

  const totalPages = Math.ceil(total / perPage);

  const sendNotification = async () => {
    if (!nUserId.trim() || !nTitle.trim() || !nMsg.trim()) return;
    setNSending(true);
    try {
      await notificationsApi.create({ user_id: Number(nUserId), title: nTitle, message: nMsg });
      addToast('Yuborildi', `Foydalanuvchi #${nUserId} ga xabar yuborildi`, 'success');
      setShowCreate(false);
      setNUserId(''); setNTitle(''); setNMsg('');
      fetchNotifications();
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Xabar yuborishda xato', 'error');
    } finally { setNSending(false); }
  };

  const sendBroadcast = async () => {
    if (!bTitle.trim() || !bMsg.trim()) return;
    setBSending(true);
    try {
      const res = await notificationsApi.broadcast({ title: bTitle, message: bMsg, channels: ['in_app'], target: bTarget });
      addToast('Yuborildi', `${res?.sent_to ?? res?.data?.sent_to ?? 0} ta foydalanuvchiga xabar yuborildi`, 'success');
      setBTitle(''); setBMsg(''); setBTarget('all');
      setTab('list');
      fetchNotifications();
    } catch { addToast('Xatolik', 'Broadcast yuborishda xato', 'error'); }
    finally { setBSending(false); }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType && n.type !== filterType) return false;
    if (filterStatus === 'read' && !n.is_read) return false;
    if (filterStatus === 'unread' && n.is_read) return false;
    if (searchQuery && !(n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) && !(n.user_email || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const typeColors: Record<string, string> = {
    broadcast: 'badge-primary', admin_message: 'badge-purple', tender_match: 'badge-teal',
    deadline: 'badge-yellow', system: 'badge-primary',
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Bildirishnomalar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Jami: {total} ta xabar</p>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}><Plus size={13} /> Xabar yuborish</button>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Foydalanuvchilar', tab: 'users', icon: Users, color: 'var(--primary)' },
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--teal)' },
          { label: 'Email shablonlar', tab: 'email_templates', icon: MailOpen, color: 'var(--green)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--yellow)' },
          { label: 'Moliya', tab: 'financials', icon: CreditCard, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--red)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="card mb-16" style={{ padding: '0' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-1)' }}>
          {([['list', 'Ro\'yxat'], ['stats', 'Statistika'], ['broadcast', 'Broadcast yuborish']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '12px 20px', fontSize: '13px', fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--primary)' : 'var(--text-3)', borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent', background: 'none', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'list' && (
        <div className="card">
          <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input className="input" placeholder="Qidirish..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ height: '28px', width: '160px', padding: '2px 10px 2px 28px', fontSize: '12px' }} />
              </div>
              <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)}
                style={{ height: '28px', padding: '2px 8px', fontSize: '12px' }}>
                <option value="">Barcha turlar</option>
                <option value="broadcast">Broadcast</option>
                <option value="admin_message">Admin xabar</option>
                <option value="tender_match">Tender mos</option>
                <option value="deadline">Muddat</option>
                <option value="system">Tizim</option>
              </select>
              <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ height: '28px', padding: '2px 8px', fontSize: '12px' }}>
                <option value="">Barcha holatlar</option>
                <option value="read">O'qilgan</option>
                <option value="unread">O'qilmagan</option>
              </select>
            </div>
            <button className="btn btn-ghost btn-sm" title="CSV yuklash" onClick={() => exportCSV(
              'bildirishnomalar.csv',
              ['Tur', 'Kanal', 'Foydalanuvchi', 'Sarlavha', 'O\'qildi', 'Yuborildi', 'Sana'],
              filteredNotifications.map(n => [n.type, n.channel, n.user_email || n.user_id, n.title, n.is_read ? 'Ha' : 'Yo\'q', n.is_sent ? 'Ha' : 'Yo\'q', new Date(n.created_at).toLocaleDateString('uz')])
            )}>
              <Download size={13} /> CSV
            </button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto', color: 'var(--text-3)' }} /></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Tur</th><th>Kanal</th><th>Foydalanuvchi</th><th>Sarlavha</th><th>O'qildi</th><th>Yuborildi</th><th>Sana</th></tr></thead>
                <tbody>
                  {filteredNotifications.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-4)' }}>Bildirishnomalar yo'q</td></tr>
                  ) : filteredNotifications.map(n => (
                    <tr key={n.id}>
                      <td><span className={`badge ${typeColors[n.type] || 'badge-primary'}`}>{n.type}</span></td>
                      <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>{n.channel}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-2)' }}>{n.user_email || n.user_id}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-0)' }} title={n.title}>{n.title}</td>
                      <td>{n.is_read ? <span className="badge badge-green">Ha</span> : <span style={{ color: 'var(--text-4)', fontSize: '12px' }}>Yo'q</span>}</td>
                      <td>{n.is_sent ? <span className="badge badge-teal">Ha</span> : <span style={{ color: 'var(--text-4)', fontSize: '12px' }}>Yo'q</span>}</td>
                      <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{new Date(n.created_at).toLocaleDateString('uz')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Oldingi</button>
              <span style={{ fontSize: '13px', color: 'var(--text-3)', alignSelf: 'center' }}>{page} / {totalPages}</span>
              <button className="btn btn-sm btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Keyingi →</button>
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card">
            <div className="card-header"><span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Umumiy statistika</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Jami yuborilgan', val: stats.total_sent, color: 'var(--primary)' },
                { label: 'O\'qilgan', val: stats.total_read, color: 'var(--green)' },
                { label: 'O\'qilish foizi', val: `${stats.read_rate}%`, color: 'var(--teal)' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Kanal bo'yicha</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.by_channel.map(ch => (
                <div key={ch.channel}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{ch.channel}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-0)', fontWeight: 600 }}>{ch.sent} / {ch.delivery_rate}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-0)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${ch.delivery_rate}%`, background: 'var(--primary)', borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'broadcast' && (
        <div className="card" style={{ maxWidth: '560px' }}>
          <div className="card-header">
            <span style={{ fontWeight: 700, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={16} style={{ color: 'var(--primary)' }} /> Broadcast xabar
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">Kimga</label>
              <select className="input select" value={bTarget} onChange={e => setBTarget(e.target.value)}>
                <option value="all">Barcha foydalanuvchilar</option>
                <option value="pro">Faqat Pro</option>
                <option value="business">Faqat Business</option>
                <option value="paid">Pro va Business</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Sarlavha <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="input" placeholder="Xabar sarlavhasi..." value={bTitle} onChange={e => setBTitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Xabar matni <span style={{ color: 'var(--red)' }}>*</span></label>
              <textarea value={bMsg} onChange={e => setBMsg(e.target.value)}
                placeholder="Xabar matni..." rows={4}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-0)', border: '1px solid var(--border-1)', borderRadius: '8px', color: 'var(--text-0)', fontSize: '13px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div className="card-footer">
            <button className="btn btn-primary" disabled={!bTitle.trim() || !bMsg.trim() || bSending} onClick={sendBroadcast}>
              {bSending ? <><RefreshCw size={13} className="animate-spin" /> Yuborilmoqda...</> : <><Send size={13} /> Yuborish</>}
            </button>
          </div>
        </div>
      )}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={16} style={{ color: 'var(--primary)' }} /> Foydalanuvchiga xabar
              </h3>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Foydalanuvchi ID <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="input" type="number" placeholder="Foydalanuvchi ID raqami" value={nUserId}
                  onChange={e => setNUserId(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Sarlavha <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="input" placeholder="Xabar sarlavhasi" value={nTitle}
                  onChange={e => setNTitle(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Xabar <span style={{ color: 'var(--red)' }}>*</span></label>
                <textarea placeholder="Xabar matni..." value={nMsg} onChange={e => setNMsg(e.target.value)}
                  style={{ width: '100%', minHeight: '100px', padding: '10px 12px', background: 'var(--bg-0)', border: '1px solid var(--border-1)', borderRadius: '8px', color: 'var(--text-0)', fontSize: '13px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={sendNotification} disabled={nSending || !nUserId.trim() || !nTitle.trim() || !nMsg.trim()}>
                {nSending ? <><RefreshCw size={13} className="animate-spin" /> Yuborilmoqda...</> : <><Send size={13} /> Yuborish</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
