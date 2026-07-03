import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Terminal, RefreshCw, Server, Download, Trash2,
  Pause, Play, ChevronDown, Search, X, Circle,
  Archive, Calendar, Eye, FileDown, Zap, AlertTriangle, Info, Bug,
  Database, Activity, Globe, BarChart3, Settings, FileText
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import {
  containerLogsApi,
  type ContainerInfo,
  type ContainerLogs as LogsType,
  type LogArchiveItem,
  type ArchiveDateSummary,
  type ArchiveViewData,
} from '../api/admin';

const CONTAINER_COLORS: Record<string, string> = {
  api: '#0ea5e9',
  bot: '#8b5cf6',
  celery_worker: '#f59e0b',
  celery_beat: '#ef4444',
  postgres: '#3b82f6',
  redis: '#10b981',
  pgadmin: '#ec4899',
  flower: '#6366f1',
};

const CONTAINER_LABELS: Record<string, string> = {
  api: 'API Server',
  bot: 'Telegram Bot',
  celery_worker: 'Celery Worker',
  celery_beat: 'Celery Beat',
  postgres: 'PostgreSQL',
  redis: 'Redis',
  pgadmin: 'pgAdmin',
  flower: 'Flower',
};

const LEVEL_ICONS: Record<string, { icon: typeof AlertTriangle; color: string }> = {
  ERROR: { icon: AlertTriangle, color: '#f85149' },
  WARNING: { icon: Zap, color: '#f0883e' },
  INFO: { icon: Info, color: '#58a6ff' },
  DEBUG: { icon: Bug, color: '#8b949e' },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ContainerLogsPage() {
  const { addToast, setActiveTab } = useAdmin();

  // Main tab
  const [mainTab, setMainTab] = useState<'live' | 'archive'>('live');

  // ── Live tab state ──
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<string>('api');
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [containersLoading, setContainersLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [search, setSearch] = useState('');
  const [tailCount, setTailCount] = useState(200);

  const logRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Archive tab state ──
  const [archives, setArchives] = useState<LogArchiveItem[]>([]);
  const [dateSummaries, setDateSummaries] = useState<ArchiveDateSummary[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveFilterContainer, setArchiveFilterContainer] = useState('');
  const [archiveFilterDate, setArchiveFilterDate] = useState('');

  // Archive viewer
  const [viewerData, setViewerData] = useState<ArchiveViewData | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerSearch, setViewerSearch] = useState('');
  const [viewerLevel, setViewerLevel] = useState('');
  const [viewerPage, setViewerPage] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);

  // ── Live functions ──
  const loadContainers = useCallback(async () => {
    setContainersLoading(true);
    try {
      const data = await containerLogsApi.containers();
      setContainers(data);
    } catch {
      addToast('Xatolik', 'Konteynerlar ro\'yxatini olishda xato', 'error');
    } finally {
      setContainersLoading(false);
    }
  }, [addToast]);

  const loadLogs = useCallback(async (container: string) => {
    setLoading(true);
    stopStream();
    try {
      const data = await containerLogsApi.logs(container, tailCount);
      setLogs(data.lines);
    } catch {
      addToast('Xatolik', `${container} loglari yuklanmadi`, 'error');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [addToast, tailCount]);

  const startStream = useCallback(() => {
    stopStream();
    const url = containerLogsApi.streamUrl(selectedContainer, 50);
    const es = new EventSource(url);
    es.onmessage = (e) => {
      const line = e.data;
      if (line === '[heartbeat]') return;
      if (line === '[stream ended]') { setStreaming(false); return; }
      setLogs(prev => [...prev.slice(-2000), line]);
    };
    es.onerror = () => { setStreaming(false); es.close(); };
    eventSourceRef.current = es;
    setStreaming(true);
  }, [selectedContainer]);

  const stopStream = () => {
    if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
    setStreaming(false);
  };

  // ── Archive functions ──
  const loadArchives = useCallback(async () => {
    setArchiveLoading(true);
    try {
      const params: Record<string, string> = {};
      if (archiveFilterContainer) params.container = archiveFilterContainer;
      if (archiveFilterDate) { params.date_from = archiveFilterDate; params.date_to = archiveFilterDate; }
      const data = await containerLogsApi.archives(params);
      setArchives(data.archives);
      setDateSummaries(data.dates);
    } catch {
      addToast('Xatolik', 'Arxivlar yuklanmadi', 'error');
    } finally {
      setArchiveLoading(false);
    }
  }, [addToast, archiveFilterContainer, archiveFilterDate]);

  const viewArchive = async (id: number) => {
    setViewerLoading(true);
    setViewerData(null);
    setViewerPage(0);
    try {
      const data = await containerLogsApi.viewArchive(id, {
        offset: 0, limit: 500,
        search: viewerSearch || undefined,
        level: viewerLevel || undefined,
      });
      setViewerData(data);
    } catch {
      addToast('Xatolik', 'Log ko\'rib bo\'lmadi', 'error');
    } finally {
      setViewerLoading(false);
    }
  };

  const loadViewerPage = async (archiveId: number, page: number) => {
    setViewerLoading(true);
    try {
      const data = await containerLogsApi.viewArchive(archiveId, {
        offset: page * 500, limit: 500,
        search: viewerSearch || undefined,
        level: viewerLevel || undefined,
      });
      setViewerData(data);
      setViewerPage(page);
      viewerRef.current?.scrollTo(0, 0);
    } catch {
      addToast('Xatolik', 'Sahifa yuklanmadi', 'error');
    } finally {
      setViewerLoading(false);
    }
  };

  const triggerManualArchive = async () => {
    try {
      await containerLogsApi.triggerArchive();
      addToast('Boshlandi', 'Kechagi loglar arxivlanmoqda...', 'success');
    } catch {
      addToast('Xatolik', 'Arxivlash boshlanmadi', 'error');
    }
  };

  useEffect(() => { loadContainers(); return () => stopStream(); }, []);
  useEffect(() => { if (mainTab === 'live') loadLogs(selectedContainer); }, [selectedContainer]);
  useEffect(() => { if (mainTab === 'archive') loadArchives(); }, [mainTab, archiveFilterContainer, archiveFilterDate]);
  useEffect(() => {
    if (autoScroll && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs, autoScroll]);

  const filteredLogs = search ? logs.filter(l => l.toLowerCase().includes(search.toLowerCase())) : logs;

  const downloadLiveLogs = () => {
    const text = filteredLogs.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedContainer}-logs-${new Date().toISOString().slice(0, 19)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('up') || s.includes('running')) return 'var(--green)';
    if (s.includes('exit') || s.includes('dead')) return 'var(--red)';
    return 'var(--yellow)';
  };

  const color = CONTAINER_COLORS[selectedContainer] || '#888';

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex-between mb-16">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={24} style={{ color: 'var(--primary)' }} />
            Konteyner Loglari
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
            Real-time loglar va kunlik arxivlar
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Infrastructure', tab: 'infrastructure', icon: Database, color: 'var(--primary)' },
          { label: 'Platform Health', tab: 'health', icon: Activity, color: 'var(--teal)' },
          { label: 'API Endpoints', tab: 'api_endpoints', icon: Globe, color: 'var(--green)' },
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

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--bg-0)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { id: 'live' as const, label: 'Jonli loglar', icon: Terminal },
          { id: 'archive' as const, label: 'Arxivlar', icon: Archive },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setMainTab(t.id); if (t.id === 'live') stopStream(); }}
            style={{
              padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer',
              background: mainTab === t.id ? 'white' : 'transparent',
              color: mainTab === t.id ? 'var(--primary)' : 'var(--text-3)',
              boxShadow: mainTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── LIVE TAB ── */}
      {mainTab === 'live' && (
        <>
          {/* Container Selector */}
          <div className="card mb-12" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {(containers.length > 0 ? containers : Object.keys(CONTAINER_LABELS).map(name => ({
                name, status: 'unknown', image: '', ports: '', created: '', health: '',
              }))).map(c => {
                const name = c.name;
                const isActive = selectedContainer === name;
                const cColor = CONTAINER_COLORS[name] || '#888';
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedContainer(name)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 600,
                      background: isActive ? `${cColor}15` : 'transparent',
                      color: isActive ? cColor : 'var(--text-3)',
                      outline: isActive ? `2px solid ${cColor}` : '1px solid var(--border)',
                    }}
                  >
                    <Circle size={8} fill={c.status !== 'unknown' ? getStatusColor(c.status) : 'var(--text-4)'} stroke="none" />
                    <Server size={12} />
                    {CONTAINER_LABELS[name] || name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Log Controls */}
          <div className="card mb-8" style={{ padding: '8px 16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
                <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input className="input" style={{ paddingLeft: '28px', fontSize: '12px', height: '32px' }} placeholder="Loglardan qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)' }}><X size={12} /></button>}
              </div>
              <select className="input select" style={{ width: '120px', fontSize: '12px', height: '32px' }} value={tailCount} onChange={e => setTailCount(Number(e.target.value))}>
                <option value={100}>100 qator</option>
                <option value={200}>200 qator</option>
                <option value={500}>500 qator</option>
                <option value={1000}>1000 qator</option>
              </select>
              <button className="btn btn-ghost btn-sm" style={{ height: '32px' }} onClick={() => loadLogs(selectedContainer)}>
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Yangilash
              </button>
              <div style={{ borderLeft: '1px solid var(--border)', height: '20px' }} />
              <button className={`btn btn-sm ${streaming ? 'btn-primary' : 'btn-ghost'}`} style={{ height: '32px' }} onClick={() => streaming ? stopStream() : startStream()}>
                {streaming ? <Pause size={12} /> : <Play size={12} />}
                {streaming ? 'To\'xtatish' : 'Real-time'}
              </button>
              <button className={`btn btn-sm ${autoScroll ? 'btn-primary' : 'btn-ghost'}`} style={{ height: '32px' }} onClick={() => setAutoScroll(!autoScroll)}>
                <ChevronDown size={12} /> Auto-scroll
              </button>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{filteredLogs.length} qator{search && ` (${logs.length} dan)`}</span>
              <button className="btn btn-ghost btn-sm" style={{ height: '32px' }} onClick={downloadLiveLogs}><Download size={12} /></button>
              <button className="btn btn-ghost btn-sm" style={{ height: '32px', color: 'var(--red)' }} onClick={() => setLogs([])}><Trash2 size={12} /></button>
            </div>
          </div>

          {/* Log Output */}
          <div ref={logRef} style={{
            flex: 1, overflow: 'auto', padding: '12px 16px', borderRadius: '10px',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '12px', lineHeight: '1.6',
            background: '#0d1117', color: '#c9d1d9',
          }}>
            <div style={{
              position: 'sticky', top: 0, padding: '4px 8px', marginBottom: '8px',
              background: `${color}20`, borderRadius: '6px', display: 'inline-flex',
              alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color,
            }}>
              <Circle size={6} fill={streaming ? '#22c55e' : color} stroke="none" />
              {CONTAINER_LABELS[selectedContainer] || selectedContainer}
              {streaming && <span style={{ color: '#22c55e', fontWeight: 400 }}>● LIVE</span>}
            </div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#8b949e' }}>
                <RefreshCw size={18} className="animate-spin" style={{ marginRight: '8px' }} /> Loglar yuklanmoqda...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>{search ? `"${search}" uchun natija topilmadi` : 'Log yozuvlari yo\'q'}</div>
            ) : (
              filteredLogs.map((line, i) => (
                <div key={i} style={{ padding: '1px 0', borderBottom: '1px solid #21262d', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  <span style={{ color: '#484f58', marginRight: '8px', userSelect: 'none', fontSize: '10px' }}>{String(i + 1).padStart(4, ' ')}</span>
                  {colorize(line, search)}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── ARCHIVE TAB ── */}
      {mainTab === 'archive' && !viewerData && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Archive controls */}
          <div className="card mb-16" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select className="input select" style={{ width: '160px', fontSize: '12px' }} value={archiveFilterContainer} onChange={e => setArchiveFilterContainer(e.target.value)}>
                <option value="">Barcha konteynerlar</option>
                {Object.entries(CONTAINER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="date" className="input" style={{ width: '160px', fontSize: '12px' }} value={archiveFilterDate} onChange={e => setArchiveFilterDate(e.target.value)} />
              {archiveFilterDate && <button className="btn btn-ghost btn-sm" onClick={() => setArchiveFilterDate('')}><X size={12} /> Tozalash</button>}
              <div style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-sm" onClick={loadArchives}>
                <RefreshCw size={12} className={archiveLoading ? 'animate-spin' : ''} /> Yangilash
              </button>
              <button className="btn btn-primary btn-sm" onClick={triggerManualArchive}>
                <Archive size={12} /> Arxivlash
              </button>
            </div>
          </div>

          {/* Date summaries */}
          {dateSummaries.length > 0 && (
            <div className="grid-4 mb-16">
              {dateSummaries.slice(0, 4).map(d => (
                <div key={d.log_date} className="card" style={{ padding: '16px', cursor: 'pointer', border: archiveFilterDate === d.log_date ? '2px solid var(--primary)' : '1px solid var(--border)' }}
                  onClick={() => setArchiveFilterDate(archiveFilterDate === d.log_date ? '' : d.log_date)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Calendar size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-0)' }}>{d.log_date}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-3)' }}>
                    <span>{d.containers} konteyner</span>
                    <span>{d.total_lines.toLocaleString()} qator</span>
                    <span>{formatSize(d.total_size)}</span>
                    {d.error_count > 0 && <span style={{ color: '#f85149', fontWeight: 600 }}>{d.error_count} xato</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Archive list */}
          {archiveLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text-4)' }} />
            </div>
          ) : archives.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
              <Archive size={40} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Arxivlar topilmadi</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>"Arxivlash" tugmasini bosib kechagi loglarni saqlang</p>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 16px' }}>Sana</th>
                      <th style={{ padding: '12px 16px' }}>Konteyner</th>
                      <th style={{ padding: '12px 16px' }}>Qatorlar</th>
                      <th style={{ padding: '12px 16px' }}>Hajm</th>
                      <th style={{ padding: '12px 16px' }}>Darajalar</th>
                      <th style={{ padding: '12px 16px' }}>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archives.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-0)' }}>{a.log_date}</span>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: 600,
                            color: CONTAINER_COLORS[a.container] || 'var(--text-2)',
                          }}>
                            <Circle size={6} fill={CONTAINER_COLORS[a.container] || '#888'} stroke="none" />
                            {CONTAINER_LABELS[a.container] || a.container}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-2)' }}>
                          {a.line_count.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-3)' }}>
                          {formatSize(a.file_size)}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {a.level_stats ? (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {Object.entries(a.level_stats).filter(([, v]) => v > 0).map(([level, count]) => {
                                const cfg = LEVEL_ICONS[level];
                                return (
                                  <span key={level} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                                    fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px',
                                    color: cfg?.color || 'var(--text-3)',
                                    background: `${cfg?.color || '#888'}15`,
                                  }}>
                                    {cfg && <cfg.icon size={9} />}
                                    {count}
                                  </span>
                                );
                              })}
                            </div>
                          ) : <span style={{ color: 'var(--text-4)', fontSize: '11px' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => viewArchive(a.id)} title="Ko'rish">
                              <Eye size={13} />
                            </button>
                            <a href={containerLogsApi.downloadArchive(a.id)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', textDecoration: 'none' }} title="Yuklab olish">
                              <FileDown size={13} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ARCHIVE VIEWER ── */}
      {mainTab === 'archive' && viewerData && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Viewer header */}
          <div className="card mb-8" style={{ padding: '10px 16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewerData(null)}>
                ← Arxivlarga qaytish
              </button>
              <div style={{ borderLeft: '1px solid var(--border)', height: '20px' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: CONTAINER_COLORS[viewerData.container] || 'var(--text-0)' }}>
                {CONTAINER_LABELS[viewerData.container] || viewerData.container}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{viewerData.log_date}</span>
              <div style={{ borderLeft: '1px solid var(--border)', height: '20px' }} />

              <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '250px' }}>
                <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input className="input" style={{ paddingLeft: '28px', fontSize: '12px', height: '30px' }} placeholder="Qidirish..." value={viewerSearch}
                  onChange={e => setViewerSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { /* re-fetch with filter */ const id = archives.find(a => a.container === viewerData.container && a.log_date === viewerData.log_date)?.id; if (id) viewArchive(id); } }}
                />
              </div>
              <select className="input select" style={{ width: '120px', fontSize: '12px', height: '30px' }} value={viewerLevel}
                onChange={e => { setViewerLevel(e.target.value); const id = archives.find(a => a.container === viewerData.container && a.log_date === viewerData.log_date)?.id; if (id) { setTimeout(() => viewArchive(id), 0); } }}>
                <option value="">Barcha darajalar</option>
                <option value="ERROR">ERROR</option>
                <option value="WARNING">WARNING</option>
                <option value="INFO">INFO</option>
                <option value="DEBUG">DEBUG</option>
              </select>
              <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{viewerData.total_lines.toLocaleString()} qator</span>
            </div>
          </div>

          {/* Viewer log output */}
          <div ref={viewerRef} style={{
            flex: 1, overflow: 'auto', padding: '12px 16px', borderRadius: '10px',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '12px', lineHeight: '1.6',
            background: '#0d1117', color: '#c9d1d9',
          }}>
            {viewerLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#8b949e' }}>
                <RefreshCw size={18} className="animate-spin" style={{ marginRight: '8px' }} /> Yuklanmoqda...
              </div>
            ) : viewerData.lines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>Loglar topilmadi</div>
            ) : (
              viewerData.lines.map((line, i) => (
                <div key={i} style={{ padding: '1px 0', borderBottom: '1px solid #21262d', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  <span style={{ color: '#484f58', marginRight: '8px', userSelect: 'none', fontSize: '10px' }}>
                    {String(viewerData.offset + i + 1).padStart(5, ' ')}
                  </span>
                  {colorize(line, viewerSearch)}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {viewerData.total_lines > 500 && (
            <div className="card mt-8" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <button className="btn btn-ghost btn-sm" disabled={viewerPage === 0}
                onClick={() => { const id = archives.find(a => a.container === viewerData.container && a.log_date === viewerData.log_date)?.id; if (id) loadViewerPage(id, viewerPage - 1); }}>
                ← Oldingi
              </button>
              <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                {viewerPage + 1} / {Math.ceil(viewerData.total_lines / 500)} sahifa
              </span>
              <button className="btn btn-ghost btn-sm" disabled={(viewerPage + 1) * 500 >= viewerData.total_lines}
                onClick={() => { const id = archives.find(a => a.container === viewerData.container && a.log_date === viewerData.log_date)?.id; if (id) loadViewerPage(id, viewerPage + 1); }}>
                Keyingi →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function colorize(line: string, search: string) {
  let color = '#c9d1d9';
  if (/\b(ERROR|CRITICAL|FATAL)\b/i.test(line)) color = '#f85149';
  else if (/\bWARNING\b/i.test(line)) color = '#f0883e';
  else if (/\bINFO\b/i.test(line)) color = '#58a6ff';
  else if (/\bDEBUG\b/i.test(line)) color = '#8b949e';

  if (!search) return <span style={{ color }}>{line}</span>;

  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = line.split(regex);

  return (
    <span style={{ color }}>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} style={{ background: '#f0883e44', color: '#f0883e', borderRadius: '2px', padding: '0 2px' }}>{part}</mark>
          : part
      )}
    </span>
  );
}
