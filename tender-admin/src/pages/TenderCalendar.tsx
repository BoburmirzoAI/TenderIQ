import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, RefreshCw, X, BarChart3, Target, Activity, FileText, TrendingUp, Map } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { tenderDetailApi } from '../api/admin';

const WEEKDAYS = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];
const MONTH_NAMES = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];

export default function TenderCalendar() {
  const { addToast, setActiveTab } = useAdmin();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [dateCounts, setDateCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await tenderDetailApi.byDeadline(60);
      const map: Record<string, number> = {};
      rows.forEach(r => { map[r.date] = r.count; });
      setDateCounts(map);
    } catch {
      addToast('Xatolik', "Tender muddatlari yuklanmadi", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = now.toISOString().slice(0, 10);
  const totalThisMonth = Object.entries(dateCounts)
    .filter(([d]) => d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
    .reduce((s, [, c]) => s + c, 0);

  const daysWithTenders = Object.keys(dateCounts).length;

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-4)' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Tender Kalendari</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Tenderlar muddat tugash sanasi bo'yicha</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Tenderlar', tab: 'tenders', icon: Target, color: 'var(--teal)' },
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Tender xaritasi', tab: 'tender_map', icon: Map, color: 'var(--green)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: Activity, color: 'var(--yellow)' },
          { label: 'Pipeline', tab: 'pipeline', icon: TrendingUp, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: FileText, color: 'var(--red)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      <div className="grid-3 mb-24">
        {[
          { label: "Bu oydagi muddatlar", value: totalThisMonth, color: 'var(--primary)' },
          { label: "Kuni belgili sanalar", value: daysWithTenders,  color: 'var(--green)' },
          { label: "Bugun:",               value: todayStr,          color: 'var(--text-1)' },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-label mb-8">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: String(s.value).length > 7 ? '16px' : undefined }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn-sm btn-ghost" onClick={prevMonth}><ChevronLeft size={16} /></button>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{MONTH_NAMES[month]} {year}</h3>
          <button className="btn btn-sm btn-ghost" onClick={nextMonth}><ChevronRight size={16} /></button>
        </div>
        <div className="card-body" style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0' }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--text-4)', borderBottom: '1px solid var(--border-1)' }}>
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} style={{ minHeight: '90px', border: '1px solid var(--border-1)', background: 'var(--bg-1)' }} />;
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const count = dateCounts[dateStr] ?? 0;
              const isToday = dateStr === todayStr;
              const isSelected = selectedDay === dateStr;

              return (
                <div
                  key={day}
                  onClick={() => { setSelectedDay(dateStr === selectedDay ? null : dateStr); }}
                  style={{
                    minHeight: '90px', cursor: 'pointer', padding: '8px',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-1)',
                    background: isToday ? 'var(--primary-soft)' : isSelected ? 'var(--bg-active)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ fontSize: '15px', fontWeight: 700, color: isToday ? 'var(--primary)' : 'var(--text-2)', marginBottom: '6px' }}>
                    {day}
                  </div>
                  {count > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--red)', marginBottom: '4px' }}>{count} tender</div>
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {Array.from({ length: Math.min(count, 5) }).map((_, j) => (
                          <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} />
                        ))}
                        {count > 5 && <span style={{ fontSize: '9px', color: 'var(--text-4)' }}>+{count - 5}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>
                <Calendar size={16} style={{ display: 'inline', marginRight: '8px' }} />
                {selectedDay}
              </h3>
              <button className="btn-icon" onClick={() => setSelectedDay(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '24px', textAlign: 'center' }}>
              {dateCounts[selectedDay] ? (
                <>
                  <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--red)' }}>{dateCounts[selectedDay]}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-3)', marginTop: '8px' }}>ta tender muddati tugaydi</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '16px', padding: '10px', background: 'var(--bg-0)', borderRadius: '8px' }}>
                    Batafsil ko'rish uchun Tenderlar sahifasidan foydalaning
                  </div>
                </>
              ) : (
                <>
                  <Calendar size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p style={{ color: 'var(--text-4)' }}>Bu kunda tender muddati yo'q</p>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedDay(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
