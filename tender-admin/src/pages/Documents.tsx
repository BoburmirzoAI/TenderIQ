import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Upload, X, RefreshCw, Trash2, Download, Search, CheckCircle, AlertTriangle, XCircle, Shield, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { documentsApi, type AdminDocumentCheck, type DocumentStats, type DocCheckItem } from '../api/admin';

const statusIcon = (s: string) => {
  if (s === 'pass') return <CheckCircle size={15} style={{ color: 'var(--green)', flexShrink: 0 }} />;
  if (s === 'warn') return <AlertTriangle size={15} style={{ color: 'var(--yellow)', flexShrink: 0 }} />;
  return <XCircle size={15} style={{ color: 'var(--red)', flexShrink: 0 }} />;
};

const statusLabel = (s: string) => {
  if (s === 'pass') return 'Topildi';
  if (s === 'warn') return 'Noaniq';
  return 'Topilmadi';
};

const scoreColor = (score: number) => {
  if (score >= 80) return 'var(--green)';
  if (score >= 50) return 'var(--yellow)';
  return 'var(--red)';
};

const scoreBg = (score: number) => {
  if (score >= 80) return 'rgba(16, 185, 129, 0.1)';
  if (score >= 50) return 'rgba(245, 158, 11, 0.1)';
  return 'rgba(239, 68, 68, 0.1)';
};

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleString('uz', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return d?.slice(0, 16) ?? '—'; }
};

export default function Documents() {
  const { addToast } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<AdminDocumentCheck[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<AdminDocumentCheck | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([documentsApi.list(100), documentsApi.stats()]);
      setDocs(list);
      setStats(s);
    } catch {
      addToast('Xatolik', "Ma'lumot yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const checkFile = async (file: globalThis.File) => {
    setChecking(true);
    try {
      const result = await documentsApi.check(file);
      setDocs(prev => [result, ...prev]);
      setSelectedDoc(result);
      addToast('Tekshirildi', `${file.name} — ${result.compliance_score}%`, result.compliance_score >= 80 ? 'success' : 'warning');
      const s = await documentsApi.stats();
      setStats(s);
    } catch (err: any) {
      addToast('Xatolik', err?.response?.data?.detail || 'Tekshirib bo\'lmadi', 'error');
    } finally {
      setChecking(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) checkFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) checkFile(f);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await documentsApi.delete(deleteId);
      setDocs(prev => prev.filter(d => d.id !== deleteId));
      if (selectedDoc?.id === deleteId) setSelectedDoc(null);
      setDeleteId(null);
      addToast("O'chirildi", "Natija o'chirildi", 'info');
      const s = await documentsApi.stats();
      setStats(s);
    } catch {
      addToast('Xatolik', "O'chirishda xato", 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = docs.filter(d =>
    !searchQuery || d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-4)' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx" onChange={handleFileChange} />

      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={24} style={{ color: 'var(--primary)' }} />
            Hujjat tekshiruvi
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
            Tender hujjatlarini compliance tekshiruvi — imzo, muhr, STIR, forma to'ldirilganlik
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={checking}>
            {checking ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
            Hujjat tekshirish
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-24">
        {[
          { label: 'Jami tekshiruvlar', value: stats?.total_checks ?? 0, color: 'var(--primary)' },
          { label: "O'rtacha ball", value: `${stats?.avg_compliance ?? 0}%`, color: scoreColor(stats?.avg_compliance ?? 0) },
          { label: 'Muammolar', value: stats?.total_issues ?? 0, color: 'var(--red)' },
          { label: "To'liq mos", value: stats?.full_compliance ?? 0, color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-label mb-8">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <div
        className="card mb-24"
        style={{
          border: dragOver ? '2px dashed var(--primary)' : '2px dashed var(--border-1)',
          background: dragOver ? 'var(--primary-soft)' : 'transparent',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
        onClick={() => !checking && fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div style={{ padding: '32px', textAlign: 'center' }}>
          {checking ? (
            <>
              <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '8px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>Hujjat tahlil qilinmoqda...</p>
              <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '4px' }}>PDF mazmuni tekshirilmoqda: imzo, muhr, STIR, forma</p>
            </>
          ) : (
            <>
              <Upload size={32} style={{ color: dragOver ? 'var(--primary)' : 'var(--text-4)', marginBottom: '8px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: dragOver ? 'var(--primary)' : 'var(--text-2)' }}>
                Tender hujjatni shu yerga tashlang yoki bosib tanlang
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '4px' }}>
                PDF formatda yuklang — hujjat mazmuni tahlil qilinadi (imzo, muhr, STIR, sana, summa, forma)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Layout: list + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedDoc ? '1fr 420px' : '1fr', gap: '16px' }}>
        <div>
          {/* Search */}
          {docs.length > 0 && (
            <div className="card mb-16">
              <div className="card-body" style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                  <input className="input" placeholder="Fayl nomini qidirish..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '32px', width: '100%' }} />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-4)', alignSelf: 'center' }}>{filtered.length} ta</span>
              </div>
            </div>
          )}

          {/* Results list */}
          <div className="card">
            {filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)' }}>
                <Shield size={48} style={{ marginBottom: '12px', opacity: 0.15 }} />
                <p style={{ fontSize: '14px' }}>{docs.length === 0 ? 'Hali hujjat tekshirilmagan' : 'Qidiruv natijasi topilmadi'}</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>Yuqoridagi tugmani bosib tender hujjatni yuklang</p>
              </div>
            ) : (
              <div>
                {filtered.map(d => {
                  const expanded = expandedRows.has(d.id);
                  return (
                    <div key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      {/* Row header */}
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                          cursor: 'pointer',
                          background: selectedDoc?.id === d.id ? 'var(--bg-active)' : undefined,
                        }}
                        onClick={() => setSelectedDoc(selectedDoc?.id === d.id ? null : d)}
                      >
                        {/* Score circle */}
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '50%',
                          background: scoreBg(d.compliance_score),
                          border: `2px solid ${scoreColor(d.compliance_score)}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '13px', color: scoreColor(d.compliance_score),
                          flexShrink: 0,
                        }}>
                          {Math.round(d.compliance_score)}%
                        </div>

                        {/* File info */}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <FileText size={13} style={{ marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--text-4)' }} />
                            {d.filename}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px', display: 'flex', gap: '12px' }}>
                            <span>{(d.file_type || '').toUpperCase()}</span>
                            <span>{d.file_size_kb ? `${d.file_size_kb} KB` : ''}</span>
                            <span>{fmtDate(d.created_at)}</span>
                          </div>
                        </div>

                        {/* Mini checklist summary */}
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                          {d.checklist.slice(0, 5).map((c, i) => (
                            <div key={i} style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              background: c.status === 'pass' ? 'var(--green)' : c.status === 'warn' ? 'var(--yellow)' : 'var(--red)',
                            }} title={c.name} />
                          ))}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                          <button className="btn-icon" onClick={() => toggleRow(d.id)} title="Checklist">
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button className="btn-icon" onClick={() => documentsApi.download(d.id, d.filename).catch(() => addToast('Xatolik', 'Yuklab olishda xato', 'error'))} title="Yuklab olish">
                            <Download size={14} />
                          </button>
                          <button className="btn-icon" onClick={() => setDeleteId(d.id)} title="O'chirish">
                            <Trash2 size={14} style={{ color: 'var(--red)' }} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded checklist */}
                      {expanded && (
                        <div style={{ padding: '0 16px 14px 72px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {d.checklist.map((c, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                {statusIcon(c.status)}
                                <span style={{ fontWeight: 500 }}>{c.name}</span>
                                <span style={{ color: c.status === 'pass' ? 'var(--green)' : c.status === 'warn' ? 'var(--yellow)' : 'var(--red)', fontWeight: 600 }}>
                                  — {statusLabel(c.status)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {d.missing_items.length > 0 && (
                            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.06)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)', marginBottom: '4px' }}>Kamchiliklar:</div>
                              {d.missing_items.map((m, i) => (
                                <div key={i} style={{ fontSize: '11px', color: 'var(--text-3)', padding: '1px 0' }}>• {m}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedDoc && (
          <div className="card" style={{ alignSelf: 'start', position: 'sticky', top: '80px' }}>
            <div className="card-header flex-between">
              <h3 style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={14} style={{ color: 'var(--primary)' }} /> Tekshiruv natijasi
              </h3>
              <button className="btn-icon" onClick={() => setSelectedDoc(null)}><X size={16} /></button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Score */}
              <div style={{
                textAlign: 'center', padding: '20px',
                background: scoreBg(selectedDoc.compliance_score),
                borderRadius: '12px', border: `1px solid ${scoreColor(selectedDoc.compliance_score)}20`,
              }}>
                <div style={{ fontSize: '36px', fontWeight: 900, color: scoreColor(selectedDoc.compliance_score) }}>
                  {Math.round(selectedDoc.compliance_score)}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                  Compliance ball — {selectedDoc.compliance_score >= 80 ? "Yaxshi" : selectedDoc.compliance_score >= 50 ? "O'rtacha" : "Past"}
                </div>
              </div>

              {/* File info */}
              <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedDoc.filename}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', display: 'flex', gap: '12px' }}>
                  <span>{(selectedDoc.file_type || '').toUpperCase()}</span>
                  <span>{selectedDoc.file_size_kb} KB</span>
                  <span>{fmtDate(selectedDoc.created_at)}</span>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '8px' }}>Tekshiruv natijalari</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedDoc.checklist.map((c: DocCheckItem, i: number) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px',
                      background: c.status === 'pass' ? 'rgba(16, 185, 129, 0.05)' : c.status === 'warn' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                      borderRadius: '8px',
                      border: `1px solid ${c.status === 'pass' ? 'rgba(16, 185, 129, 0.15)' : c.status === 'warn' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                    }}>
                      {statusIcon(c.status)}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>{c.name}</div>
                        {c.detail && <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>{c.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing items */}
              {selectedDoc.missing_items.length > 0 && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.06)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)', marginBottom: '6px' }}>
                    ⚠ Topilgan kamchiliklar ({selectedDoc.missing_items.length})
                  </div>
                  {selectedDoc.missing_items.map((m, i) => (
                    <div key={i} style={{ fontSize: '12px', color: 'var(--text-2)', padding: '3px 0', display: 'flex', gap: '6px' }}>
                      <XCircle size={12} style={{ color: 'var(--red)', marginTop: '2px', flexShrink: 0 }} />
                      {m}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => documentsApi.download(selectedDoc.id, selectedDoc.filename).catch(() => addToast('Xatolik', 'Yuklab olishda xato', 'error'))}>
                  <Download size={14} /> Yuklab olish
                </button>
                <button className="btn btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => setDeleteId(selectedDoc.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--red)' }}>Natijani o'chirish</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '20px', textAlign: 'center' }}>
              <Trash2 size={32} style={{ color: 'var(--red)', marginBottom: '12px', opacity: 0.6 }} />
              <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                "{docs.find(d => d.id === deleteId)?.filename}" tekshiruv natijasini o'chirmoqchimisiz?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Bekor</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />} O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
