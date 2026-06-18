import { useState, useRef } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { AlertTriangle, X, Copy, Check, RotateCcw, Wifi, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { addToast } = useAdmin();
  const [tab, setTab] = useState<'flags' | 'scraper' | 'matching' | 'plans' | 'env' | 'security'>('flags');
  const [confirmFlag, setConfirmFlag] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [envSearch, setEnvSearch] = useState('');

  const [flags, setFlags] = useState({
    scraper_enabled: true,
    ml_free_access: false,
    maintenance_mode: false,
    registration_enabled: true,
    bot_enabled: true,
    email_enabled: true,
  });

  const [scraperConfig, setScraperConfig] = useState({
    max_retries: 3, timeout: 30,
    uzex_enabled: true, mc_enabled: true, mygov_enabled: true,
  });

  const [matchWeights, setMatchWeights] = useState({
    text: 40, category: 25, region: 20, amount: 15, threshold: 65,
  });
  const defaultWeights = { text: 40, category: 25, region: 20, amount: 15, threshold: 65 };

  const [planLimits, setPlanLimits] = useState({
    free: { price: 0, daily: 50, saved: 10, team: 1 },
    pro: { price: 299000, daily: 500, saved: 500, team: 1 },
    business: { price: 990000, daily: 5000, saved: -1, team: 5 },
  });
  const [planErrors, setPlanErrors] = useState<Record<string, string>>({});

  const [security, setSecurity] = useState({
    min_password_length: 8,
    session_timeout: 30,
    max_login_attempts: 5,
    two_fa_enabled: false,
    require_uppercase: true,
    require_numbers: true,
  });

  const [scraperTesting, setScraperTesting] = useState<string | null>(null);

  const criticalFlags = ['maintenance_mode'];

  const toggleFlag = (key: keyof typeof flags) => {
    if (criticalFlags.includes(key) && !flags[key]) {
      setConfirmFlag(key);
      return;
    }
    setFlags(p => ({ ...p, [key]: !p[key] }));
    addToast('O\'zgartirildi', `${key} ${flags[key] ? 'o\'chirildi' : 'yoqildi'}`, 'info');
  };

  const confirmCriticalFlag = () => {
    if (confirmFlag) {
      setFlags(p => ({ ...p, [confirmFlag]: !p[confirmFlag as keyof typeof flags] }));
      addToast('Ogohlantirish', `${confirmFlag} yoqildi!`, 'error');
      setConfirmFlag(null);
    }
  };

  const updateWeight = (key: string, val: number) => {
    setMatchWeights(p => ({ ...p, [key]: val }));
  };

  const resetWeights = () => {
    setMatchWeights(defaultWeights);
    addToast('Qaytarildi', 'Match vaznlari standart holatga qaytarildi', 'info');
  };

  const testScraper = (source: string) => {
    setScraperTesting(source);
    setTimeout(() => {
      setScraperTesting(null);
      addToast('Ulanish muvaffaqiyatli', `${source} saytiga ulanish ishlayapti`, 'success');
    }, 2000);
  };

  const validatePlan = (plan: string, field: string, value: number) => {
    const key = `${plan}_${field}`;
    if (value < -1) {
      setPlanErrors(p => ({ ...p, [key]: 'Qiymat -1 dan kichik bo\'lmasligi kerak' }));
    } else if (field === 'price' && value < 0) {
      setPlanErrors(p => ({ ...p, [key]: 'Narx manfiy bo\'lmasligi kerak' }));
    } else {
      setPlanErrors(p => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  const copyToClipboard = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const totalWeights = matchWeights.text + matchWeights.category + matchWeights.region + matchWeights.amount;

  const envDisplay = [
    { key: 'APP_ENV', value: 'development' },
    { key: 'APP_NAME', value: 'TenderIQ' },
    { key: 'API_VERSION', value: 'v1' },
    { key: 'LOG_LEVEL', value: 'INFO' },
    { key: 'UPLOAD_DIR', value: 'uploads' },
    { key: 'ML_MODEL_DIR', value: 'app/ml/saved_models' },
    { key: 'ML_RETRAIN_MIN_SAMPLES', value: '100' },
    { key: 'ALLOWED_ORIGINS', value: 'localhost:3000, localhost:8000' },
    { key: 'TELEGRAM_BOT', value: '@TendersIQbot' },
    { key: 'EMAIL_FROM', value: 'noreply@tenderiq.uz' },
    { key: 'CELERY_BROKER', value: 'redis://localhost:6379/0' },
    { key: 'DATABASE_URL', value: 'postgresql://***:***@localhost:5432/tenderiq' },
  ];

  const filteredEnv = envDisplay.filter(e =>
    e.key.toLowerCase().includes(envSearch.toLowerCase()) || e.value.toLowerCase().includes(envSearch.toLowerCase())
  );

  return (
    <div className="page-container">
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)', marginBottom: '24px' }}>Sozlamalar</h1>

      <div className="tabs mb-24">
        <button className={`tab ${tab === 'flags' ? 'active' : ''}`} onClick={() => setTab('flags')}>Feature Flags</button>
        <button className={`tab ${tab === 'scraper' ? 'active' : ''}`} onClick={() => setTab('scraper')}>Scraper</button>
        <button className={`tab ${tab === 'matching' ? 'active' : ''}`} onClick={() => setTab('matching')}>Match Weights</button>
        <button className={`tab ${tab === 'plans' ? 'active' : ''}`} onClick={() => setTab('plans')}>Plan Limits</button>
        <button className={`tab ${tab === 'env' ? 'active' : ''}`} onClick={() => setTab('env')}>Environment</button>
        <button className={`tab ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>Xavfsizlik</button>
      </div>

      {tab === 'flags' && (
        <div className="card">
          <div className="card-header"><span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Feature flaglar</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {([
              ['scraper_enabled', 'Scraperlar faol', 'Barcha scraperlarni yoqish/o\'chirish', false],
              ['ml_free_access', 'Free foydalanuvchilarga ML', 'Free planga ML tahlilni ochish', false],
              ['maintenance_mode', 'Texnik xizmat rejimi', 'Non-admin foydalanuvchilarga 503 qaytarish', true],
              ['registration_enabled', 'Ro\'yxatdan o\'tish', 'Yangi foydalanuvchilar ro\'yxatdan o\'ta oladi', false],
              ['bot_enabled', 'Telegram bot', 'Botni yoqish/o\'chirish', false],
              ['email_enabled', 'Email bildirishnomalar', 'Email yuborishni yoqish/o\'chirish', false],
            ] as [keyof typeof flags, string, string, boolean][]).map(([key, label, desc, critical]) => (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: 'var(--bg-0)', borderRadius: '8px',
                border: `1px solid ${critical && flags[key] ? 'rgba(239,68,68,0.3)' : 'var(--border-1)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {critical && <AlertTriangle size={16} style={{ color: 'var(--yellow)' }} />}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>{label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{desc}</div>
                  </div>
                </div>
                <button className={`toggle ${flags[key] ? 'active' : ''}`} onClick={() => toggleFlag(key)} />
              </div>
            ))}
          </div>
          <div className="card-footer">
            <button className="btn btn-primary" onClick={() => addToast('Saqlandi', 'Feature flaglar yangilandi', 'success')}>Saqlash</button>
          </div>
        </div>
      )}

      {tab === 'scraper' && (
        <div className="card">
          <div className="card-header"><span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Scraper sozlamalari</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Max Retries</label>
                <input className="input" type="number" value={scraperConfig.max_retries} onChange={e => setScraperConfig(p => ({ ...p, max_retries: +e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Timeout (s)</label>
                <input className="input" type="number" value={scraperConfig.timeout} onChange={e => setScraperConfig(p => ({ ...p, timeout: +e.target.value }))} />
              </div>
            </div>
            <div className="divider" />
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>Scraperlar</div>
            {([
              ['uzex_enabled', 'UZEX', 'uzex.uz'] as const,
              ['mc_enabled', 'MC.UZ', 'mc.uz'] as const,
              ['mygov_enabled', 'MyGov', 'xarid.mygov.uz'] as const,
            ]).map(([key, label, url]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-0)' }}>{label}</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{url}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => testScraper(label)}
                    disabled={scraperTesting === label}
                  >
                    <Wifi size={14} />
                    {scraperTesting === label ? 'Tekshirilmoqda...' : 'Test'}
                  </button>
                  <button className={`toggle ${scraperConfig[key] ? 'active' : ''}`} onClick={() => setScraperConfig(p => ({ ...p, [key]: !p[key] }))} />
                </div>
              </div>
            ))}
          </div>
          <div className="card-footer">
            <button className="btn btn-primary" onClick={() => addToast('Saqlandi', 'Scraper sozlamalari yangilandi', 'success')}>Saqlash</button>
          </div>
        </div>
      )}

      {tab === 'matching' && (
        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Match vaznlari</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className={`badge ${totalWeights === 100 ? 'badge-green' : 'badge-red'}`}>Jami: {totalWeights}%</span>
              <button className="btn btn-sm btn-ghost" onClick={resetWeights}><RotateCcw size={14} /> Standart</button>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {([
              ['text', 'Matn moslik vazni'],
              ['category', 'Kategoriya vazni'],
              ['region', 'Hudud vazni'],
              ['amount', 'Summa vazni'],
            ] as [keyof typeof matchWeights, string][]).map(([key, label]) => (
              <div key={key}>
                <div className="flex-between mb-8">
                  <span style={{ fontSize: '13px', color: 'var(--text-1)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{matchWeights[key]}%</span>
                </div>
                <input type="range" className="slider" min={0} max={100} value={matchWeights[key]} onChange={e => updateWeight(key, +e.target.value)} />
              </div>
            ))}
            <div className="divider" />
            <div>
              <div className="flex-between mb-8">
                <span style={{ fontSize: '13px', color: 'var(--text-1)' }}>Match threshold</span>
                <span style={{ fontWeight: 700, color: 'var(--yellow)' }}>{matchWeights.threshold}%</span>
              </div>
              <input type="range" className="slider" min={0} max={100} value={matchWeights.threshold} onChange={e => updateWeight('threshold', +e.target.value)} />
            </div>
          </div>
          <div className="card-footer">
            <button className="btn btn-primary" disabled={totalWeights !== 100} onClick={() => addToast('Saqlandi', 'Match vaznlari yangilandi', 'success')}>
              {totalWeights !== 100 ? `Jami 100% bo'lishi kerak (hozir: ${totalWeights}%)` : 'Saqlash'}
            </button>
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <div className="card">
          <div className="card-header"><span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Plan limitlari va narxlari</span></div>
          <div className="card-body">
            <div className="table-wrap">
              <table className="table">
                <thead><tr>
                  <th style={{ padding: '12px 16px' }}>Xususiyat</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>FREE</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>PRO</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>BUSINESS</th>
                </tr></thead>
                <tbody>
                  {(['price', 'daily', 'saved', 'team'] as const).map(field => {
                    const labels: Record<string, string> = { price: 'Narx (UZS/oy)', daily: 'Kunlik so\'rovlar', saved: 'Saqlangan tenderlar', team: 'Jamoa a\'zolari' };
                    return (
                      <tr key={field}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{labels[field]}</td>
                        {(['free', 'pro', 'business'] as const).map(plan => {
                          const errorKey = `${plan}_${field}`;
                          return (
                            <td key={plan} style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <input
                                className="input"
                                type="number"
                                value={planLimits[plan][field]}
                                onChange={e => {
                                  const val = +e.target.value;
                                  setPlanLimits(p => ({ ...p, [plan]: { ...p[plan], [field]: val } }));
                                  validatePlan(plan, field, val);
                                }}
                                style={{ width: '120px', height: '34px', textAlign: 'center', border: planErrors[errorKey] ? '1px solid var(--red)' : undefined }}
                              />
                              {planErrors[errorKey] && <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px' }}>{planErrors[errorKey]}</div>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer">
            <button
              className="btn btn-primary"
              disabled={Object.keys(planErrors).length > 0}
              onClick={() => addToast('Saqlandi', 'Plan limitlari yangilandi', 'success')}
            >
              {Object.keys(planErrors).length > 0 ? 'Xatoliklarni to\'g\'rilang' : 'Saqlash'}
            </button>
          </div>
        </div>
      )}

      {tab === 'env' && (
        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Environment (faqat o'qish)</span>
            <input className="input" placeholder="Qidirish..." value={envSearch} onChange={e => setEnvSearch(e.target.value)} style={{ width: '200px', height: '32px' }} />
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredEnv.map(e => (
                <div key={e.key} style={{
                  display: 'flex', alignItems: 'center', padding: '10px 14px',
                  background: 'var(--bg-0)', borderRadius: '6px', border: '1px solid var(--border-1)'
                }}>
                  <span className="font-mono" style={{ width: '260px', fontSize: '12px', color: 'var(--text-3)', flexShrink: 0 }}>{e.key}</span>
                  <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-0)', flex: 1 }}>{e.value}</span>
                  <button
                    className="btn-icon"
                    title="Nusxa olish"
                    onClick={() => copyToClipboard(e.key, e.value)}
                    style={{ flexShrink: 0 }}
                  >
                    {copiedKey === e.key ? <Check size={14} style={{ color: 'var(--green)' }} /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--primary)' }} /> Xavfsizlik sozlamalari
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>Parol siyosati</div>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Minimal parol uzunligi</label>
                <input className="input" type="number" min={6} max={32} value={security.min_password_length}
                  onChange={e => setSecurity(p => ({ ...p, min_password_length: +e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Muvaffaqiyatsiz kirish urinishlari (max)</label>
                <input className="input" type="number" min={3} max={20} value={security.max_login_attempts}
                  onChange={e => setSecurity(p => ({ ...p, max_login_attempts: +e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>Katta harf talab qilish</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Parolda kamida 1 ta katta harf</div>
                </div>
                <button className={`toggle ${security.require_uppercase ? 'active' : ''}`} onClick={() => setSecurity(p => ({ ...p, require_uppercase: !p.require_uppercase }))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>Raqam talab qilish</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Parolda kamida 1 ta raqam</div>
                </div>
                <button className={`toggle ${security.require_numbers ? 'active' : ''}`} onClick={() => setSecurity(p => ({ ...p, require_numbers: !p.require_numbers }))} />
              </div>
            </div>

            <div className="divider" />
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>Sessiya boshqaruvi</div>
            <div className="input-group">
              <label className="input-label">Sessiya timeout (daqiqa)</label>
              <input className="input" type="number" min={5} max={1440} value={security.session_timeout}
                onChange={e => setSecurity(p => ({ ...p, session_timeout: +e.target.value }))} style={{ width: '200px' }} />
            </div>

            <div className="divider" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>Ikki bosqichli autentifikatsiya (2FA)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Barcha foydalanuvchilar uchun 2FA ni majburiy qilish</div>
              </div>
              <button className={`toggle ${security.two_fa_enabled ? 'active' : ''}`} onClick={() => setSecurity(p => ({ ...p, two_fa_enabled: !p.two_fa_enabled }))} />
            </div>
          </div>
          <div className="card-footer">
            <button className="btn btn-primary" onClick={() => addToast('Saqlandi', 'Xavfsizlik sozlamalari yangilandi', 'success')}>Saqlash</button>
          </div>
        </div>
      )}

      {confirmFlag && (
        <div className="modal-overlay" onClick={() => setConfirmFlag(null)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> Ogohlantirish!
              </h3>
              <button className="btn-icon" onClick={() => setConfirmFlag(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--red-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={28} style={{ color: 'var(--red)' }} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)' }}>Texnik xizmat rejimini yoqmoqchimisiz?</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>
                Bu barcha non-admin foydalanuvchilarga 503 xato qaytaradi. Platforma to'liq ishlamay qoladi!
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmFlag(null)}>Bekor qilish</button>
              <button className="btn btn-danger" onClick={confirmCriticalFlag}>Ha, yoqish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
