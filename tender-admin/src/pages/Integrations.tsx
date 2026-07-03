import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Brain, CheckCircle, Clock, Edit3, Globe, Play, RefreshCw, Send, X, Zap } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import {
  type BeatTask,
  type BotInfo,
  type CeleryStats,
  type ConnectionTestResult,
  type MLModelInfo,
  type ScraperStatus,
  integrationsApi,
} from '../api/admin';

// ── Cron helpers ──────────────────────────────────────────────────────────────

const CRON_PRESETS = [
  { label: 'Har 10 daqiqa', value: '*/10 * * * *' },
  { label: 'Har 20 daqiqa', value: '*/20 * * * *' },
  { label: 'Har 30 daqiqa', value: '*/30 * * * *' },
  { label: 'Har soat',      value: '0 * * * *' },
  { label: 'Har 6 soat',    value: '0 */6 * * *' },
  { label: 'Har kun 00:00', value: '0 0 * * *' },
  { label: 'Har kun 03:00', value: '0 3 * * *' },
  { label: 'Har kun 08:00', value: '0 8 * * *' },
  { label: 'Har dushanba',  value: '0 2 * * 1' },
];

const CRON_PART_LABELS = ['daqiqa', 'soat', 'kun', 'oy', 'hafta kuni'];

const describeCron = (cron: string): string => {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return "Noto'g'ri format";
  const [min, hour, , , dow] = parts;
  if (cron === '*/10 * * * *') return 'Har 10 daqiqada';
  if (cron === '*/15 * * * *') return 'Har 15 daqiqada';
  if (cron === '*/20 * * * *') return 'Har 20 daqiqada';
  if (cron === '*/30 * * * *') return 'Har 30 daqiqada';
  if (min === '*' && hour === '*') return 'Har daqiqada';
  if (min.startsWith('*/')) return `Har ${min.slice(2)} daqiqada`;
  if (hour === '*' && min !== '*') return `Har soat ${min}-daqiqasida`;
  if (hour.startsWith('*/') && min === '0') return `Har ${hour.slice(2)} soatda`;
  const days = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
  if (dow !== '*' && !dow.includes('/') && !dow.includes(','))
    return `Har ${days[+dow] ?? dow}da soat ${hour}:${min.padStart(2, '0')}da`;
  return `Har kun soat ${hour}:${min.padStart(2, '0')}da`;
};

const isCronValid = (cron: string): boolean => {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  return parts.every(p => /^(\*|\d+(-\d+)?(,\d+(-\d+)?)*|\*\/\d+)$/.test(p));
};

const INTEGRATION_TESTS = [
  { name: 'PostgreSQL', service: 'postgres',  icon: '🐘' },
  { name: 'Redis',      service: 'redis',     icon: '⚡' },
  { name: 'SMTP',       service: 'smtp',      icon: '📧' },
  { name: 'Telegram',   service: 'telegram',  icon: '✈️' },
  { name: 'Click',      service: 'click',     icon: '💳' },
  { name: 'Payme',      service: 'payme',     icon: '💳' },
];

const statusColor = (s: string) => {
  if (s === 'ok') return 'var(--green)';
  if (s === 'error') return 'var(--red)';
  if (s === 'not_configured') return 'var(--yellow)';
  return 'var(--text-4)';
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { addToast } = useAdmin();
  const [tab, setTab] = useState<'celery' | 'scrapers' | 'bot' | 'ml' | 'api'>('celery');

  // Celery
  const [celeryStats, setCeleryStats] = useState<CeleryStats | null>(null);
  const [schedule, setSchedule] = useState<BeatTask[]>([]);
  const [loadingCelery, setLoadingCelery] = useState(false);
  const [triggeringTask, setTriggeringTask] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<BeatTask | null>(null);
  const [editSchedule, setEditSchedule] = useState('');
  const [clearingQueue, setClearingQueue] = useState(false);

  // Scrapers
  const [scrapers, setScrapers] = useState<ScraperStatus[]>([]);
  const [loadingScrapers, setLoadingScrapers] = useState(false);
  const [runningScrapers, setRunningScrapers] = useState<Set<string>>(new Set());

  // ML
  const [mlModels, setMlModels] = useState<MLModelInfo[]>([]);
  const [loadingML, setLoadingML] = useState(false);
  const [retrainingModel, setRetrainingModel] = useState<string | null>(null);

  // Bot
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [loadingBot, setLoadingBot] = useState(false);
  const [botMessage, setBotMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Connection tests
  const [testResults, setTestResults] = useState<Record<string, ConnectionTestResult>>({});
  const [testingService, setTestingService] = useState<string | null>(null);

  // ── Loaders ──────────────────────────────────────────────────────────────────

  const loadCelery = useCallback(async () => {
    setLoadingCelery(true);
    try {
      const [stats, sched] = await Promise.all([
        integrationsApi.celeryStats(),
        integrationsApi.celerySchedule(),
      ]);
      setCeleryStats(stats);
      setSchedule(sched);
    } catch {
      addToast('Xatolik', "Celery ma'lumotlarini yuklab bo'lmadi", 'error');
    } finally {
      setLoadingCelery(false);
    }
  }, [addToast]);

  const loadScrapers = useCallback(async () => {
    setLoadingScrapers(true);
    try {
      setScrapers(await integrationsApi.scrapers());
    } catch {
      addToast('Xatolik', "Scraper ma'lumotlarini yuklab bo'lmadi", 'error');
    } finally {
      setLoadingScrapers(false);
    }
  }, [addToast]);

  const loadML = useCallback(async () => {
    setLoadingML(true);
    try {
      setMlModels(await integrationsApi.mlModels());
    } catch {
      addToast('Xatolik', "ML modellarini yuklab bo'lmadi", 'error');
    } finally {
      setLoadingML(false);
    }
  }, [addToast]);

  const loadBot = useCallback(async () => {
    setLoadingBot(true);
    try {
      setBotInfo(await integrationsApi.botInfo());
    } catch {
      addToast('Xatolik', "Bot ma'lumotlarini yuklab bo'lmadi", 'error');
    } finally {
      setLoadingBot(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (tab === 'celery') loadCelery();
    else if (tab === 'scrapers') loadScrapers();
    else if (tab === 'ml') loadML();
    else if (tab === 'bot') loadBot();
  }, [tab, loadCelery, loadScrapers, loadML, loadBot]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const triggerTask = async (taskName: string) => {
    setTriggeringTask(taskName);
    try {
      const res = await integrationsApi.triggerTask(taskName);
      addToast('Task yuborildi', `ID: ${res.task_id}`, 'success');
    } catch {
      addToast('Xatolik', 'Task yuborishda xato', 'error');
    } finally {
      setTriggeringTask(null);
    }
  };

  const runScraper = async (name: string) => {
    setRunningScrapers(p => new Set([...p, name]));
    try {
      const res = await integrationsApi.runScraper(name);
      addToast('Scraper', `${name} navbatga qo'shildi (ID: ${res.task_id})`, 'success');
    } catch {
      addToast('Xatolik', `${name} scraperini ishga tushirib bo'lmadi`, 'error');
    } finally {
      setRunningScrapers(p => { const n = new Set(p); n.delete(name); return n; });
    }
  };

  const retrainModel = async (name: string) => {
    setRetrainingModel(name);
    try {
      const res = await integrationsApi.retrainModel(name);
      addToast('ML', `${name} qayta o'qitish navbatga qo'shildi (ID: ${res.task_id})`, 'success');
    } catch {
      addToast('Xatolik', `${name} qayta o'qitishda xato`, 'error');
    } finally {
      setRetrainingModel(null);
    }
  };

  const sendBroadcast = async () => {
    if (!botMessage.trim()) { addToast('Xato', 'Xabar matnini kiriting', 'error'); return; }
    setSendingBroadcast(true);
    try {
      const res = await integrationsApi.botBroadcast(botMessage.trim());
      addToast('Yuborildi', `${res.sent} ta foydalanuvchiga xabar yuborildi`, 'success');
      setBotMessage('');
    } catch {
      addToast('Xatolik', 'Telegram xabar yuborishda xato', 'error');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const testConnection = async (service: string) => {
    setTestingService(service);
    try {
      const res = await integrationsApi.testConnection(service);
      setTestResults(p => ({ ...p, [service]: res }));
      const msg = res.status === 'ok' ? `${res.latency_ms}ms` : res.detail || res.status;
      addToast(
        res.status === 'ok' ? 'Muvaffaqiyatli' : 'Xato',
        `${service}: ${msg}`,
        res.status === 'ok' ? 'success' : 'error',
      );
    } catch {
      addToast('Xatolik', `${service} testida xato`, 'error');
    } finally {
      setTestingService(null);
    }
  };

  const openEditTask = (t: BeatTask) => { setEditTask(t); setEditSchedule(t.schedule); };
  const closeEditTask = () => { setEditTask(null); setEditSchedule(''); };

  const saveTaskSchedule = () => {
    if (!editTask || !isCronValid(editSchedule)) return;
    setSchedule(prev => prev.map(t => t.name === editTask.name ? { ...t, schedule: editSchedule } : t));
    addToast('Saqlandi', `${editTask.name} jadvali yangilandi`, 'success');
    closeEditTask();
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const Spinner = () => (
    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-4)' }}>
      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
      <div>Yuklanmoqda...</div>
    </div>
  );

  return (
    <div className="page-container">
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)', marginBottom: '24px' }}>
        Integratsiyalar
      </h1>

      <div className="tabs mb-24">
        {(['celery', 'scrapers', 'bot', 'ml', 'api'] as const).map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'celery' ? 'Celery' : t === 'scrapers' ? 'Scraperlar' : t === 'bot' ? 'Telegram Bot' : t === 'ml' ? 'ML Modellar' : 'API & Ulanishlar'}
          </button>
        ))}
      </div>

      {/* ── Celery tab ── */}
      {tab === 'celery' && (
        loadingCelery ? <Spinner /> : (
          <div>
            <div className="grid-4 mb-24">
              {[
                { label: 'Workers',        value: celeryStats?.workers ?? 0 },
                { label: 'Faol tasklar',   value: celeryStats?.active_tasks ?? 0 },
                { label: 'Rezerv',         value: celeryStats?.reserved_tasks ?? 0 },
                { label: 'Rejalashtirilgan', value: schedule.length },
              ].map(s => (
                <div key={s.label} className="card stat-card">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="card mb-16">
              <div className="card-header flex-between">
                <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Beat Schedule</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-sm" onClick={loadCelery}>
                    <RefreshCw size={12} /> Yangilash
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => { setClearingQueue(true); addToast("Ma'lumot", 'Navbatni tozalash worker restart orqali amalga oshiriladi', 'info'); setClearingQueue(false); }} disabled={clearingQueue}>
                    Navbatni tozalash
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Task nomi</th>
                      <th>Jadval</th>
                      <th>Tavsif</th>
                      <th>Holat</th>
                      <th>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map(t => (
                      <tr key={t.name}>
                        <td>
                          <span className="font-mono" style={{ fontSize: '12px', color: 'var(--primary)' }}>
                            {t.name}
                          </span>
                        </td>
                        <td>
                          <code style={{ fontSize: '11px', background: 'var(--bg-0)', padding: '2px 7px', borderRadius: '4px', color: 'var(--text-1)' }}>
                            {t.schedule}
                          </code>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-3)', maxWidth: '200px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {t.description || describeCron(t.schedule)}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-green">Faol</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn-icon" title="Jadvalni tahrirlash" onClick={() => openEditTask(t)} style={{ color: 'var(--primary)' }}>
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn btn-sm"
                              onClick={() => triggerTask(t.task)}
                              disabled={triggeringTask === t.task}
                              style={{ padding: '4px 8px' }}
                            >
                              {triggeringTask === t.task
                                ? <RefreshCw size={11} className="animate-spin" />
                                : <><Play size={11} /> Trigger</>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {celeryStats && celeryStats.worker_names.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Faol workerlar</span>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {celeryStats.worker_names.map(name => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg-1)', borderRadius: '6px' }}>
                      <CheckCircle size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
                      <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-2)' }}>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ── Scrapers tab ── */}
      {tab === 'scrapers' && (
        loadingScrapers ? <Spinner /> : (
          <div className="grid-3">
            {scrapers.map(s => (
              <div key={s.name} className="card">
                <div className="card-header flex-between">
                  <span style={{ fontWeight: 700, color: 'var(--text-0)', fontSize: '15px' }}>{s.name}</span>
                  <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                    {s.status === 'active' ? 'Faol' : 'Xato'}
                  </span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {s.last_result ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ background: 'var(--bg-1)', padding: '8px 10px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-4)', marginBottom: '2px' }}>Manba</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-1)', fontWeight: 500 }}>{s.last_result.source}</div>
                      </div>
                      <div style={{ background: 'var(--bg-1)', padding: '8px 10px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-4)', marginBottom: '2px' }}>Oxirgi natija</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-0)', fontWeight: 700 }}>{s.last_result.new_tenders} ta yangi tender</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', background: 'var(--bg-1)', borderRadius: '6px' }}>
                      <AlertCircle size={13} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>Hali ishga tushurilmagan</span>
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {s.task_name}
                  </div>
                  <button
                    className="btn btn-sm btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => runScraper(s.name)}
                    disabled={runningScrapers.has(s.name)}
                  >
                    {runningScrapers.has(s.name)
                      ? <><RefreshCw size={12} className="animate-spin" /> Navbatga qo'shilmoqda...</>
                      : <><Play size={12} /> Hozir ishga tushirish</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Telegram Bot tab ── */}
      {tab === 'bot' && (
        loadingBot ? <Spinner /> : (
          <div>
            <div className="grid-3 mb-24">
              <div className="card stat-card">
                <div className="stat-label">Bot username</div>
                <div className="stat-value" style={{ fontSize: '18px', color: 'var(--cyan)' }}>
                  {botInfo?.username || '—'}
                </div>
              </div>
              <div className="card stat-card">
                <div className="stat-label">Telegram ulangan foydalanuvchilar</div>
                <div className="stat-value">{botInfo?.registered_users ?? 0}</div>
              </div>
              <div className="card stat-card">
                <div className="stat-label">Faol guruhlar</div>
                <div className="stat-value">{botInfo?.active_groups ?? 0}</div>
              </div>
            </div>

            <div className="card mb-16">
              <div className="card-header">
                <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Bot sozlamalari</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-1)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-4)' }}>Token: </span>
                    <span className="font-mono" style={{ color: 'var(--text-2)' }}>
                      {botInfo?.token_masked || '***'}
                    </span>
                  </div>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-1)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-4)' }}>Webhook URL: </span>
                    <span style={{ color: 'var(--text-2)', fontSize: '11px' }}>
                      {botInfo?.webhook_url || 'Sozlanmagan'}
                    </span>
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
                  <label className="input-label">Xabar matni (HTML qo'llab-quvvatlanadi)</label>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="Barcha telegram ulangan foydalanuvchilarga xabar..."
                    value={botMessage}
                    onChange={e => setBotMessage(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={sendBroadcast}
                  disabled={sendingBroadcast}
                >
                  {sendingBroadcast
                    ? <><RefreshCw size={14} className="animate-spin" /> Yuborilmoqda...</>
                    : <><Send size={14} /> Yuborish</>}
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* ── ML Models tab ── */}
      {tab === 'ml' && (
        loadingML ? <Spinner /> : (
          <div className="grid-2">
            {mlModels.map(m => (
              <div key={m.name} className="card">
                <div className="card-header flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain size={16} style={{ color: 'var(--purple)' }} />
                    <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>{m.name}</span>
                  </div>
                  <span className={`badge ${m.status === 'loaded' ? 'badge-green' : 'badge-red'}`}>
                    {m.status === 'loaded' ? 'Yuklangan' : m.status}
                  </span>
                </div>
                <div className="card-body">
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'monospace', marginBottom: '12px', wordBreak: 'break-all' }}>
                    {m.task_name}
                  </div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => retrainModel(m.name)}
                    disabled={retrainingModel === m.name}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {retrainingModel === m.name
                      ? <><RefreshCw size={12} className="animate-spin" /> Navbatga qo'shilmoqda...</>
                      : <><Brain size={12} /> Qayta o'qitish</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── API & Connections tab ── */}
      {tab === 'api' && (
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Ulanish testlari</span>
          </div>
          <div className="card-body">
            <div className="grid-3">
              {INTEGRATION_TESTS.map(t => {
                const result = testResults[t.service];
                return (
                  <div
                    key={t.service}
                    style={{
                      padding: '16px', background: 'var(--bg-1)', borderRadius: '10px',
                      border: `1px solid ${result ? statusColor(result.status) + '40' : 'var(--border-1)'}`,
                      display: 'flex', flexDirection: 'column', gap: '12px',
                    }}
                  >
                    <div className="flex-between">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{t.icon}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-0)', fontSize: '13px' }}>{t.name}</span>
                      </div>
                      {testingService === t.service
                        ? <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--primary)' }} />
                        : result
                          ? <span style={{ fontSize: '11px', fontWeight: 600, color: statusColor(result.status) }}>
                              {result.status === 'ok' ? `${result.latency_ms}ms` : result.status}
                            </span>
                          : <Globe size={14} style={{ color: 'var(--text-4)' }} />}
                    </div>
                    {result?.detail && (
                      <div style={{ fontSize: '11px', color: 'var(--red)', wordBreak: 'break-all' }}>
                        {result.detail}
                      </div>
                    )}
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => testConnection(t.service)}
                      disabled={testingService === t.service}
                    >
                      {testingService === t.service ? 'Tekshirilmoqda...' : <><Zap size={11} /> Test</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Schedule Modal ── */}
      {editTask && (
        <div className="modal-overlay" onClick={closeEditTask}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: 'var(--primary)' }} /> Jadval tahrirlash
              </h3>
              <button className="btn-icon" onClick={closeEditTask}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '10px 14px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '4px' }}>Task</div>
                <code style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>{editTask.name}</code>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>{editTask.description}</div>
              </div>

              <div className="input-group">
                <label className="input-label">Cron ifodasi <span style={{ color: 'var(--red)' }}>*</span></label>
                <input
                  className="input"
                  value={editSchedule}
                  onChange={e => setEditSchedule(e.target.value)}
                  placeholder="* * * * *"
                  style={{
                    fontFamily: 'monospace', letterSpacing: '1px', fontSize: '14px',
                    border: `1px solid ${editSchedule && !isCronValid(editSchedule) ? 'var(--red)' : 'var(--border-1)'}`,
                  }}
                />
                <div style={{ marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>
                    {CRON_PART_LABELS.map((l, i) => (
                      <span key={l} style={{ marginRight: '12px' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{editSchedule.split(/\s+/)[i] ?? '*'}</span>
                        {' '}{l}
                      </span>
                    ))}
                  </span>
                </div>
                {editSchedule && !isCronValid(editSchedule) && (
                  <span style={{ fontSize: '11px', color: 'var(--red)', marginTop: '4px', display: 'block' }}>
                    Noto'g'ri cron format (5 ta qism kerak)
                  </span>
                )}
              </div>

              {isCronValid(editSchedule) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(14,165,233,0.06)', borderRadius: '8px', border: '1px solid rgba(14,165,233,0.15)' }}>
                  <Clock size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500 }}>
                    {describeCron(editSchedule)}
                  </span>
                </div>
              )}

              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Tezkor tanlash</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {CRON_PRESETS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setEditSchedule(p.value)}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${editSchedule === p.value ? 'var(--primary)' : 'var(--border-1)'}`,
                        background: editSchedule === p.value ? 'var(--primary-soft)' : 'var(--bg-0)',
                        color: editSchedule === p.value ? 'var(--primary)' : 'var(--text-2)',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeEditTask}>Bekor qilish</button>
              <button
                className="btn btn-primary"
                disabled={!isCronValid(editSchedule) || editSchedule === editTask.schedule}
                onClick={saveTaskSchedule}
              >
                <CheckCircle size={14} /> Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
