import { useState } from 'react';
import { Database, HardDrive, Download, RefreshCw, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';

const tables = [
  { name: 'tenders', row_count: 12450, size: '45.2 MB' },
  { name: 'users', row_count: 1248, size: '8.1 MB' },
  { name: 'tender_matches', row_count: 34560, size: '22.8 MB' },
  { name: 'notifications', row_count: 8920, size: '12.4 MB' },
  { name: 'payments', row_count: 456, size: '3.2 MB' },
  { name: 'subscriptions', row_count: 312, size: '1.8 MB' },
  { name: 'companies', row_count: 890, size: '5.6 MB' },
  { name: 'saved_searches', row_count: 2340, size: '4.1 MB' },
  { name: 'tender_notes', row_count: 1560, size: '6.3 MB' },
  { name: 'audit_log', row_count: 45600, size: '32.1 MB' },
  { name: 'bot_groups', row_count: 23, size: '0.1 MB' },
  { name: 'system_settings', row_count: 15, size: '0.01 MB' },
];

const mockRows: Record<string, { columns: string[]; rows: string[][] }> = {
  users: {
    columns: ['id', 'full_name', 'email', 'plan', 'is_active', 'created_at'],
    rows: [
      ['1', 'Bobur Sobirjonov', 'bobur@mail.uz', 'business', 'true', '2026-01-15'],
      ['2', 'Jasur Karimov', 'jasur@mail.uz', 'pro', 'true', '2026-02-20'],
      ['3', 'Dilnoza Rahimova', 'dilnoza@mail.uz', 'free', 'true', '2026-03-10'],
    ],
  },
  tenders: {
    columns: ['id', 'title', 'source', 'status', 'amount', 'deadline'],
    rows: [
      ['1', 'IT uskunalarni yetkazib berish', 'uzex', 'active', '450000000', '2026-06-25'],
      ['2', 'Binoni ta\'mirlash ishlari', 'mc', 'active', '1200000000', '2026-06-30'],
      ['3', 'Dori vositalari sotib olish', 'mygov', 'closed', '320000000', '2026-06-10'],
    ],
  },
};

const backups = [
  { filename: 'tenderiq_2026-06-17_06-00.sql.gz', size: '2.4 GB', duration: '3m 12s', created_at: '2026-06-17 06:00', status: 'ok' },
  { filename: 'tenderiq_2026-06-16_06-00.sql.gz', size: '2.3 GB', duration: '3m 05s', created_at: '2026-06-16 06:00', status: 'ok' },
  { filename: 'tenderiq_2026-06-15_06-00.sql.gz', size: '2.3 GB', duration: '3m 08s', created_at: '2026-06-15 06:00', status: 'ok' },
  { filename: 'tenderiq_2026-06-14_06-00.sql.gz', size: '2.2 GB', duration: '2m 55s', created_at: '2026-06-14 06:00', status: 'ok' },
];

const chartData = tables.slice(0, 8).map(t => ({ name: t.name, rows: t.row_count }));

export default function InfrastructurePage() {
  const { addToast } = useAdmin();
  const [tab, setTab] = useState<'browser' | 'backups' | 'stats'>('browser');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);

  const runBackup = () => {
    setBackingUp(true);
    setBackupProgress(0);
    addToast('Backup', 'Ma\'lumotlar bazasi zaxiralanmoqda...', 'info');

    const interval = setInterval(() => {
      setBackupProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 10;
      });
    }, 300);

    setTimeout(() => {
      setBackingUp(false);
      setBackupProgress(0);
      addToast('Tayyor', 'Backup muvaffaqiyatli yaratildi (2.4 GB, 3m 15s)', 'success');
    }, 3200);
  };

  const exportTableData = (tableName: string) => {
    addToast('Export', `${tableName} jadvali CSV formatda yuklab olinmoqda...`, 'info');
    setTimeout(() => addToast('Tayyor', `${tableName}.csv tayyor`, 'success'), 1200);
  };

  const tableData = selectedTable ? mockRows[selectedTable] : null;

  return (
    <div className="page-container">
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)', marginBottom: '24px' }}>Infrastructure & DB</h1>

      <div className="tabs mb-24">
        <button className={`tab ${tab === 'browser' ? 'active' : ''}`} onClick={() => setTab('browser')}>DB Browser</button>
        <button className={`tab ${tab === 'backups' ? 'active' : ''}`} onClick={() => setTab('backups')}>Zaxiralar</button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>Statistika</button>
      </div>

      {tab === 'browser' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
          {/* Table sidebar */}
          <div className="card" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
            <div className="card-header">
              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-0)' }}>
                Jadvallar ({tables.length})
              </span>
            </div>
            <div style={{ padding: '6px' }}>
              {tables.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTable(t.name)}
                  onMouseEnter={() => setHoveredTable(t.name)}
                  onMouseLeave={() => setHoveredTable(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '8px 10px', borderRadius: '6px',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: selectedTable === t.name
                      ? 'var(--primary)'
                      : hoveredTable === t.name
                        ? 'var(--bg-2)'
                        : 'transparent',
                    transition: 'background 0.12s',
                  }}
                >
                  <Database
                    size={13}
                    style={{ color: selectedTable === t.name ? '#fff' : 'var(--text-4)', flexShrink: 0 }}
                  />
                  <span style={{
                    flex: 1, fontSize: '12px', fontWeight: selectedTable === t.name ? 600 : 400,
                    color: selectedTable === t.name ? '#fff' : 'var(--text-1)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {t.name}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    color: selectedTable === t.name ? 'rgba(255,255,255,0.7)' : 'var(--text-4)',
                    flexShrink: 0
                  }}>
                    {t.row_count >= 1000 ? `${(t.row_count / 1000).toFixed(1)}k` : t.row_count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table content */}
          <div className="card">
            {!selectedTable ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', color: 'var(--text-4)' }}>
                <Database size={48} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: '14px' }}>Jadvalni tanlang</p>
              </div>
            ) : tableData ? (
              <>
                <div className="card-header flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 700, color: 'var(--text-0)', fontSize: '14px' }}>{selectedTable}</span>
                    <span className="badge badge-primary">{tables.find(t => t.name === selectedTable)?.row_count.toLocaleString()} ta qator</span>
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => exportTableData(selectedTable)}
                  >
                    <Upload size={12} /> CSV Export
                  </button>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        {tableData.columns.map(c => (
                          <th key={c} style={{ padding: '10px 14px', backgroundColor: 'var(--bg-1)' }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.map((row, i) => (
                        <tr key={i} style={{ cursor: 'default' }}>
                          {row.map((cell, j) => (
                            <td key={j} className="font-mono" style={{ fontSize: '12px', padding: '10px 14px', color: 'var(--text-2)' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="card-footer">
                  <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>
                    Hajm: {tables.find(t => t.name === selectedTable)?.size} · Faqat o'qish rejimi
                  </span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', color: 'var(--text-4)' }}>
                <Database size={48} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: '14px' }}>"{selectedTable}" jadvali uchun oldindan ko'rish mavjud emas</p>
                <p style={{ fontSize: '12px' }}>Backend ulangandan keyin real ma'lumotlar ko'rinadi</p>
                <button className="btn btn-sm" onClick={() => exportTableData(selectedTable)}>
                  <Upload size={12} /> CSV Export
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'backups' && (
        <div>
          <div className="card mb-16">
            <div className="card-body flex-between">
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-0)', marginBottom: '4px' }}>Oxirgi zaxira</div>
                <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                  {backups[0].created_at} — {backups[0].size} — {backups[0].duration}
                </div>
                {backingUp && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: '4px' }}>
                      Zaxiralanmoqda... {backupProgress}%
                    </div>
                    <div className="progress" style={{ width: '280px' }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${backupProgress}%`, transition: 'width 0.3s ease', background: 'var(--primary)' }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <button className="btn btn-primary" onClick={runBackup} disabled={backingUp}>
                {backingUp
                  ? <><RefreshCw size={14} className="animate-spin" /> Zaxiralanmoqda...</>
                  : <><HardDrive size={14} /> Zaxiralash</>}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Fayl nomi</th>
                    <th style={{ padding: '12px 16px' }}>Hajm</th>
                    <th style={{ padding: '12px 16px' }}>Davomiylik</th>
                    <th style={{ padding: '12px 16px' }}>Yaratilgan</th>
                    <th style={{ padding: '12px 16px' }}>Holat</th>
                    <th style={{ padding: '12px 16px' }}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b, i) => (
                    <tr key={i}>
                      <td className="font-mono" style={{ padding: '12px 16px', fontSize: '12px' }}>{b.filename}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-0)' }}>{b.size}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{b.duration}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{b.created_at}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${b.status === 'ok' ? 'badge-green' : 'badge-red'}`}>
                          {b.status === 'ok' ? 'Muvaffaqiyatli' : 'Xato'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => addToast('Yuklanmoqda', `${b.filename} yuklab olinmoqda...`, 'info')}
                        >
                          <Download size={13} /> Yuklab olish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div>
          <div className="grid-4 mb-24">
            <div className="card stat-card">
              <div className="stat-label">DB hajmi</div>
              <div className="stat-value">141.4 MB</div>
              <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px' }}>12 ta jadval</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Jami qatorlar</div>
              <div className="stat-value">{tables.reduce((s, t) => s + t.row_count, 0).toLocaleString()}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Faol ulanishlar</div>
              <div className="stat-value">24</div>
              <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px' }}>Maks: 100</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">PG versiya</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>16.3</div>
              <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '4px' }}>Eng so'nggi</div>
            </div>
          </div>

          <div className="card mb-24">
            <div className="card-header">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Jadval bo'yicha qatorlar (Top 8)</span>
            </div>
            <div className="card-body" style={{ height: '380px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 60, left: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false}
                    angle={-30} textAnchor="end" height={70}
                  />
                  <YAxis
                    stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: any) => [Number(value).toLocaleString(), 'Qatorlar']}
                  />
                  <Bar dataKey="rows" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex-between">
              <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Barcha jadvallar</span>
              <button className="btn btn-sm" onClick={() => addToast('Export', 'Statistika yuklab olinmoqda...', 'info')}>
                <Upload size={12} /> Export
              </button>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Jadval</th>
                    <th style={{ padding: '12px 16px' }}>Qatorlar</th>
                    <th style={{ padding: '12px 16px' }}>Hajm</th>
                    <th style={{ padding: '12px 16px' }}>Ulush</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map(t => {
                    const totalRows = tables.reduce((s, x) => s + x.row_count, 0);
                    const pct = ((t.row_count / totalRows) * 100).toFixed(1);
                    return (
                      <tr key={t.name}>
                        <td style={{ padding: '10px 16px' }} className="font-mono">{t.name}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 600 }}>{t.row_count.toLocaleString()}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-3)' }}>{t.size}</td>
                        <td style={{ padding: '10px 16px', minWidth: '120px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="progress" style={{ flex: 1, height: '6px' }}>
                              <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-4)', flexShrink: 0 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
