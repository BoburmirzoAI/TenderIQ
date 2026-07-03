import { useCallback, useEffect, useState } from 'react';
import { Wifi, MessageSquare, Radio, RefreshCw, Activity, X, ChevronRight, User, Globe, Monitor, Download, Database, BarChart3, FileText, Settings, Terminal } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { wsMonitorApi, type WSActivity, type ActivityEvent } from '../api/admin';

const ACTION_COLOR: Record<string, string> = {
  login: 'var(--green)',
  logout: 'var(--red)',
  create: 'var(--primary)',
  update: 'var(--yellow)',
  delete: 'var(--red)',
  view: 'var(--teal)',
  feature_flag: 'var(--orange, #f0883e)',
};

const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const actionColor = (action: string) => {
  for (const [key, color] of Object.entries(ACTION_COLOR)) {
    if (action.includes(key)) return color;
  }
  return 'var(--text-3)';
};

const actionBadge = (action: string) => {
  const color = actionColor(action);
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, color, background: `${color}18`, padding: '2px 8px', borderRadius: '12px', border: `1px solid ${color}40` }}>
      {action}
    </span>
  );
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return `${diff}s oldin`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}s oldin`;
  return `${Math.floor(diff / 86400)}k oldin`;
}

export default function WebSocketMonitor() {
  const { addToast, setActiveTab } = useAdmin();
  const [data, setData] = useState<WSActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [limit, setLimit] = useState(30);
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [filterChannel, setFilterChannel] = useState<string | null>(null);
  const [searchAction, setSearchAction] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await wsMonitorApi.activity(limit));
    } catch {
      addToast('Xatolik', "Faollik yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, limit]);

  useEffect(() => { load(); }, [limit]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  const channels = data?.channels ?? {};
  const channelList = Object.entries(channels).sort((a, b) => b[1] - a[1]);

  const filteredEvents = (data?.events ?? []).filter(ev => {
    if (filterChannel && ev.resource_type !== filterChannel) return false;
    if (searchAction && !ev.action.toLowerCase().includes(searchAction.toLowerCase()) && !(ev.user_email || '').toLowerCase().includes(searchAction.toLowerCase())) return false;
    return true;
  });

  if (loading && !data) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-4)' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Faollik Monitoru</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Tizim audit loglari va foydalanuvchi faolligi</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className={`btn btn-sm ${autoRefresh ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAutoRefresh(a => !a)}
          >
            {autoRefresh && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s ease-in-out infinite', marginRight: '4px' }} />}
            <Radio size={13} /> {autoRefresh ? 'Jonli (5s)' : 'Jonli rejim'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Infrastructure', tab: 'infrastructure', icon: Database, color: 'var(--primary)' },
          { label: 'Platform Health', tab: 'health', icon: Activity, color: 'var(--teal)' },
          { label: 'Konteyner loglar', tab: 'container_logs', icon: Terminal, color: 'var(--green)' },
          { label: 'API Endpoints', tab: 'api_endpoints', icon: Globe, color: 'var(--yellow)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--purple)' },
          { label: 'Sozlamalar', tab: 'settings', icon: Settings, color: 'var(--red)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid-4 mb-24">
        {[
          { label: "So'nggi harakatlar", value: data?.recent_actions ?? 0, color: 'var(--primary)', icon: Activity },
          { label: 'Faol foydalanuvchilar', value: data?.unique_users ?? 0, color: 'var(--green)', icon: Wifi },
          { label: 'Kanallar soni', value: channelList.length, color: 'var(--teal)', icon: MessageSquare },
          { label: 'Eng faol kanal', value: channelList[0]?.[0] ?? '—', color: 'var(--yellow)', icon: Radio },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-label mb-8">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: String(s.value).length > 10 ? '14px' : undefined }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px' }}>
        {/* Channels */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontWeight: 700, fontSize: '13px' }}>Resurs turlari</h3>
          </div>
          <div className="card-body" style={{ padding: '8px' }}>
            {/* "Hammasi" button */}
            <button onClick={() => setFilterChannel(null)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 10px', borderRadius: '6px', marginBottom: '2px', width: '100%',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              background: filterChannel === null ? 'var(--primary-soft)' : 'transparent',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: filterChannel === null ? 'var(--primary)' : 'var(--text-2)' }}>Hammasi</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-4)', background: 'var(--bg-0)', padding: '1px 8px', borderRadius: '10px' }}>
                {data?.events.length ?? 0}
              </span>
            </button>
            {channelList.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-5)', fontSize: '12px' }}>Bo'sh</div>
            ) : channelList.map(([ch, count]) => (
              <button key={ch} onClick={() => setFilterChannel(filterChannel === ch ? null : ch)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: '6px', marginBottom: '2px', width: '100%',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                background: filterChannel === ch ? 'var(--primary-soft)' : 'transparent',
              }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: filterChannel === ch ? 'var(--primary)' : 'var(--text-2)' }}>{ch}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '1px 8px', borderRadius: '10px' }}>{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Events feed */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header flex-between" style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '13px' }}>
                Oxirgi harakatlar
                {filterChannel && (
                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginLeft: '8px' }}>
                    — {filterChannel}
                    <button onClick={() => setFilterChannel(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 0 0 4px', color: 'var(--text-4)' }}>
                      <X size={11} />
                    </button>
                  </span>
                )}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                className="input"
                placeholder="Qidirish..."
                value={searchAction}
                onChange={e => setSearchAction(e.target.value)}
                style={{ height: '28px', width: '150px', padding: '2px 10px', fontSize: '12px' }}
              />
              <select className="input" value={limit} onChange={e => setLimit(Number(e.target.value))}
                style={{ height: '28px', width: '80px', padding: '2px 8px', fontSize: '12px' }}>
                <option value={20}>20 ta</option>
                <option value={50}>50 ta</option>
                <option value={100}>100 ta</option>
              </select>
              <button className="btn btn-ghost btn-sm" title="CSV yuklash" onClick={() => exportCSV(
                'faollik.csv',
                ['Harakat', 'Resurs', 'Resource ID', 'Foydalanuvchi', 'IP', 'Vaqt'],
                filteredEvents.map(ev => [ev.action, ev.resource_type, ev.resource_id ?? '', ev.user_email ?? ev.user_id ?? 'Tizim', ev.ip_address ?? '', ev.created_at])
              )}>
                <Download size={13} />
              </button>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)' }}>
              <Activity size={36} style={{ opacity: 0.2, marginBottom: '12px' }} />
              <p style={{ fontSize: '13px' }}>Hech qanday harakat topilmadi</p>
            </div>
          ) : (
            <div className="table-wrap" style={{ flex: 1, overflow: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ padding: '10px 16px' }}>Harakat</th>
                    <th style={{ padding: '10px 16px' }}>Resurs</th>
                    <th style={{ padding: '10px 16px' }}>Foydalanuvchi</th>
                    <th style={{ padding: '10px 16px' }}>Vaqt</th>
                    <th style={{ padding: '10px 8px', width: '30px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((ev: ActivityEvent) => (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: selectedEvent?.id === ev.id ? 'var(--bg-active)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (selectedEvent?.id !== ev.id) (e.currentTarget.style.background = 'var(--bg-0)'); }}
                      onMouseLeave={e => { if (selectedEvent?.id !== ev.id) (e.currentTarget.style.background = 'transparent'); }}
                    >
                      <td style={{ padding: '8px 16px' }}>{actionBadge(ev.action)}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{ev.resource_type}</span>
                        {ev.resource_id && <span style={{ fontSize: '10px', color: 'var(--text-5)', marginLeft: '4px' }}>#{ev.resource_id}</span>}
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        {ev.user_email ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{ev.user_email}</span>
                        ) : ev.user_id ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-4)', fontFamily: 'monospace' }}>#{ev.user_id}</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-5)' }}>Tizim</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-5)' }} title={ev.created_at}>{timeAgo(ev.created_at)}</span>
                      </td>
                      <td style={{ padding: '8px 8px' }}>
                        <ChevronRight size={12} style={{ color: 'var(--text-5)', transform: selectedEvent?.id === ev.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel — slide from right */}
      {selectedEvent && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px',
          background: 'var(--bg-1)', borderLeft: '1px solid var(--border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.3)', zIndex: 100,
          display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.2s ease',
        }}>
          <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)' }}>Harakat tafsilotlari</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>ID: {selectedEvent.id}</p>
            </div>
            <button onClick={() => setSelectedEvent(null)} style={{ border: 'none', background: 'var(--bg-0)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            {/* Action */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Harakat</div>
              <div>{actionBadge(selectedEvent.action)}</div>
            </div>

            {/* Resource */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Resurs</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>{selectedEvent.resource_type}</span>
                {selectedEvent.resource_id && <span style={{ fontSize: '12px', color: 'var(--text-4)', fontFamily: 'monospace', background: 'var(--bg-0)', padding: '2px 8px', borderRadius: '4px' }}>#{selectedEvent.resource_id}</span>}
              </div>
            </div>

            {/* User */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                <User size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Foydalanuvchi
              </div>
              <div style={{ background: 'var(--bg-0)', borderRadius: '8px', padding: '12px' }}>
                {selectedEvent.user_email ? (
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{selectedEvent.user_email}</div>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--text-4)' }}>Noma'lum</div>
                )}
                {selectedEvent.user_id && (
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px', fontFamily: 'monospace' }}>User ID: {selectedEvent.user_id}</div>
                )}
              </div>
            </div>

            {/* Time */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Vaqt</div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{selectedEvent.created_at}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>{timeAgo(selectedEvent.created_at)}</div>
            </div>

            {/* Details */}
            {selectedEvent.details && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Tafsilotlar</div>
                <pre style={{
                  background: '#0d1117', color: '#c9d1d9', borderRadius: '8px', padding: '12px',
                  fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace', margin: 0,
                  maxHeight: '200px', overflowY: 'auto',
                }}>
                  {(() => {
                    try { return JSON.stringify(JSON.parse(selectedEvent.details!), null, 2); } catch { return selectedEvent.details; }
                  })()}
                </pre>
              </div>
            )}

            {/* IP Address */}
            {selectedEvent.ip_address && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  <Globe size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  IP manzil
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', fontFamily: 'monospace', background: 'var(--bg-0)', padding: '8px 12px', borderRadius: '6px' }}>
                  {selectedEvent.ip_address}
                </div>
              </div>
            )}

            {/* User Agent */}
            {selectedEvent.user_agent && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  <Monitor size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  User Agent
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', background: 'var(--bg-0)', padding: '8px 12px', borderRadius: '6px', wordBreak: 'break-all' }}>
                  {selectedEvent.user_agent}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: '420px', bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99 }}
        />
      )}
    </div>
  );
}
