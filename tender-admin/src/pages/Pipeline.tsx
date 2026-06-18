import { useState } from 'react';
import { Layers, ArrowRight, Eye, Clock, DollarSign, Building } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface Application {
  id: number;
  tenderTitle: string;
  company: string;
  amount: number;
  deadline: string;
  stage: string;
}

const stages = [
  { key: 'new', label: 'Yangi', color: 'var(--blue)', bg: 'var(--blue-soft)' },
  { key: 'review', label: 'Ko\'rib chiqilmoqda', color: 'var(--orange)', bg: 'var(--orange-soft)' },
  { key: 'doc_prep', label: 'Hujjat tayyorlash', color: 'var(--yellow)', bg: 'var(--yellow-soft)' },
  { key: 'submitted', label: 'Yuborildi', color: 'var(--purple)', bg: 'var(--purple-soft)' },
  { key: 'awaiting', label: 'Natija kutilmoqda', color: 'var(--teal)', bg: 'var(--teal-soft)' },
  { key: 'won', label: 'G\'alaba', color: 'var(--green)', bg: 'var(--green-soft)' },
  { key: 'lost', label: 'Mag\'lubiyat', color: 'var(--red)', bg: 'var(--red-soft)' },
];

const mockApps: Application[] = [
  { id: 1, tenderTitle: 'IT uskunalarni yetkazib berish', company: 'TechCorp LLC', amount: 450000000, deadline: '2026-06-25', stage: 'new' },
  { id: 2, tenderTitle: 'Binoni ta\'mirlash ishlari', company: 'BuildPro MCHJ', amount: 1200000000, deadline: '2026-06-30', stage: 'review' },
  { id: 3, tenderTitle: 'Dori vositalari sotib olish', company: 'MediSupply', amount: 320000000, deadline: '2026-06-22', stage: 'doc_prep' },
  { id: 4, tenderTitle: 'Transport xizmatlari', company: 'LogiTrans MCHJ', amount: 89000000, deadline: '2026-07-05', stage: 'submitted' },
  { id: 5, tenderTitle: 'Server va tarmoq jihozlari', company: 'TechCorp LLC', amount: 780000000, deadline: '2026-07-10', stage: 'new' },
  { id: 6, tenderTitle: 'Maktab inventari yetkazish', company: 'EduSupply', amount: 156000000, deadline: '2026-06-28', stage: 'awaiting' },
  { id: 7, tenderTitle: 'Yo\'l ta\'mirlash loyihasi', company: 'GreenBuild', amount: 3500000000, deadline: '2026-07-15', stage: 'won' },
  { id: 8, tenderTitle: 'Oziq-ovqat yetkazib berish', company: 'FoodLine MCHJ', amount: 210000000, deadline: '2026-06-20', stage: 'lost' },
  { id: 9, tenderTitle: 'Ofis jihozlari', company: 'OfficePro', amount: 95000000, deadline: '2026-07-01', stage: 'review' },
  { id: 10, tenderTitle: 'Laboratoriya uskunalari', company: 'MediSupply', amount: 680000000, deadline: '2026-07-08', stage: 'doc_prep' },
];

const fmtAmount = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} mln`;
  return n.toLocaleString();
};

const stageBadge = (stageKey: string) => {
  const s = stages.find(st => st.key === stageKey);
  if (!s) return null;
  return <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
};

export default function Pipeline() {
  const { addToast } = useAdmin();
  const [apps, setApps] = useState(mockApps);
  const [detail, setDetail] = useState<Application | null>(null);

  const stageCounts = stages.map(s => ({
    ...s,
    count: apps.filter(a => a.stage === s.key).length,
  }));

  const moveToNext = (app: Application) => {
    const idx = stages.findIndex(s => s.key === app.stage);
    if (idx < stages.length - 2) {
      const nextStage = stages[idx + 1].key;
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, stage: nextStage } : a));
      addToast('Ko\'chirildi', `${app.tenderTitle} — ${stages[idx + 1].label}`, 'success');
    }
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Pipeline</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Tender arizalari jarayoni</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="card stat-card" style={{ flex: 1, minWidth: '120px' }}>
          <span className="stat-label">Jami arizalar</span>
          <div className="stat-value">{apps.length}</div>
        </div>
        {stageCounts.map(s => (
          <div key={s.key} className="card stat-card" style={{ flex: 1, minWidth: '100px' }}>
            <span className="stat-label" style={{ fontSize: '11px' }}>{s.label}</span>
            <div className="stat-value" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px' }}>
        {stages.map(stage => {
          const stageApps = apps.filter(a => a.stage === stage.key);
          return (
            <div key={stage.key} style={{ minWidth: '240px', flex: 1 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
                padding: '8px 12px', borderRadius: '8px', background: stage.bg,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: stage.color }}>{stage.label}</span>
                <span style={{ fontSize: '11px', color: stage.color, marginLeft: 'auto', fontWeight: 600 }}>{stageApps.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stageApps.map(app => (
                  <div key={app.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setDetail(app)}>
                    <div className="card-body" style={{ padding: '12px' }}>
                      <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px', lineHeight: 1.3 }}>{app.tenderTitle}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-4)', marginBottom: '4px' }}>
                        <Building size={11} /> {app.company}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-4)', marginBottom: '4px' }}>
                        <DollarSign size={11} /> {fmtAmount(app.amount)} so'm
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-4)' }}>
                        <Clock size={11} /> {app.deadline}
                      </div>
                      {stage.key !== 'won' && stage.key !== 'lost' && (
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ marginTop: '8px', width: '100%', fontSize: '11px' }}
                          onClick={e => { e.stopPropagation(); moveToNext(app); }}
                        >
                          Keyingisiga <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {stageApps.length === 0 && (
                  <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-4)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                    Bo'sh
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '480px' }}>
            <div className="flex-between mb-16">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Ariza tafsilotlari</h2>
              <button className="btn btn-sm" onClick={() => setDetail(null)}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><strong>Tender:</strong> {detail.tenderTitle}</div>
              <div><strong>Kompaniya:</strong> {detail.company}</div>
              <div><strong>Summa:</strong> {fmtAmount(detail.amount)} so'm</div>
              <div><strong>Muddat:</strong> {detail.deadline}</div>
              <div><strong>Holat:</strong> {stageBadge(detail.stage)}</div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setDetail(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
