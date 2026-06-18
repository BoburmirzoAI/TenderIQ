import { useState } from 'react';
import { Bot, Globe, Cpu, Brain, Zap, Play, RefreshCw, Send, CheckCircle, XCircle, Webhook, AlertCircle } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface Scraper {
  name: string;
  status: 'active' | 'error' | 'paused';
  last_run: string;
  next_run: string;
  error_count: number;
  found_today: number;
  success_rate: string;
}

const scrapers: Scraper[] = [
  { name: 'UZEX', status: 'active', last_run: '2026-06-17 14:20', next_run: '14:40', error_count: 0, found_today: 45, success_rate: '99%' },
  { name: 'MC.uz', status: 'error', last_run: '2026-06-17 13:05', next_run: '15:05', error_count: 3, found_today: 12, success_rate: '87%' },
  { name: 'MyGov', status: 'active', last_run: '2026-06-17 14:00', next_run: '15:00', error_count: 0, found_today: 28, success_rate: '98%' },
];

const celeryTasks = [
  { name: 'scrape_uzex', schedule: '*/20 * * * *', last_run: '14:20', next_run: '14:40', status: 'success' },
  { name: 'scrape_mc', schedule: '5 * * * *', last_run: '14:05', next_run: '15:05', status: 'success' },
  { name: 'retrain_price_model', schedule: '0 3 * * *', last_run: '03:00', next_run: '03:00 (ertaga)', status: 'success' },
  { name: 'send_daily_digest', schedule: '0 8 * * *', last_run: '08:00', next_run: '08:00 (ertaga)', status: 'success' },
  { name: 'send_deadline_reminders', schedule: '0 9 * * *', last_run: '09:00', next_run: '09:00 (ertaga)', status: 'success' },
  { name: 'cleanup_notifications', schedule: '0 2 * * 1', last_run: '02:00 (dush)', next_run: '02:00 (dush)', status: 'success' },
  { name: 'evaluate_model_drift', schedule: '0 4 * * *', last_run: '04:00', next_run: '04:00 (ertaga)', status: 'success' },
  { name: 'verify_backup', schedule: '0 6 * * *', last_run: '06:00', next_run: '06:00 (ertaga)', status: 'success' },
];

const mlModels = [
  { name: 'PriceModel', last_trained: '2026-06-17 03:00', samples: 2450, accuracy: 87.3, loaded: true },
  { name: 'WinProbabilityModel', last_trained: '2026-06-16 03:00', samples: 1890, accuracy: 82.1, loaded: true },
  { name: 'RiskAssessmentModel', last_trained: '2026-06-15 03:00', samples: 1560, accuracy: 79.5, loaded: true },
  { name: 'OptimalBidModel', last_trained: '2026-06-14 03:00', samples: 980, accuracy: 74.8, loaded: true },
  { name: 'TenderSimilarityModel', last_trained: '2026-06-17 03:00', samples: 3200, accuracy: 91.2, loaded: true },
  { name: 'AnomalyModel', last_trained: '2026-06-16 03:00', samples: 4500, accuracy: 85.6, loaded: true },
  { name: 'TrendForecastModel', last_trained: '2026-06-15 03:00', samples: 2100, accuracy: 76.3, loaded: true },
  { name: 'MatchingModel', last_trained: '2026-06-17 03:00', samples: 5600, accuracy: 89.7, loaded: true },
];

const integrationTests = [
  { name: 'PostgreSQL', service: 'postgres', icon: '🐘' },
  { name: 'Redis', service: 'redis', icon: '⚡' },
  { name: 'SMTP (Email)', service: 'smtp', icon: '📧' },
  { name: 'Telegram Bot', service: 'telegram', icon: '✈️' },
  { name: 'Click', service: 'click', icon: '💳' },
  { name: 'Payme', service: 'payme', icon: '💳' },
];

export default function IntegrationsPage() {
  const { addToast } = useAdmin();
  const [tab, setTab] = useState<'bot' | 'scrapers' | 'celery' | 'ml' | 'api'>('bot');
  const [triggeringTask, setTriggeringTask] = useState<string | null>(null);
  const [retrainingModel, setRetrainingModel] = useState<string | null>(null);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [runningScrapers, setRunningScrapers] = useState<Set<string>>(new Set());
  const [clearingQueue, setClearingQueue] = useState(false);
  const [testWebhook, setTestWebhook] = useState(false);
  const [botMessage, setBotMessage] = useState('');

  const triggerTask = (name: string) => {
    setTriggeringTask(name);
    addToast('Task', `${name} ishga tushirildi`, 'info');
    setTimeout(() => { setTriggeringTask(null); addToast('Tayyor', `${name} muvaffaqiyatli bajarildi`, 'success'); }, 2500);
  };

  const retrainModel = (name: string) => {
    setRetrainingModel(name);
    addToast('ML', `${name} qayta o'qitilmoqda...`, 'info');
    setTimeout(() => { setRetrainingModel(null); addToast('Tayyor', `${name} qayta o'qitildi — aniqlik yangilandi`, 'success'); }, 3000);
  };

  const testService = (service: string, name: string) => {
    setTestingService(service);
    addToast('Test', `${name} tekshirilmoqda...`, 'info');
    setTimeout(() => {
      setTestingService(null);
      addToast('Natija', `${name}: ulanish muvaffaqiyatli (45ms)`, 'success');
    }, 1500);
  };

  const runScraper = (name: string) => {
    setRunningScrapers(p => new Set([...p, name]));
    addToast('Scraper', `${name} qo'lda ishga tushirildi`, 'info');
    setTimeout(() => {
      setRunningScrapers(p => { const next = new Set(p); next.delete(name); return next; });
      addToast('Tayyor', `${name}: 12 ta yangi tender topildi`, 'success');
    }, 3000);
  };

  const clearQueue = () => {
    setClearingQueue(true);
    addToast('Navbat', 'Celery navbati tozalanmoqda...', 'info');
    setTimeout(() => { setClearingQueue(false); addToast('Tayyor', 'Navbat tozalandi', 'success'); }, 2000);
  };

  const testWebhookFn = () => {
    setTestWebhook(true);
    addToast('Webhook', 'Test so\'rovi yuborilmoqda...', 'info');
    setTimeout(() => {
      setTestWebhook(false);
      addToast('Webhook', 'Webhook ishlayapti — 200 OK qaytdi (142ms)', 'success');
    }, 1500);
  };

  const scrapeStatusBadge = (status: Scraper['status']) => {
    if (status === 'active') return 'badge-green';
    if (status === 'error') return 'badge-red';
    return 'badge-yellow';
  };

  const accuracyColor = (acc: number) => {
    if (acc >= 85) return 'var(--green)';
    if (acc >= 75) return 'var(--yellow)';
    return 'var(--orange)';
  };

  return (
    <div className="page-container">
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)', marginBottom: '24px' }}>Integratsiyalar</h1>

      <div className="tabs mb-24">
        <button className={`tab ${tab === 'bot' ? 'active' : ''}`} onClick={() => setTab('bot')}>Telegram Bot</button>
        <button className={`tab ${tab === 'scrapers' ? 'active' : ''}`} onClick={() => setTab('scrapers')}>Scraperlar</button>
        <button className={`tab ${tab === 'celery' ? 'active' : ''}`} onClick={() => setTab('celery')}>Celery</button>
        <button className={`tab ${tab === 'ml' ? 'active' : ''}`} onClick={() => setTab('ml')}>ML Modellar</button>
        <button className={`tab ${tab === 'api' ? 'active' : ''}`} onClick={() => setTab('api')}>API & Ulanishlar</button>
      </div>

      {/* Telegram Bot tab */}
      {tab === 'bot' && (
        <div>
          <div className="grid-3 mb-24">
            <div className="card stat-card">
              <div className="stat-label">Bot username</div>
              <div className="stat-value" style={{ fontSize: '18px', color: 'var(--cyan)' }}>@TendersIQbot</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Ro'yxatdan o'tgan</div>
              <div className="stat-value">456</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Faol guruhlar</div>
              <div className="stat-value">23</div>
            </div>
          </div>

          <div className="card mb-16">
            <div className="card-header flex-between">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Webhook sozlamasi</span>
              <span className="badge badge-green">Faol</span>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '12px' }}>
                <label className="input-label">Webhook URL</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input
                    className="input"
                    defaultValue="https://api.tenderiq.uz/bot/webhook"
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" onClick={() => addToast('Saqlandi', 'Webhook URL saqlandi', 'success')}>
                    Saqlash
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={testWebhookFn}
                    disabled={testWebhook}
                    style={{ flexShrink: 0 }}
                  >
                    {testWebhook
                      ? <><RefreshCw size={13} className="animate-spin" /> Tekshirilmoqda</>
                      : <><Webhook size={13} /> Test webhook</>}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div style={{ padding: '8px 12px', background: 'var(--bg-1)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-4)' }}>Token: </span>
                  <span className="font-mono" style={{ color: 'var(--text-2)' }}>861511***:AAH***</span>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-1)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-4)' }}>Ohirgi update: </span>
                  <span style={{ color: 'var(--text-2)' }}>14:30:12</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Broadcast xabar yuborish</span>
            </div>
            <div className="card-body">
              <div className="input-group mb-16">
                <label className="input-label">Xabar matni</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Barcha foydalanuvchilarga xabar..."
                  value={botMessage}
                  onChange={e => setBotMessage(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!botMessage.trim()) { addToast('Xato', 'Xabar matnini kiriting', 'error'); return; }
                  addToast('Yuborildi', 'Telegram xabari barcha foydalanuvchilarga yuborildi', 'success');
                  setBotMessage('');
                }}
              >
                <Send size={14} /> Yuborish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scrapers tab */}
      {tab === 'scrapers' && (
        <div className="grid-3">
          {scrapers.map(s => (
            <div key={s.name} className="card">
              <div className="card-header flex-between">
                <span style={{ fontWeight: 700, color: 'var(--text-0)', fontSize: '15px' }}>{s.name}</span>
                <span className={`badge ${scrapeStatusBadge(s.status)}`}>
                  {s.status === 'active' ? 'Faol' : s.status === 'error' ? 'Xato' : 'To\'xtatilgan'}
                </span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'var(--bg-1)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-4)', marginBottom: '2px' }}>Oxirgi ishga tushish</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-1)', fontWeight: 500 }}>{s.last_run}</div>
                  </div>
                  <div style={{ background: 'var(--bg-1)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-4)', marginBottom: '2px' }}>Keyingisi</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-1)', fontWeight: 500 }}>{s.next_run}</div>
                  </div>
                  <div style={{ background: 'var(--bg-1)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-4)', marginBottom: '2px' }}>Bugun topildi</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-0)', fontWeight: 700 }}>{s.found_today}</div>
                  </div>
                  <div style={{ background: 'var(--bg-1)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-4)', marginBottom: '2px' }}>Muvaffaqiyat</div>
                    <div style={{ fontSize: '14px', color: 'var(--green)', fontWeight: 700 }}>{s.success_rate}</div>
                  </div>
                </div>

                {s.error_count > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertCircle size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'var(--red)' }}>{s.error_count} ta xato yozuvi</span>
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '11px' }}>Max retries</label>
                  <input className="input" type="number" defaultValue={3} style={{ height: '32px', fontSize: '12px' }} />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '11px' }}>Timeout (s)</label>
                  <input className="input" type="number" defaultValue={30} style={{ height: '32px', fontSize: '12px' }} />
                </div>

                <button
                  className="btn btn-sm btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => runScraper(s.name)}
                  disabled={runningScrapers.has(s.name)}
                >
                  {runningScrapers.has(s.name)
                    ? <><RefreshCw size={12} className="animate-spin" /> Ishlamoqda...</>
                    : <><Play size={12} /> Hozir ishga tushirish</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Celery tab */}
      {tab === 'celery' && (
        <div>
          <div className="grid-4 mb-24">
            <div className="card stat-card">
              <div className="stat-label">Workers</div>
              <div className="stat-value">2</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Faol tasklar</div>
              <div className="stat-value">0</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Rezerv</div>
              <div className="stat-value">3</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Rejalashtirilgan</div>
              <div className="stat-value">{celeryTasks.length}</div>
            </div>
          </div>

          <div className="card mb-16">
            <div className="card-header flex-between">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Beat Schedule</span>
              <button
                className="btn btn-sm btn-danger"
                onClick={clearQueue}
                disabled={clearingQueue}
              >
                {clearingQueue
                  ? <><RefreshCw size={12} className="animate-spin" /> Tozalanmoqda</>
                  : 'Navbatni tozalash'}
              </button>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Task nomi</th>
                    <th style={{ padding: '12px 16px' }}>Jadval</th>
                    <th style={{ padding: '12px 16px' }}>Oxirgi</th>
                    <th style={{ padding: '12px 16px' }}>Keyingisi</th>
                    <th style={{ padding: '12px 16px' }}>Holat</th>
                    <th style={{ padding: '12px 16px' }}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {celeryTasks.map(t => (
                    <tr key={t.name}>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="font-mono" style={{ fontSize: '12px', color: 'var(--primary)' }}>{t.name}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="font-mono" style={{ fontSize: '12px' }}>{t.schedule}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: '13px' }}>{t.last_run}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: '13px' }}>{t.next_run}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-green">OK</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => triggerTask(t.name)}
                          disabled={triggeringTask === t.name}
                        >
                          {triggeringTask === t.name
                            ? <><RefreshCw size={12} className="animate-spin" /> Ishlamoqda</>
                            : <><Play size={12} /> Trigger</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>So'nggi task tarixi</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['scrape_uzex: 45 tender (2.1s)', 'scrape_mc: 12 tender (8.4s)', 'send_deadline_reminders: 23 xabar (1.2s)'].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', background: 'var(--bg-1)', borderRadius: '6px'
                }}>
                  <CheckCircle size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-2)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ML Models tab */}
      {tab === 'ml' && (
        <div className="grid-2">
          {mlModels.map(m => (
            <div key={m.name} className="card">
              <div className="card-header flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={16} style={{ color: 'var(--purple)' }} />
                  <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>{m.name}</span>
                </div>
                <span className={`badge ${m.loaded ? 'badge-green' : 'badge-red'}`}>
                  {m.loaded ? 'Yuklangan' : 'Yuklanmagan'}
                </span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: accuracyColor(m.accuracy) }}>
                      {m.accuracy}%
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Aniqlik darajasi</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-0)' }}>
                      {m.samples.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Namunalar</div>
                  </div>
                </div>

                <div className="progress mb-16">
                  <div
                    className="progress-fill"
                    style={{ width: `${m.accuracy}%`, background: accuracyColor(m.accuracy) }}
                  />
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: '12px' }}>
                  Oxirgi o'qitish: <span style={{ color: 'var(--text-2)' }}>{m.last_trained}</span>
                </div>

                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => retrainModel(m.name)}
                  disabled={retrainingModel === m.name}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {retrainingModel === m.name
                    ? <><RefreshCw size={12} className="animate-spin" /> O'qitilmoqda...</>
                    : <><Brain size={12} /> Qayta o'qitish</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API Config tab */}
      {tab === 'api' && (
        <div>
          <div className="card mb-24">
            <div className="card-header">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>API kalitlari (yashirilgan)</span>
            </div>
            <div className="card-body">
              <div className="grid-2" style={{ gap: '12px' }}>
                {[
                  { label: 'Anthropic API Key', value: 'sk-ant-***...***' },
                  { label: 'Claude Model', value: 'claude-sonnet-4-20250514' },
                  { label: 'Click Merchant ID', value: '***...***' },
                  { label: 'Payme Merchant ID', value: '***...***' },
                  { label: 'SMTP User', value: 'sobirjonov***@gmail.com' },
                  { label: 'Telegram Bot Token', value: '861511***:AAH***' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '10px 12px', background: 'var(--bg-1)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>{item.label}</div>
                    <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-2)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Ulanish testlari</span>
            </div>
            <div className="card-body">
              <div className="grid-3">
                {integrationTests.map(t => (
                  <div
                    key={t.service}
                    style={{
                      padding: '16px', background: 'var(--bg-1)', borderRadius: '10px',
                      border: '1px solid var(--border-1)', display: 'flex', flexDirection: 'column', gap: '12px'
                    }}
                  >
                    <div className="flex-between">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{t.icon}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-0)', fontSize: '13px' }}>{t.name}</span>
                      </div>
                      {testingService === t.service
                        ? <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--primary)' }} />
                        : <Globe size={14} style={{ color: 'var(--text-4)' }} />}
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => testService(t.service, t.name)}
                      disabled={testingService === t.service}
                    >
                      {testingService === t.service ? 'Tekshirilmoqda...' : <><Zap size={11} /> Test</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
