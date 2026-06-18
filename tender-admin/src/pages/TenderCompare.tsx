import { useState } from 'react';
import { GitCompare, Check, X, RotateCcw } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface CompareTender {
  id: number;
  title: string;
  category: string;
  region: string;
  amount: number;
  deadline: string;
  organization: string;
  status: string;
  winner?: string;
  requirements: string;
}

const mockTenders: CompareTender[] = [
  { id: 1, title: 'IT uskunalarni yetkazib berish', category: 'IT', region: 'Toshkent', amount: 450000000, deadline: '2026-06-25', organization: 'Toshkent hokimligi', status: 'active', winner: '—', requirements: 'ISO 9001 sertifikati, 3 yillik tajriba, moliyaviy kafolat' },
  { id: 2, title: 'Binoni ta\'mirlash ishlari', category: 'Qurilish', region: 'Samarqand', amount: 1200000000, deadline: '2026-06-30', organization: 'Samarqand viloyati', status: 'active', winner: '—', requirements: 'Qurilish litsenziyasi, 5 yillik tajriba, bank kafolati' },
  { id: 3, title: 'Dori vositalari sotib olish', category: 'Tibbiyot', region: 'Buxoro', amount: 320000000, deadline: '2026-07-05', organization: 'Sog\'liqni saqlash', status: 'active', winner: '—', requirements: 'GMP sertifikati, dori-darmon litsenziyasi, sifat sertifikati' },
  { id: 4, title: 'Server va tarmoq jihozlari', category: 'IT', region: 'Toshkent', amount: 780000000, deadline: '2026-07-10', organization: 'Raqamli texnologiyalar', status: 'active', winner: '—', requirements: 'Cisco/HP sertifikati, 2 yillik kafolat, texnik qo\'llab-quvvatlash' },
  { id: 5, title: 'Yo\'l ta\'mirlash loyihasi', category: 'Qurilish', region: 'Navoiy', amount: 3500000000, deadline: '2026-07-15', organization: 'Navoiy hokimligi', status: 'active', winner: '—', requirements: 'Qurilish litsenziyasi, 10 yillik tajriba, maxsus texnika, bank kafolati 10%' },
];

const fmtAmount = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd so'm`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} mln so'm`;
  return `${n.toLocaleString()} so'm`;
};

const compareRows: { key: keyof CompareTender; label: string }[] = [
  { key: 'organization', label: 'Tashkilot' },
  { key: 'category', label: 'Kategoriya' },
  { key: 'region', label: 'Hudud' },
  { key: 'amount', label: 'Summa' },
  { key: 'status', label: 'Holat' },
  { key: 'deadline', label: 'Muddat' },
  { key: 'winner', label: 'G\'olib' },
  { key: 'requirements', label: 'Talablar' },
];

const statusBadge = (s: string) => {
  const cls = s === 'active' ? 'badge-green' : s === 'closed' ? 'badge-red' : 'badge-purple';
  const label = s === 'active' ? 'Faol' : s === 'closed' ? 'Yopilgan' : 'G\'olib aniqlangan';
  return <span className={`badge ${cls}`}>{label}</span>;
};

export default function TenderCompare() {
  const { addToast } = useAdmin();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) {
        addToast('Limit', 'Maksimal 3 ta tender solishtirish mumkin', 'info');
        return prev;
      }
      return [...prev, id];
    });
  };

  const clearSelection = () => {
    setSelectedIds([]);
    addToast('Tozalandi', 'Tanlangan tenderlar tozalandi', 'info');
  };

  const selectedTenders = mockTenders.filter(t => selectedIds.includes(t.id));

  const formatValue = (key: keyof CompareTender, val: unknown): string => {
    if (key === 'amount') return fmtAmount(val as number);
    return String(val ?? '—');
  };

  const renderCell = (key: keyof CompareTender, val: unknown) => {
    if (key === 'status') return statusBadge(String(val));
    if (key === 'category') return <span className="badge badge-primary">{String(val)}</span>;
    return <span style={{ fontSize: '13px', color: 'var(--text-1)' }}>{formatValue(key, val)}</span>;
  };

  const isAllSame = (key: keyof CompareTender): boolean => {
    if (selectedTenders.length < 2) return true;
    const first = formatValue(key, selectedTenders[0][key]);
    return selectedTenders.every(t => formatValue(key, t[key]) === first);
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Tenderlarni solishtirish</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>2-3 tenderni tanlang va ularni taqqoslang</p>
        </div>
        {selectedIds.length > 0 && (
          <button className="btn btn-sm" onClick={clearSelection}>
            <RotateCcw size={14} /> Tozalash
          </button>
        )}
      </div>

      {/* Selectable tender cards */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Tenderlarni tanlang ({selectedIds.length}/3)
        </h3>
        <div className="grid-3" style={{ gap: '12px' }}>
          {mockTenders.map(t => {
            const isSelected = selectedIds.includes(t.id);
            return (
              <div
                key={t.id}
                onClick={() => toggleSelect(t.id)}
                style={{
                  padding: '16px',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-1)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--primary-soft)' : 'var(--bg-1)',
                  transition: 'border-color 0.15s, background 0.15s',
                  position: 'relative',
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={12} style={{ color: '#fff' }} />
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-0)', marginBottom: '6px', paddingRight: '24px' }}>
                  #{t.id} — {t.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '8px' }}>{t.organization}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge badge-primary">{t.category}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-0)' }}>{fmtAmount(t.amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison table */}
      {selectedTenders.length >= 2 && (
        <div className="card">
          <div className="card-header">
            <h3>
              <GitCompare size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Solishtirish jadvali
            </h3>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Maydon</th>
                  {selectedTenders.map(t => (
                    <th key={t.id}>
                      <div style={{ fontWeight: 700 }}>#{t.id}</div>
                      <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-3)' }}>{t.title}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map(row => {
                  const same = isAllSame(row.key);
                  return (
                    <tr key={row.key}>
                      <td style={{ fontWeight: 600, fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {same
                            ? <Check size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                            : <X size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
                          }
                          {row.label}
                        </div>
                      </td>
                      {selectedTenders.map(t => (
                        <td
                          key={t.id}
                          style={{
                            background: same ? 'transparent' : 'rgba(255,200,0,0.06)',
                            borderLeft: '1px solid var(--border-1)',
                          }}
                        >
                          {renderCell(row.key, t[row.key])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTenders.length < 2 && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-4)' }}>
            <GitCompare size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ fontSize: '14px' }}>Solishtirish uchun kamida 2 ta tender tanlang</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Yuqoridagi kartochkalardan tenderlarni bosib tanlang</p>
          </div>
        </div>
      )}
    </div>
  );
}
