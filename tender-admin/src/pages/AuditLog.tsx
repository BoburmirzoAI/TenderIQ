import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, X, Eye, Download, Users, Shield, BarChart3, Target, FileText, Settings } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { auditApi, type AuditEntry } from '../api/admin';

const resourceIcons: Record<string, string> = {
  user: '👤', tender: '📋', company: '🏢', subscription: '👑', settings: '⚙️', notification: '🔔',
};

const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function AuditLogPage() {
  const { addToast, setActiveTab } = useAdmin();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<string[]>([]);
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [detail, setDetail] = useState<AuditEntry | null>(null);
  const perPage = 30;

  useEffect(() => {
    auditApi.actions().then(setActions).catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (filterAction) params.action = filterAction;
      if (filterResource) params.resource_type = filterResource;
      const res = await auditApi.list(params);
      setLogs(res.data);
      setTotal(res.total);
    } catch {
      addToast('Xatolik', 'Audit loglarni yuklashda xato', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterResource]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / perPage);

  const parseDetails = (details?: string) => {
    if (!details) return null;
    try { return JSON.parse(details); } catch { return details; }
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Audit Log</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Jami: {total} ta yozuv</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-ghost" onClick={fetchLogs}><RefreshCw size={14} /></button>
          <button className="btn btn-sm btn-ghost" onClick={() => exportCSV('audit_log.csv', ['Vaqt', 'Admin', 'Harakat', 'Resurs', 'ID'], logs.map(l => [new Date(l.created_at).toLocaleString('uz'), l.admin_email || 'system', l.action, l.resource_type || '', l.resource_id || '']))}>
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Foydalanuvchilar', tab: 'users', icon: Users, color: 'var(--primary)' },
          { label: 'Rollar', tab: 'roles', icon: Shield, color: 'var(--teal)' },
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--green)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--yellow)' },
          { label: 'Sozlamalar', tab: 'settings', icon: Settings, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--red)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      <div className="card mb-16">
        <div className="card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select className="input select" style={{ width: '200px' }} value={filterAction}
            onChange={e => { setFilterAction(e.target.value); setPage(1); }}>
            <option value="">Barcha harakatlar</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="input select" style={{ width: '160px' }} value={filterResource}
            onChange={e => { setFilterResource(e.target.value); setPage(1); }}>
            <option value="">Barcha resurslar</option>
            {['user', 'tender', 'company', 'subscription', 'settings', 'notification'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto', color: 'var(--text-3)' }} /></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Vaqt</th><th>Admin</th><th>Harakat</th><th>Resurs</th><th>ID</th><th></th></tr></thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-4)' }}>Log yozuvlari yo'q</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--text-3)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('uz', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>{log.admin_email || 'system'}</td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-0)' }}>{log.action}</span>
                    </td>
                    <td>
                      {log.resource_type ? (
                        <span className="badge badge-primary">
                          {resourceIcons[log.resource_type] || '📁'} {log.resource_type}
                        </span>
                      ) : <span style={{ color: 'var(--text-4)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-3)', fontSize: '12px', fontFamily: 'monospace' }}>
                      {log.resource_id || '—'}
                    </td>
                    <td>
                      {log.details && (
                        <button className="btn-icon" onClick={() => setDetail(log)}><Eye size={14} /></button>
                      )}
                    </td>
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

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Harakat tafsiloti</h3>
              <button className="btn-icon" onClick={() => setDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="grid-2" style={{ gap: '12px' }}>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Harakat</span><div style={{ fontWeight: 600, color: 'var(--text-0)' }}>{detail.action}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Resurs</span><div style={{ color: 'var(--text-1)' }}>{detail.resource_type} #{detail.resource_id}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Admin</span><div style={{ color: 'var(--text-1)' }}>{detail.admin_email || 'system'}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Vaqt</span><div style={{ color: 'var(--text-1)' }}>{new Date(detail.created_at).toLocaleString('uz')}</div></div>
              </div>
              <div>
                <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Tafsilot</span>
                <pre style={{ marginTop: '6px', padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-1)', overflow: 'auto', maxHeight: '200px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(parseDetails(detail.details), null, 2)}
                </pre>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
