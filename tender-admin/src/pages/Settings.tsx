import { useState, useEffect } from 'react';
import { RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { settingsApi } from '../api/admin';

export default function SettingsPage() {
  const { addToast } = useAdmin();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [tab, setTab] = useState<'flags' | 'config'>('flags');

  useEffect(() => {
    setLoading(true);
    Promise.all([settingsApi.getFlags(), settingsApi.getConfig()])
      .then(([f, c]) => { setFlags(f); setConfig(c); })
      .catch(() => addToast('Xatolik', 'Sozlamalarni yuklashda xato', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const toggleFlag = async (name: string, value: boolean) => {
    setSaving(name);
    try {
      await settingsApi.setFlag(name, value);
      setFlags(prev => ({ ...prev, [name]: value }));
      addToast('Saqlandi', `${name} ${value ? 'yoqildi' : 'o\'chirildi'}`, 'success');
    } catch { addToast('Xatolik', 'Flag o\'zgartirishda xato', 'error'); }
    finally { setSaving(null); }
  };

  const updateConfig = async (key: string, value: unknown) => {
    setSaving(key);
    try {
      await settingsApi.setConfig(key, value);
      setConfig(prev => ({ ...prev, [key]: value }));
      addToast('Saqlandi', `${key} yangilandi`, 'success');
    } catch { addToast('Xatolik', 'Config o\'zgartirishda xato', 'error'); }
    finally { setSaving(null); }
  };

  const flagLabels: Record<string, string> = {
    ai_matching: 'AI moslik (matching)',
    email_notifications: 'Email bildirishnomalar',
    telegram_notifications: 'Telegram bildirishnomalar',
    websocket_events: 'WebSocket voqealari',
    price_analysis: 'Narx tahlili',
    pdf_export: 'PDF eksport',
    team_management: 'Jamoa boshqaruvi',
    api_access: 'API kirish',
    map_view: 'Xarita ko\'rinishi',
    maintenance_mode: 'Texnik ishlar rejimi',
  };

  const configLabels: Record<string, string> = {
    free_daily_search_limit: 'Free kunlik qidiruv limiti',
    pro_daily_search_limit: 'Pro kunlik qidiruv limiti',
    business_daily_search_limit: 'Business kunlik qidiruv limiti (-1 = cheksiz)',
    max_team_members_free: 'Free jamoa a\'zolari limiti',
    max_team_members_pro: 'Pro jamoa a\'zolari limiti',
    max_team_members_business: 'Business jamoa a\'zolari limiti',
    password_reset_ttl_minutes: 'Parol tiklash TTL (daqiqa)',
    email_verify_ttl_hours: 'Email tasdiq TTL (soat)',
    tender_scrape_interval_minutes: 'Scraper interval (daqiqa)',
  };

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
      <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} />
    </div>
  );

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Sozlamalar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Feature flaglar va platforma konfiguratsiyasi</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-16" style={{ padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-1)' }}>
          {([['flags', 'Feature Flaglar'], ['config', 'Konfiguratsiya']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '12px 20px', fontSize: '13px', fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--primary)' : 'var(--text-3)', borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent', background: 'none', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'flags' && (
        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {Object.entries(flags).map(([name, value], i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < Object.keys(flags).length - 1 ? '1px solid var(--border-1)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-0)' }}>{flagLabels[name] || name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'monospace', marginTop: '2px' }}>{name}</div>
                </div>
                <button
                  onClick={() => toggleFlag(name, !value)}
                  disabled={saving === name}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', border: `1px solid ${value ? 'var(--green)' : 'var(--border-1)'}`, background: value ? 'rgba(34,197,94,0.1)' : 'var(--bg-0)', color: value ? 'var(--green)' : 'var(--text-3)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}
                >
                  {saving === name ? <RefreshCw size={14} className="animate-spin" /> : value ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  {value ? 'Yoqiq' : 'O\'chiq'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'config' && (
        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {Object.entries(config).map(([key, value], i) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < Object.keys(config).length - 1 ? '1px solid var(--border-1)' : 'none', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-0)' }}>{configLabels[key] || key}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'monospace', marginTop: '2px' }}>{key}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    defaultValue={value as number}
                    onBlur={e => {
                      const newVal = Number(e.target.value);
                      if (newVal !== value) updateConfig(key, newVal);
                    }}
                    style={{ width: '100px', padding: '6px 10px', background: 'var(--bg-0)', border: '1px solid var(--border-1)', borderRadius: '6px', color: 'var(--text-0)', fontSize: '13px', textAlign: 'right' }}
                  />
                  {saving === key && <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--primary)' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
