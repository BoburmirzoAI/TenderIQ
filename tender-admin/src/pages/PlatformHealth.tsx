import { useState, useEffect } from 'react';
import { Cpu, HardDrive, Database, Wifi, Bot, Mail, CheckCircle, XCircle, RefreshCw, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

const services = [
  { name: 'FastAPI', status: 'ok', latency: '12ms', uptime: '99.9%', uptimeLabel: '15 kun', icon: Wifi },
  { name: 'PostgreSQL', status: 'ok', latency: '3ms', uptime: '100%', uptimeLabel: '30+ kun', icon: Database },
  { name: 'Redis', status: 'ok', latency: '1ms', uptime: '99.8%', uptimeLabel: '14 kun', icon: Database },
  { name: 'Celery Beat', status: 'ok', latency: 'Heartbeat: 5s ago', uptime: '99.5%', uptimeLabel: '12 kun', icon: Cpu },
  { name: 'Telegram Bot', status: 'ok', latency: 'Webhook: active', uptime: '98.7%', uptimeLabel: '10 kun', icon: Bot },
  { name: 'SMTP', status: 'ok', latency: '145ms', uptime: '97.2%', uptimeLabel: '8 kun', icon: Mail },
];

const recentErrors = [
  { time: '2026-06-17 13:45:12', level: 'ERROR', message: 'Scraper timeout: MC.uz did not respond within 30s' },
  { time: '2026-06-17 10:22:03', level: 'WARNING', message: 'Redis connection pool exhausted, retrying...' },
  { time: '2026-06-16 23:15:45', level: 'ERROR', message: 'SMTP send failed: Connection refused by smtp.gmail.com' },
  { time: '2026-06-16 18:30:21', level: 'WARNING', message: 'ML model drift detected: PriceModel accuracy dropped to 82%' },
  { time: '2026-06-16 14:10:08', level: 'ERROR', message: 'Payment callback failed: Click returned status 500' },
  { time: '2026-06-16 09:05:30', level: 'WARNING', message: 'High latency detected on /api/v1/tenders/matched endpoint (2.1s)' },
];

const cpuValue = 23;
const ramValue = 52;

const progressColor = (val: number) => {
  if (val < 50) return 'var(--green)';
  if (val < 80) return 'var(--yellow)';
  return 'var(--red)';
};

export default function PlatformHealthPage() {
  const { addToast } = useAdmin();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [restartLoading, setRestartLoading] = useState<string | null>(null);
  const [errorFilter, setErrorFilter] = useState<'all' | 'ERROR' | 'WARNING'>('all');
  const [confirmAction, setConfirmAction] = useState<{ key: string; label: string } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!autoRefresh) return;
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) {
          addToast('Auto-refresh', 'Platform health yangilandi', 'info');
          return 30;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const runAction = (key: string, label: string) => {
    setConfirmAction(null);
    setActionLoading(key);
    addToast('Bajarilmoqda', `${label}...`, 'info');
    setTimeout(() => {
      setActionLoading(null);
      addToast('Tayyor', `${label} bajarildi`, 'success');
    }, 2000);
  };

  const restartService = (name: string) => {
    setRestartLoading(name);
    addToast('Restart', `${name} qayta ishga tushirilmoqda...`, 'info');
    setTimeout(() => {
      setRestartLoading(null);
      addToast('Tayyor', `${name} muvaffaqiyatli qayta ishga tushirildi`, 'success');
    }, 2500);
  };

  const clearLogs = () => {
    addToast('Log', 'Xato jurnali tozalandi', 'success');
  };

  const filteredErrors = errorFilter === 'all'
    ? recentErrors
    : recentErrors.filter(e => e.level === errorFilter);

  const dangerousActions = [
    {
      key: 'cache', label: 'Redis kesh tozalash',
      desc: 'Barcha cached ma\'lumotlarni tozalash',
      color: 'var(--orange)', icon: Trash2, dangerous: true,
    },
    {
      key: 'tokens', label: 'Expired tokenlar',
      desc: 'Muddati o\'tgan tokenlarni o\'chirish',
      color: 'var(--yellow)', icon: Trash2, dangerous: false,
    },
    {
      key: 'celery', label: 'Celery restart',
      desc: 'Workerlarni qayta ishga tushirish',
      color: 'var(--purple)', icon: RefreshCw, dangerous: true,
    },
  ];

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Platform Health</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-2)' }}>
            <button
              className={`toggle ${autoRefresh ? 'active' : ''}`}
              onClick={() => setAutoRefresh(p => !p)}
            />
            Auto-refresh
          </label>
          {autoRefresh && (
            <span style={{
              fontSize: '12px', color: 'var(--primary)', fontWeight: 600,
              padding: '2px 8px', background: 'rgba(99,102,241,0.12)', borderRadius: '12px'
            }}>
              {countdown}s
            </span>
          )}
        </div>
      </div>

      {/* System metrics */}
      <div className="grid-4 mb-24">
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">CPU</span>
            <Cpu size={16} style={{ color: progressColor(cpuValue) }} />
          </div>
          <div className="stat-value" style={{ color: progressColor(cpuValue) }}>{cpuValue}%</div>
          <div className="progress mt-8">
            <div className="progress-fill" style={{ width: `${cpuValue}%`, background: progressColor(cpuValue) }} />
          </div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">RAM</span>
            <HardDrive size={16} style={{ color: progressColor(ramValue) }} />
          </div>
          <div className="stat-value" style={{ fontSize: '18px', color: progressColor(ramValue) }}>2.1 / 4 GB</div>
          <div className="progress mt-8">
            <div className="progress-fill" style={{ width: `${ramValue}%`, background: progressColor(ramValue) }} />
          </div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Redis</span>
            <Database size={16} style={{ color: 'var(--teal)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '18px' }}>1ms</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>Keys: 12,450 · 128 MB</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Celery Workers</span>
            <Cpu size={16} style={{ color: 'var(--purple)' }} />
          </div>
          <div className="stat-value">2</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>Faol tasklar: 0</div>
        </div>
      </div>

      {/* Service health */}
      <div className="card mb-24">
        <div className="card-header">
          <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Servis holati</span>
        </div>
        <div className="card-body">
          <div className="grid-2" style={{ gap: '12px' }}>
            {services.map(s => (
              <div key={s.name} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', background: 'var(--bg-0)', borderRadius: '10px',
                border: '1px solid var(--border-1)'
              }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: s.status === 'ok' ? 'var(--green-soft)' : 'var(--red-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {s.status === 'ok'
                    ? <CheckCircle size={18} style={{ color: 'var(--green)' }} />
                    : <XCircle size={18} style={{ color: 'var(--red)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)', marginBottom: '2px' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{s.latency}</div>
                  <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 500 }}>
                    Uptime: {s.uptime} · {s.uptimeLabel}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: s.status === 'ok' ? 'var(--green)' : 'var(--red)',
                    boxShadow: `0 0 8px ${s.status === 'ok' ? 'var(--green)' : 'var(--red)'}`
                  }} />
                  <button
                    className="btn btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                    onClick={() => restartService(s.name)}
                    disabled={restartLoading === s.name}
                  >
                    {restartLoading === s.name
                      ? <RefreshCw size={11} className="animate-spin" />
                      : 'Restart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error log */}
      <div className="card mb-24">
        <div className="card-header flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Xato jurnali</span>
            <span className="badge badge-red">{recentErrors.length} ta</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'ERROR', 'WARNING'] as const).map(f => (
              <button
                key={f}
                className={`btn btn-sm ${errorFilter === f ? 'btn-primary' : ''}`}
                onClick={() => setErrorFilter(f)}
                style={{ fontSize: '11px' }}
              >
                {f === 'all' ? 'Barchasi' : f}
              </button>
            ))}
            <button className="btn btn-sm btn-danger" onClick={clearLogs}>
              <Trash2 size={11} /> Tozalash
            </button>
          </div>
        </div>
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {filteredErrors.map((err, i) => (
            <div key={i} style={{
              padding: '12px 20px', borderBottom: '1px solid var(--border-1)',
              display: 'flex', gap: '12px', alignItems: 'flex-start'
            }}>
              <span
                className={`badge ${err.level === 'ERROR' ? 'badge-red' : 'badge-yellow'}`}
                style={{ flexShrink: 0, marginTop: '2px' }}
              >
                {err.level}
              </span>
              <div style={{ flex: 1 }}>
                <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-1)', lineHeight: 1.5 }}>
                  {err.message}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>{err.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System actions */}
      <div className="card mb-24">
        <div className="card-header">
          <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Tizim amallar</span>
        </div>
        <div className="card-body">
          <div className="grid-3">
            {dangerousActions.map(a => (
              <button
                key={a.key}
                className="card stat-card"
                style={{ cursor: 'pointer', textAlign: 'left', width: '100%', border: `1px solid var(--border-1)` }}
                onClick={() => {
                  if (a.dangerous) {
                    setConfirmAction({ key: a.key, label: a.label });
                  } else {
                    runAction(a.key, a.label);
                  }
                }}
                disabled={actionLoading === a.key}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {actionLoading === a.key
                    ? <RefreshCw size={18} className="animate-spin" style={{ color: a.color }} />
                    : <a.icon size={18} style={{ color: a.color }} />}
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-0)', fontSize: '13px' }}>{a.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{a.desc}</div>
                    {a.dangerous && (
                      <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <AlertTriangle size={10} /> Tasdiqlash talab etiladi
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--red)' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Tasdiqlash kerak</span>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-1)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-0)' }}>{confirmAction.label}</strong> amalini bajarishni xohlaysizmi?
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '8px' }}>
                Bu amalni qaytarib bo'lmasligi mumkin. Davom etishdan oldin ishonch hosil qiling.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmAction(null)}>Bekor qilish</button>
              <button
                className="btn btn-danger"
                onClick={() => runAction(confirmAction.key, confirmAction.label)}
              >
                Ha, bajarish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
