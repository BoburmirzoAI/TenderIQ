import { useState, useRef } from 'react';
import { FileText, Upload, CheckCircle, XCircle, AlertTriangle, FileSpreadsheet, File, X } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface ChecklistItem {
  name: string;
  status: 'pass' | 'fail';
}

interface DocumentCheck {
  id: number;
  filename: string;
  tender: string;
  compliance: number;
  issues: number;
  checked_at: string;
  checklist: ChecklistItem[];
  missingItems: string[];
}

const mockChecks: DocumentCheck[] = [
  { id: 1, filename: 'ariza_forma.pdf', tender: 'IT uskunalar yetkazish', compliance: 95, issues: 1, checked_at: '2026-06-16 14:30', checklist: [{ name: 'Ariza formasi to\'ldirilgan', status: 'pass' }, { name: 'Imzo va muhr mavjud', status: 'pass' }, { name: 'STIR ko\'rsatilgan', status: 'pass' }, { name: 'Litsenziya nusxasi', status: 'fail' }], missingItems: ['Litsenziya nusxasi ilova qilinmagan'] },
  { id: 2, filename: 'texnik_taklif.docx', tender: 'Binoni ta\'mirlash', compliance: 88, issues: 2, checked_at: '2026-06-15 10:15', checklist: [{ name: 'Texnik spetsifikatsiya', status: 'pass' }, { name: 'Ish jadvali', status: 'fail' }, { name: 'Xodimlar ro\'yxati', status: 'pass' }, { name: 'Mashina-mexanizmlar', status: 'fail' }], missingItems: ['Ish jadvali tushirilmagan', 'Mashina-mexanizmlar ro\'yxati yo\'q'] },
  { id: 3, filename: 'moliyaviy_taklif.xlsx', tender: 'Dori vositalari', compliance: 100, issues: 0, checked_at: '2026-06-14 16:45', checklist: [{ name: 'Narxlar jadvali', status: 'pass' }, { name: 'QQS hisobi', status: 'pass' }, { name: 'Yetkazib berish shartlari', status: 'pass' }], missingItems: [] },
  { id: 4, filename: 'sertifikatlar.zip', tender: 'Server jihozlari', compliance: 75, issues: 3, checked_at: '2026-06-13 09:00', checklist: [{ name: 'ISO 9001', status: 'pass' }, { name: 'ISO 27001', status: 'fail' }, { name: 'Mahalliy sertifikat', status: 'fail' }, { name: 'Kafolat xati', status: 'pass' }, { name: 'Ishlab chiqaruvchi xati', status: 'fail' }], missingItems: ['ISO 27001 sertifikati', 'Mahalliy sertifikat', 'Ishlab chiqaruvchi vakolatnomasi'] },
  { id: 5, filename: 'shartnoma_loyiha.pdf', tender: 'Transport xizmatlari', compliance: 92, issues: 1, checked_at: '2026-06-12 11:30', checklist: [{ name: 'Shartnoma shartlari', status: 'pass' }, { name: 'Jarimalar bo\'limi', status: 'pass' }, { name: 'Kafolat muddati', status: 'fail' }, { name: 'To\'lov shartlari', status: 'pass' }], missingItems: ['Kafolat muddati ko\'rsatilmagan'] },
  { id: 6, filename: 'kvalifikatsiya.pdf', tender: 'Maktab inventari', compliance: 100, issues: 0, checked_at: '2026-06-11 15:00', checklist: [{ name: 'Tajriba ma\'lumotnomasi', status: 'pass' }, { name: 'Moliyaviy hisobot', status: 'pass' }, { name: 'Bank ma\'lumotnomasi', status: 'pass' }], missingItems: [] },
  { id: 7, filename: 'texnik_tavsif.pdf', tender: 'Oziq-ovqat yetkazish', compliance: 82, issues: 2, checked_at: '2026-06-10 13:20', checklist: [{ name: 'Mahsulot ro\'yxati', status: 'pass' }, { name: 'Sifat sertifikati', status: 'fail' }, { name: 'Sanitariya ruxsatnomasi', status: 'pass' }, { name: 'Saqlash shartlari', status: 'fail' }], missingItems: ['Sifat sertifikati', 'Saqlash shartlari tavsifi'] },
  { id: 8, filename: 'bank_kafolat.pdf', tender: 'Yo\'l ta\'mirlash', compliance: 100, issues: 0, checked_at: '2026-06-09 08:45', checklist: [{ name: 'Bank kafolat xati', status: 'pass' }, { name: 'Summasi to\'g\'ri', status: 'pass' }, { name: 'Amal qilish muddati', status: 'pass' }], missingItems: [] },
];

const getFileIcon = (filename: string) => {
  if (filename.endsWith('.pdf')) return <FileText size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />;
  if (filename.endsWith('.xlsx') || filename.endsWith('.xls') || filename.endsWith('.csv')) return <FileSpreadsheet size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />;
  return <File size={16} style={{ color: 'var(--text-4)', flexShrink: 0 }} />;
};

const totalChecks = mockChecks.length;
const avgCompliance = Math.round(mockChecks.reduce((s, c) => s + c.compliance, 0) / totalChecks);
const totalIssues = mockChecks.reduce((s, c) => s + c.issues, 0);

const tdStyle: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };

export default function Documents() {
  const { addToast } = useAdmin();
  const [tab, setTab] = useState<'analysis' | 'history'>('analysis');
  const [selectedCheck, setSelectedCheck] = useState<DocumentCheck | null>(mockChecks[0]);
  const [detailCheck, setDetailCheck] = useState<DocumentCheck | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const names = files.map(f => f.name);
      setUploadedFiles(prev => [...prev, ...names]);
      addToast('Hujjat yuklandi', `${names.join(', ')} muvaffaqiyatli yuklandi`, 'success');
      setTimeout(() => addToast('Tahlil tugadi', 'Hujjat tahlili yakunlandi', 'success'), 2000);
    }
    // reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Hujjat tahlili</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Tender hujjatlarini tekshirish va tahlil qilish</p>
        </div>
      </div>

      <div className="grid-3 mb-24">
        <div className="card stat-card" style={{ border: '1px solid var(--border)' }}>
          <div className="flex-between mb-8">
            <span className="stat-label">Jami tekshiruvlar</span>
            <FileText size={16} style={{ color: 'var(--blue)' }} />
          </div>
          <div className="stat-value">{totalChecks + uploadedFiles.length}</div>
        </div>
        <div className="card stat-card" style={{ border: '1px solid var(--border)' }}>
          <div className="flex-between mb-8">
            <span className="stat-label">O'rtacha muvofiqlik</span>
            <CheckCircle size={16} style={{ color: 'var(--green)' }} />
          </div>
          <div className="stat-value">{avgCompliance}%</div>
        </div>
        <div className="card stat-card" style={{ border: '1px solid var(--border)' }}>
          <div className="flex-between mb-8">
            <span className="stat-label">Jami muammolar</span>
            <AlertTriangle size={16} style={{ color: 'var(--orange)' }} />
          </div>
          <div className="stat-value">{totalIssues}</div>
        </div>
      </div>

      <div className="tabs mb-24">
        <button className={`tab ${tab === 'analysis' ? 'active' : ''}`} onClick={() => setTab('analysis')}>Hujjat tahlili</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Tekshiruv tarixi</button>
      </div>

      {tab === 'analysis' && (
        <div className="grid-2" style={{ gap: '24px' }}>
          <div>
            {/* Upload Area */}
            <div className="card mb-24" style={{ border: '1px solid var(--border)' }}>
              <div
                className="card-body"
                style={{ textAlign: 'center', padding: '32px', border: '2px dashed var(--border)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                onClick={handleUploadClick}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-1)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <Upload size={32} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-0)', marginBottom: '4px' }}>Hujjat yuklash</p>
                <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>PDF, DOCX, XLSX formatlarida — bosing yoki tashlang</p>
                {uploadedFiles.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {uploadedFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '12px', color: 'var(--green)' }}>
                        {getFileIcon(f)} {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.xls,.csv"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            {/* Checklist Detail */}
            {selectedCheck && (
              <div className="card" style={{ border: '1px solid var(--border)' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-0)' }}>
                    Tekshiruv natijalari: <span style={{ fontFamily: 'monospace' }}>{selectedCheck.filename}</span>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%',
                      background: selectedCheck.compliance >= 90 ? 'var(--green-soft)' : selectedCheck.compliance >= 70 ? 'var(--yellow-soft)' : 'var(--red-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '18px',
                      color: selectedCheck.compliance >= 90 ? 'var(--green)' : selectedCheck.compliance >= 70 ? 'var(--yellow)' : 'var(--red)',
                      border: `2px solid ${selectedCheck.compliance >= 90 ? 'var(--green)' : selectedCheck.compliance >= 70 ? 'var(--yellow)' : 'var(--red)'}`,
                      flexShrink: 0,
                    }}>
                      {selectedCheck.compliance}%
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-0)', marginBottom: '4px' }}>Muvofiqlik darajasi</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{selectedCheck.issues} ta muammo topildi</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{selectedCheck.checked_at}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedCheck.checklist.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        {item.status === 'pass'
                          ? <CheckCircle size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
                          : <XCircle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
                        }
                        <span style={{ fontSize: '13px', color: 'var(--text-0)', flex: 1 }}>{item.name}</span>
                        <span className={`badge ${item.status === 'pass' ? 'badge-green' : 'badge-red'}`}>
                          {item.status === 'pass' ? 'O\'tdi' : 'O\'tmadi'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedCheck.missingItems.length > 0 && (
                    <div style={{ marginTop: '16px', background: 'var(--red-soft)', borderRadius: '8px', padding: '12px', border: '1px solid var(--red)' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--red)', marginBottom: '8px' }}>Yetishmayotgan hujjatlar:</h4>
                      <ul style={{ paddingLeft: '20px', margin: 0 }}>
                        {selectedCheck.missingItems.map((item, i) => (
                          <li key={i} style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: file list */}
          <div className="card" style={{ border: '1px solid var(--border)' }}>
            <div className="card-body">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-0)' }}>So'nggi tekshiruvlar</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mockChecks.map((check) => (
                  <div
                    key={check.id}
                    style={{
                      padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                      background: selectedCheck?.id === check.id ? 'var(--primary-soft)' : 'var(--bg-1)',
                      border: selectedCheck?.id === check.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                      transition: 'border-color 0.15s',
                    }}
                    onClick={() => setSelectedCheck(check)}
                  >
                    <div className="flex-between">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        {getFileIcon(check.filename)}
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{check.filename}</span>
                      </div>
                      <span className={`badge ${check.compliance >= 90 ? 'badge-green' : check.compliance >= 70 ? 'badge-yellow' : 'badge-red'}`} style={{ flexShrink: 0, marginLeft: '8px' }}>
                        {check.compliance}%
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>{check.tender}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>{check.checked_at}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card" style={{ border: '1px solid var(--border)' }}>
          <div className="table-wrap">
            <table className="table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '200px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '80px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={tdStyle}>Fayl nomi</th>
                  <th style={tdStyle}>Tender</th>
                  <th style={tdStyle}>Muvofiqlik</th>
                  <th style={tdStyle}>Muammolar</th>
                  <th style={tdStyle}>Tekshirilgan</th>
                  <th style={tdStyle}>Ko'rish</th>
                </tr>
              </thead>
              <tbody>
                {mockChecks.map((check) => (
                  <tr key={check.id} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }} onClick={() => setDetailCheck(check)}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        {getFileIcon(check.filename)}
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{check.filename}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{check.tender}</td>
                    <td style={tdStyle}>
                      <span className={`badge ${check.compliance >= 90 ? 'badge-green' : check.compliance >= 70 ? 'badge-yellow' : 'badge-red'}`}>
                        {check.compliance}%
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {check.issues > 0
                        ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>{check.issues} ta</span>
                        : <span style={{ color: 'var(--green)' }}>Yo'q</span>
                      }
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-3)' }}>{check.checked_at}</td>
                    <td style={tdStyle}>
                      <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); setDetailCheck(check); }}>
                        Ko'rish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailCheck && (
        <div className="modal-overlay" onClick={() => setDetailCheck(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {getFileIcon(detailCheck.filename)}
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-0)' }}>{detailCheck.filename}</h2>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>{detailCheck.tender}</div>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => setDetailCheck(null)}><X size={14} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Compliance score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: detailCheck.compliance >= 90 ? 'var(--green-soft)' : detailCheck.compliance >= 70 ? 'var(--yellow-soft)' : 'var(--red-soft)', borderRadius: '10px', border: `1px solid ${detailCheck.compliance >= 90 ? 'var(--green)' : detailCheck.compliance >= 70 ? 'var(--yellow)' : 'var(--red)'}` }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '20px',
                  color: detailCheck.compliance >= 90 ? 'var(--green)' : detailCheck.compliance >= 70 ? 'var(--yellow)' : 'var(--red)',
                  flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                  {detailCheck.compliance}%
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-0)', marginBottom: '4px' }}>Muvofiqlik darajasi</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{detailCheck.issues} ta muammo topildi</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>Tekshirilgan: {detailCheck.checked_at}</div>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-0)', marginBottom: '10px' }}>Tekshiruv ro'yxati</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {detailCheck.checklist.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      {item.status === 'pass'
                        ? <CheckCircle size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
                        : <XCircle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
                      }
                      <span style={{ fontSize: '13px', color: 'var(--text-0)', flex: 1 }}>{item.name}</span>
                      <span className={`badge ${item.status === 'pass' ? 'badge-green' : 'badge-red'}`}>
                        {item.status === 'pass' ? 'O\'tdi' : 'O\'tmadi'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing items */}
              {detailCheck.missingItems.length > 0 && (
                <div style={{ background: 'var(--red-soft)', borderRadius: '8px', padding: '14px', border: '1px solid var(--red)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--red)', marginBottom: '8px' }}>Yetishmayotgan hujjatlar:</h4>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {detailCheck.missingItems.map((item, i) => (
                      <li key={i} style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailCheck(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
