import { useState, useEffect } from 'react';
import { Database, Wifi, Cpu, Bot, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { healthApi, type HealthCheck } from '../api/admin';

const serviceIcons: Record<string, any> = {
  database: Database, redis: Wifi, celery: Cpu, ml_service: Bot,
};

const statusConfig = {
  ok: { icon: CheckCircle, color: 'var(--green)', label: 'Ishlayapti' },
  degraded: { icon: AlertTriangle, color: 'var(--yellow)', label: 'Degraded' },
  error: { icon: XCircle, color: 'var(--red)', label: 'Xato' },
  unavailable: { icon: XCircle, color: 'var(--text-4)', label: 'Mavjud emas' },
  not_configured: { icon: AlertTriangle, color: 'var(--text-4)', label: 'Sozlanmagan' },
};

export default function PlatformHealthPage() {
  const { addToast } = useAdmin();
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const data = await healthApi.check();
      setHealth(data);
      setLastChecked(new Date());
    } catch { addToast('Xatolik', 'Holat tekshirishda xato', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { checkHealth(); }, []);

  const overallConf = health ? (statusConfig[health.overall as keyof typeof statusConfig] || statusConfig.degraded) : null;

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Platforma holati</h1>
          {lastChecked && (
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
              Oxirgi tekshiruv: {lastChecked.toLocaleTimeString('uz')}
            </p>
          )}
        </div>
        <button className="btn btn-sm btn-ghost" onClick={checkHealth} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Tekshirish
        </button>
      </div>

      {/* Overall status */}
      {health && overallConf && (
        <div className="card mb-24" style={{ border: `1px solid ${overallConf.color}40` }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${overallConf.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <overallConf.icon size={24} style={{ color: overallConf.color }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-0)' }}>
                Umumiy holat: <span style={{ color: overallConf.color }}>{overallConf.label}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                {Object.values(health.checks).filter(c => c.status === 'ok').length} / {Object.keys(health.checks).length} servis ishlayapti
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service cards */}
      {loading && !health ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--text-3)' }} /></div>
      ) : health ? (
        <div className="grid-4">
          {Object.entries(health.checks).map(([service, check]) => {
            const Icon = serviceIcons[service] || Cpu;
            const conf = statusConfig[check.status as keyof typeof statusConfig] || statusConfig.error;
            const StatusIcon = conf.icon;

            return (
              <div key={service} className="card" style={{ border: `1px solid ${conf.color}30` }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${conf.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} style={{ color: conf.color }} />
                    </div>
                    <StatusIcon size={16} style={{ color: conf.color }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-0)', marginBottom: '4px', textTransform: 'capitalize' }}>
                    {service.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '12px', color: conf.color, fontWeight: 600 }}>{conf.label}</div>
                  {check.latency_ms !== undefined && (
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>
                      Kechikish: {check.latency_ms} ms
                    </div>
                  )}
                  {check.workers !== undefined && (
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>
                      Workers: {check.workers}
                    </div>
                  )}
                  {check.detail && (
                    <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '6px', wordBreak: 'break-word' }}>
                      {check.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
