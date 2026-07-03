import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Database, RefreshCw, BarChart2, Table, Download, Search,
  Terminal, Play, X, FileDown, AlertTriangle, Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';
import { infrastructureApi, type DBOverview, type DBTablePreview, type SQLResult } from '../api/admin';

export default function InfrastructurePage() {
  const { addToast } = useAdmin();
  const [overview, setOverview] = useState<DBOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [preview, setPreview] = useState<DBTablePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [tab, setTab] = useState<'browser' | 'stats' | 'sql'>('browser');
  const [rowLimit, setRowLimit] = useState(20);

  // Filters
  const [tableSearch, setTableSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'has_data' | 'empty'>('all');
  const [sortBy, setSortBy] = useState<'size' | 'rows' | 'name'>('size');

  // SQL console
  const [sql, setSql] = useState('SELECT * FROM users LIMIT 10');
  const [sqlResult, setSqlResult] = useState<SQLResult | null>(null);
  const [sqlError, setSqlError] = useState('');
  const [sqlRunning, setSqlRunning] = useState(false);
  const [sqlHistory, setSqlHistory] = useState<string[]>([]);
  const sqlInputRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOverview(await infrastructureApi.dbStats());
    } catch {
      addToast('Xatolik', "DB statistikasi yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const loadPreview = async (tableName: string, limit?: number) => {
    setSelectedTable(tableName);
    setPreview(null);
    setPreviewLoading(true);
    try {
      setPreview(await infrastructureApi.tablePreview(tableName, limit ?? rowLimit));
    } catch {
      addToast('Xatolik', `${tableName} yuklanmadi`, 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const runSql = async () => {
    const q = sql.trim();
    if (!q) return;
    setSqlRunning(true);
    setSqlError('');
    setSqlResult(null);
    try {
      const result = await infrastructureApi.runQuery(q);
      setSqlResult(result);
      setSqlHistory(prev => [q, ...prev.filter(h => h !== q)].slice(0, 20));
    } catch (err: any) {
      setSqlError(err?.response?.data?.detail || err?.message || 'Xatolik');
    } finally {
      setSqlRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-4)' }} />
      </div>
    );
  }

  const allTables = overview?.tables ?? [];

  const filteredTables = allTables
    .filter(t => {
      if (tableSearch && !t.name.toLowerCase().includes(tableSearch.toLowerCase())) return false;
      if (filterMode === 'has_data' && t.row_count === 0) return false;
      if (filterMode === 'empty' && t.row_count > 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'size') return b.size_bytes - a.size_bytes;
      if (sortBy === 'rows') return b.row_count - a.row_count;
      return a.name.localeCompare(b.name);
    });

  const sizeChartData = filteredTables.map(t => ({ name: t.name, size: t.size_bytes, rows: t.row_count }));
  const rowChartData = filteredTables.filter(t => t.row_count > 0).map(t => ({ name: t.name, rows: t.row_count }));

  const totalRows = allTables.reduce((s, t) => s + t.row_count, 0);
  const tablesWithData = allTables.filter(t => t.row_count > 0).length;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex-between mb-16">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Infratuzilma</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
            {overview ? `${overview.db_name} · ${overview.total_size_pretty} · ${overview.table_count} jadval` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={infrastructureApi.exportAllUrl()} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
            <FileDown size={13} /> Butun bazani yuklab olish
          </a>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /> Yangilash</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-16">
        {[
          { label: 'Jadvallar soni', value: overview?.table_count ?? 0, color: 'var(--primary)' },
          { label: 'Umumiy hajm', value: overview?.total_size_pretty ?? '—', color: 'var(--teal)' },
          { label: "Ma'lumotli jadvallar", value: tablesWithData, color: 'var(--yellow)' },
          { label: 'Jami satrlar', value: totalRows.toLocaleString(), color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-label mb-8">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: String(s.value).length > 8 ? '16px' : undefined }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', background: 'var(--bg-0)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { id: 'browser' as const, label: 'Jadvallar', icon: Table },
          { id: 'stats' as const, label: 'Grafiklar', icon: BarChart2 },
          { id: 'sql' as const, label: 'SQL Terminal', icon: Terminal },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer',
            background: tab === t.id ? 'white' : 'transparent',
            color: tab === t.id ? 'var(--primary)' : 'var(--text-3)',
            boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── BROWSER TAB ── */}
      {tab === 'browser' && (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '12px', flex: 1, overflow: 'hidden' }}>
          {/* Left — table list */}
          <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Table search & filters */}
            <div style={{ padding: '10px 10px 6px', flexShrink: 0 }}>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input className="input" style={{ paddingLeft: '28px', fontSize: '11px', height: '30px' }} placeholder="Jadval nomi..." value={tableSearch} onChange={e => setTableSearch(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all' as const, label: 'Hammasi' },
                  { id: 'has_data' as const, label: "Ma'lumotli" },
                  { id: 'empty' as const, label: "Bo'sh" },
                ].map(f => (
                  <button key={f.id} onClick={() => setFilterMode(f.id)} style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    background: filterMode === f.id ? 'var(--primary-soft)' : 'var(--bg-0)',
                    color: filterMode === f.id ? 'var(--primary)' : 'var(--text-4)',
                  }}>{f.label}</button>
                ))}
                <select style={{ fontSize: '10px', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-0)', color: 'var(--text-3)', marginLeft: 'auto' }}
                  value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                  <option value="size">Hajm ↓</option>
                  <option value="rows">Satr ↓</option>
                  <option value="name">Nom A-Z</option>
                </select>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: '6px' }}>{filteredTables.length} / {allTables.length} jadval</div>
            </div>

            <div style={{ padding: '0 6px 8px', overflowY: 'auto', flex: 1 }}>
              {filteredTables.map(t => (
                <button key={t.name} onClick={() => loadPreview(t.name)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 8px', borderRadius: '6px', border: 'none', width: '100%', textAlign: 'left',
                    cursor: 'pointer', background: selectedTable === t.name ? 'var(--bg-active)' : 'transparent',
                    borderLeft: selectedTable === t.name ? '3px solid var(--primary)' : '3px solid transparent',
                  }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px', color: 'var(--text-0)' }}>{t.name}</span>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '10px', color: t.row_count > 0 ? 'var(--primary)' : 'var(--text-4)' }}>{t.row_count.toLocaleString()}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-4)' }}>{t.size_pretty}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right — table preview */}
          <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {!selectedTable && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-4)' }}>
                <div style={{ textAlign: 'center' }}>
                  <Database size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p style={{ fontSize: '13px' }}>Jadval tanlang</p>
                </div>
              </div>
            )}
            {selectedTable && previewLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text-4)' }} />
              </div>
            )}
            {selectedTable && preview && !previewLoading && (
              <>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-0)' }}>{selectedTable}</span>
                  {preview.error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{preview.error}</span>}
                  <div style={{ flex: 1 }} />
                  <select className="input select" style={{ width: '90px', fontSize: '11px', height: '28px' }}
                    value={rowLimit} onChange={e => { const v = Number(e.target.value); setRowLimit(v); if (selectedTable) loadPreview(selectedTable, v); }}>
                    <option value={10}>10 qator</option>
                    <option value={20}>20 qator</option>
                    <option value={50}>50 qator</option>
                  </select>
                  <a href={infrastructureApi.exportTableUrl(selectedTable)} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', height: '28px', fontSize: '11px' }}>
                    <Download size={12} /> CSV
                  </a>
                  <button className="btn btn-ghost btn-sm" style={{ height: '28px', fontSize: '11px' }}
                    onClick={() => { setSql(`SELECT * FROM ${selectedTable} LIMIT 50`); setTab('sql'); }}>
                    <Terminal size={12} /> Query
                  </button>
                </div>
                {preview.columns.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-4)', fontSize: '13px' }}>Bo'sh jadval yoki ko'rib bo'lmaydi</div>
                ) : (
                  <div style={{ overflow: 'auto', flex: 1 }}>
                    <table className="table" style={{ minWidth: Math.max(600, preview.columns.length * 120) }}>
                      <thead>
                        <tr>
                          {preview.columns.map(col => (
                            <th key={col} style={{ padding: '8px 12px', fontSize: '11px', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-1)', zIndex: 1 }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                            {row.map((cell, j) => (
                              <td key={j} style={{ padding: '6px 12px', fontSize: '12px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-1)' }}
                                title={cell || 'NULL'}>
                                {cell || <span style={{ color: 'var(--text-4)' }}>NULL</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── STATS TAB ── */}
      {tab === 'stats' && (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div className="card mb-16">
            <div className="card-header"><h3 style={{ fontWeight: 700, fontSize: '14px' }}>Jadvallar hajmi (KB)</h3></div>
            <div className="card-body">
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: Math.max(600, sizeChartData.length * 50) }}>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={sizeChartData} margin={{ top: 8, right: 16, left: 16, bottom: 80 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} height={80} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1024).toFixed(0)}`} />
                      <Tooltip formatter={(v: number) => [`${(v / 1024).toFixed(1)} KB`, 'Hajm']} />
                      <Bar dataKey="size" fill="var(--teal)" radius={[4, 4, 0, 0]} cursor="pointer" onClick={(d: any) => { if (d?.name) { loadPreview(d.name); setTab('browser'); } }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 style={{ fontWeight: 700, fontSize: '14px' }}>Satrlar soni</h3></div>
            <div className="card-body">
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: Math.max(600, rowChartData.length * 50) }}>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={rowChartData} margin={{ top: 8, right: 16, left: 16, bottom: 80 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} height={80} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Satrlar']} />
                      <Bar dataKey="rows" fill="var(--primary)" radius={[4, 4, 0, 0]} cursor="pointer" onClick={(d: any) => { if (d?.name) { loadPreview(d.name); setTab('browser'); } }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SQL TERMINAL TAB ── */}
      {tab === 'sql' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '8px' }}>
          {/* SQL input */}
          <div className="card" style={{ flexShrink: 0 }}>
            <div style={{ padding: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <textarea
                    ref={sqlInputRef}
                    value={sql}
                    onChange={e => setSql(e.target.value)}
                    onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runSql(); } }}
                    placeholder="SELECT * FROM users LIMIT 10"
                    style={{
                      width: '100%', minHeight: '70px', maxHeight: '150px', resize: 'vertical',
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '13px',
                      padding: '10px 12px', borderRadius: '8px',
                      background: '#0d1117', color: '#c9d1d9', border: '1px solid var(--border)',
                      outline: 'none',
                    }}
                  />
                  <div style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '10px', color: '#484f58' }}>
                    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button className="btn btn-primary btn-sm" onClick={runSql} disabled={sqlRunning || !sql.trim()}
                    style={{ height: '34px', width: '90px' }}>
                    {sqlRunning ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                    {sqlRunning ? '' : 'Ishga'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSql(''); setSqlResult(null); setSqlError(''); }}
                    style={{ height: '28px', width: '90px', fontSize: '11px' }}>
                    <X size={12} /> Tozalash
                  </button>
                </div>
              </div>

              {/* Quick inserts + history */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-4)', fontWeight: 600 }}>Tez:</span>
                {['users', 'tenders', 'subscriptions', 'payments', 'audit_logs'].map(t => (
                  <button key={t} className="btn btn-ghost" onClick={() => setSql(`SELECT * FROM ${t} ORDER BY id DESC LIMIT 20`)}
                    style={{ padding: '2px 8px', fontSize: '10px', height: '22px', borderRadius: '4px' }}>
                    {t}
                  </button>
                ))}
                {sqlHistory.length > 0 && (
                  <>
                    <div style={{ borderLeft: '1px solid var(--border)', height: '14px', margin: '0 4px' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-4)', fontWeight: 600 }}>Tarix:</span>
                    {sqlHistory.slice(0, 3).map((h, i) => (
                      <button key={i} className="btn btn-ghost" onClick={() => setSql(h)}
                        style={{ padding: '2px 8px', fontSize: '10px', height: '22px', borderRadius: '4px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={h}>
                        {h.slice(0, 40)}
                      </button>
                    ))}
                  </>
                )}
              </div>

              <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text-4)' }}>
                Faqat SELECT/WITH. Avtomatik LIMIT 500. Superadmin huquqi talab qilinadi.
              </div>
            </div>
          </div>

          {/* SQL error */}
          {sqlError && (
            <div className="card" style={{ padding: '12px 16px', background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertTriangle size={14} style={{ color: '#f85149', flexShrink: 0, marginTop: '2px' }} />
                <pre style={{ fontSize: '12px', color: '#f85149', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {sqlError}
                </pre>
              </div>
            </div>
          )}

          {/* SQL results */}
          {sqlResult && (
            <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-0)' }}>
                  Natija: {sqlResult.count} qator, {sqlResult.columns.length} ustun
                </span>
                <div style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-sm" style={{ height: '26px', fontSize: '11px' }} onClick={() => {
                  const lines = [sqlResult.columns.join(','), ...sqlResult.rows.map(r => r.join(','))];
                  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'query_result.csv'; a.click();
                  URL.revokeObjectURL(url);
                }}>
                  <Download size={11} /> CSV
                </button>
              </div>
              {sqlResult.columns.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-4)', fontSize: '13px' }}>Natija yo'q</div>
              ) : (
                <div style={{ overflow: 'auto', flex: 1 }}>
                  <table className="table" style={{ minWidth: Math.max(600, sqlResult.columns.length * 120) }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 10px', fontSize: '10px', color: 'var(--text-4)', position: 'sticky', top: 0, background: 'var(--bg-1)', zIndex: 1, width: '40px' }}>#</th>
                        {sqlResult.columns.map(col => (
                          <th key={col} style={{ padding: '6px 10px', fontSize: '11px', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-1)', zIndex: 1 }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sqlResult.rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '5px 10px', fontSize: '10px', color: 'var(--text-4)' }}>{i + 1}</td>
                          {row.map((cell, j) => (
                            <td key={j} style={{
                              padding: '5px 10px', fontSize: '12px', maxWidth: '250px',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              color: cell === 'NULL' ? 'var(--text-4)' : 'var(--text-1)',
                              fontStyle: cell === 'NULL' ? 'italic' : 'normal',
                            }} title={cell}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!sqlResult && !sqlError && (
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-4)' }}>
                <Terminal size={40} style={{ opacity: 0.15, marginBottom: '12px' }} />
                <p style={{ fontSize: '13px' }}>SQL so'rov yozing va Ctrl+Enter bosing</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
