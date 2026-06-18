import { useState } from 'react';
import { FileText, FileSpreadsheet, BarChart3, Download, Calendar, X, Eye } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  color: string;
  bg: string;
  formats: string[];
}

interface RecentExport {
  id: number;
  filename: string;
  format: 'PDF' | 'Excel' | 'CSV';
  generatedBy: string;
  date: string;
  size: string;
}

const reportCards: ReportCard[] = [
  {
    id: 'tenders', title: 'Tender hisoboti', description: 'Barcha tenderlar ma\'lumotlarini eksport qiling — filtrlash, holat va summalar bilan',
    icon: FileText, color: 'var(--blue)', bg: 'var(--blue-soft)', formats: ['PDF', 'Excel', 'CSV'],
  },
  {
    id: 'applications', title: 'Arizalar hisoboti', description: 'Yuborilgan arizalar, ularning holatlari va natijalari haqida hisobot',
    icon: FileSpreadsheet, color: 'var(--green)', bg: 'var(--green-soft)', formats: ['PDF', 'Excel', 'CSV'],
  },
  {
    id: 'analytics', title: 'Analitika hisoboti', description: 'Bozor tahlili, trendlar va bashoratlar haqida batafsil hisobot',
    icon: BarChart3, color: 'var(--purple)', bg: 'var(--purple-soft)', formats: ['PDF', 'Excel'],
  },
];

const recentExports: RecentExport[] = [
  { id: 1, filename: 'tenders_june_2026.xlsx', format: 'Excel', generatedBy: 'Bobur S.', date: '2026-06-17 14:30', size: '2.4 MB' },
  { id: 2, filename: 'analytics_q2_2026.pdf', format: 'PDF', generatedBy: 'Jasur K.', date: '2026-06-16 10:15', size: '5.1 MB' },
  { id: 3, filename: 'applications_export.csv', format: 'CSV', generatedBy: 'Dilnoza R.', date: '2026-06-15 16:45', size: '1.2 MB' },
  { id: 4, filename: 'tenders_full_2026.pdf', format: 'PDF', generatedBy: 'Bobur S.', date: '2026-06-14 09:00', size: '8.7 MB' },
  { id: 5, filename: 'market_analysis.xlsx', format: 'Excel', generatedBy: 'Aziz T.', date: '2026-06-12 13:20', size: '3.6 MB' },
];

const mockReportPreview: Record<string, { title: string; stats: { label: string; value: string }[]; summary: string }> = {
  tenders: {
    title: 'Tender Hisoboti — Iyun 2026',
    stats: [
      { label: 'Jami tenderlar', value: '1,248' },
      { label: 'Faol tenderlar', value: '342' },
      { label: 'Yopilgan tenderlar', value: '876' },
      { label: 'Umumiy summa', value: '2.4 trln so\'m' },
      { label: 'O\'rtacha summa', value: '1.9 mlrd so\'m' },
    ],
    summary: 'Iyun oyida tender faolligi o\'tgan oyga nisbatan 12% oshdi. IT va qurilish sektorlari eng ko\'p tender e\'lon qildi. Toshkent shahri 34% ulushni egallaydi.',
  },
  applications: {
    title: 'Arizalar Hisoboti — Iyun 2026',
    stats: [
      { label: 'Jami arizalar', value: '4,521' },
      { label: 'Qabul qilingan', value: '1,234' },
      { label: 'Rad etilgan', value: '892' },
      { label: 'Kutilmoqda', value: '2,395' },
      { label: 'G\'alaba %', value: '27.3%' },
    ],
    summary: 'Ariza berish faolligi o\'tgan oyga nisbatan 8% oshdi. Eng yuqori qabul darajasi IT sektorida (38%) kuzatildi.',
  },
  analytics: {
    title: 'Analitika Hisoboti — Q2 2026',
    stats: [
      { label: 'Bozor hajmi', value: '45.2 trln so\'m' },
      { label: 'O\'sish sur\'ati', value: '+15.3%' },
      { label: 'Faol kompaniyalar', value: '2,847' },
      { label: 'Yangi tenderlar/oy', value: '1,248' },
      { label: 'Raqobat indeksi', value: '4.2' },
    ],
    summary: 'Q2 2026 tender bozori barqaror o\'sishni ko\'rsatdi. IT infratuzilma (+32%) va tibbiyot (+24%) sektorlari lider hisoblanadi.',
  },
};

const formatBadge = (f: string) => {
  const cls = f === 'PDF' ? 'badge-red' : f === 'Excel' ? 'badge-green' : 'badge-blue';
  return <span className={`badge ${cls}`}>{f}</span>;
};

const tdStyle: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };

export default function Reports() {
  const { addToast } = useAdmin();
  const [selectedFormats, setSelectedFormats] = useState<Record<string, string>>({
    tenders: 'PDF', applications: 'Excel', analytics: 'PDF',
  });
  const [dateFrom, setDateFrom] = useState('2026-06-01');
  const [dateTo, setDateTo] = useState('2026-06-17');
  const [generating, setGenerating] = useState<string | null>(null);
  const [previewReport, setPreviewReport] = useState<string | null>(null);

  const generate = (reportId: string, title: string) => {
    setGenerating(reportId);
    addToast('Yaratilmoqda', `${title} hisoboti tayyorlanmoqda...`, 'info');
    setTimeout(() => {
      setGenerating(null);
      addToast('Tayyor', `${title} hisoboti muvaffaqiyatli yaratildi`, 'success');
    }, 2000);
  };

  const preview = mockReportPreview[previewReport || ''];

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Hisobotlar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Hisobotlarni yarating va eksport qiling</p>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="card mb-24" style={{ border: '1px solid var(--border)' }}>
        <div className="card-body" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-0)' }}>Sana oralig'i:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>Dan:</label>
            <input
              className="input"
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{ width: '170px', padding: '8px 12px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>Gacha:</label>
            <input
              className="input"
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{ width: '170px', padding: '8px 12px' }}
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-4)', padding: '6px 12px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            {dateFrom} — {dateTo}
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid-3 mb-24">
        {reportCards.map(report => (
          <div key={report.id} className="card" style={{ border: '1px solid var(--border)' }}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '20px' }}>
              {/* Icon + Title */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: report.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
                  <report.icon size={22} style={{ color: report.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '15px', color: 'var(--text-0)', display: 'block', marginBottom: '6px' }}>{report.title}</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-4)', margin: 0, lineHeight: '1.5' }}>{report.description}</p>
                </div>
              </div>

              <div className="divider" />

              {/* Format select */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px', color: 'var(--text-2)' }}>Eksport formati</label>
                <select
                  className="input select"
                  value={selectedFormats[report.id]}
                  onChange={e => setSelectedFormats(p => ({ ...p, [report.id]: e.target.value }))}
                  style={{ padding: '8px 12px' }}
                >
                  {report.formats.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={generating === report.id}
                  onClick={() => generate(report.id, report.title)}
                >
                  {generating === report.id ? (
                    <><span className="animate-spin" style={{ display: 'inline-block' }}>&#9696;</span> Yaratilmoqda...</>
                  ) : (
                    <><Download size={14} /> Yaratish</>
                  )}
                </button>
                <button
                  className="btn btn-ghost"
                  title="Ko'rish"
                  onClick={() => setPreviewReport(report.id)}
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Exports Table */}
      <div className="card" style={{ border: '1px solid var(--border)' }}>
        <div className="card-header">
          <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Oxirgi eksportlar</h3>
        </div>
        <div className="table-wrap">
          <table className="table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '240px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '170px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '200px' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={tdStyle}>Fayl nomi</th>
                <th style={tdStyle}>Format</th>
                <th style={tdStyle}>Yaratuvchi</th>
                <th style={tdStyle}>Sana</th>
                <th style={tdStyle}>Hajmi</th>
                <th style={tdStyle}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {recentExports.map(exp => (
                <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <FileText size={14} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                      <strong style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.filename}</strong>
                    </div>
                  </td>
                  <td style={tdStyle}>{formatBadge(exp.format)}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-3)', fontSize: '13px' }}>{exp.generatedBy}</td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-4)' }}>{exp.date}</td>
                  <td style={{ ...tdStyle, fontSize: '13px', fontFamily: 'monospace' }}>{exp.size}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => addToast('Yuklab olish', `${exp.filename} yuklab olinmoqda`, 'info')}
                      >
                        <Download size={13} /> Yuklab olish
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          const key = exp.filename.includes('tender') ? 'tenders' : exp.filename.includes('analytic') || exp.filename.includes('market') ? 'analytics' : 'applications';
                          setPreviewReport(key);
                        }}
                      >
                        <Eye size={13} /> Ko'rish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewReport && preview && (
        <div className="modal-overlay" onClick={() => setPreviewReport(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-0)' }}>{preview.title}</h2>
              <button className="btn btn-sm btn-ghost" onClick={() => setPreviewReport(null)}><X size={14} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Stats Grid */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-0)', marginBottom: '12px' }}>Asosiy ko'rsatkichlar</h4>
                <div className="grid-2" style={{ gap: '10px' }}>
                  {preview.stats.map((s, i) => (
                    <div key={i} style={{ padding: '14px', background: 'var(--bg-1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>{s.label}</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-0)' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-0)', marginBottom: '10px' }}>Xulosa</h4>
                <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '16px', fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.7', border: '1px solid var(--border)' }}>
                  {preview.summary}
                </div>
              </div>

              {/* Period */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-4)', padding: '10px 14px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <Calendar size={14} />
                Sana oralig'i: <strong>{dateFrom}</strong> — <strong>{dateTo}</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPreviewReport(null)}>Yopish</button>
              <button className="btn btn-primary" onClick={() => { addToast('Yuklab olish', 'Hisobot yuklab olinmoqda', 'info'); setPreviewReport(null); }}>
                <Download size={14} /> Yuklab olish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
