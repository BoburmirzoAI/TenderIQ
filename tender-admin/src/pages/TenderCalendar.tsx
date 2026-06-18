import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface CalendarTender {
  id: number;
  title: string;
  organization: string;
  amount: number;
  deadline: string;
  category: string;
  status: 'active' | 'closed' | 'awarded';
  source?: string;
  description?: string;
}

const mockTenders: CalendarTender[] = [
  { id: 1, title: 'IT uskunalarni yetkazib berish', organization: 'Toshkent hokimligi', amount: 450000000, deadline: '2026-06-05', category: 'IT', status: 'closed', source: 'tender.uz', description: 'Toshkent shahri uchun zamonaviy IT uskunalar yetkazib berish tenderi.' },
  { id: 2, title: 'Binoni ta\'mirlash ishlari', organization: 'Samarqand viloyati', amount: 1200000000, deadline: '2026-06-08', category: 'Qurilish', status: 'closed', source: 'xarid.uz', description: 'Samarqand viloyati hokimligi binosini ta\'mirlash.' },
  { id: 3, title: 'Dori vositalari sotib olish', organization: 'Sog\'liqni saqlash', amount: 320000000, deadline: '2026-06-10', category: 'Tibbiyot', status: 'closed', source: 'tender.uz', description: 'Respublika kassonalari uchun dori vositalari sotib olish.' },
  { id: 4, title: 'Transport xizmatlari', organization: 'Transport vazirligi', amount: 89000000, deadline: '2026-06-12', category: 'Transport', status: 'active', source: 'tender.uz', description: 'Shahar ichki transport xizmatlarini tashkil etish.' },
  { id: 5, title: 'Server va tarmoq jihozlari', organization: 'Raqamli texnologiyalar', amount: 780000000, deadline: '2026-06-15', category: 'IT', status: 'active', source: 'xarid.uz', description: 'Davlat tashkilotlari uchun server infratuzilmasini modernizatsiya qilish.' },
  { id: 6, title: 'Maktab inventari yetkazish', organization: 'Ta\'lim vazirligi', amount: 156000000, deadline: '2026-06-15', category: 'Ta\'lim', status: 'active', source: 'tender.uz', description: 'Umumta\'lim maktablari uchun yangi inventar va jihozlar.' },
  { id: 7, title: 'Yo\'l ta\'mirlash loyihasi', organization: 'Navoiy hokimligi', amount: 3500000000, deadline: '2026-06-18', category: 'Qurilish', status: 'active', source: 'xarid.uz', description: 'Navoiy shahridagi asosiy ko\'chalar va yo\'llarni ta\'mirlash.' },
  { id: 8, title: 'Oziq-ovqat yetkazib berish', organization: 'Mudofaa vazirligi', amount: 210000000, deadline: '2026-06-20', category: 'Oziq-ovqat', status: 'active', source: 'tender.uz', description: 'Harbiy qismlar uchun oziq-ovqat mahsulotlarini yetkazib berish.' },
  { id: 9, title: 'Laboratoriya uskunalari', organization: 'Fanlar akademiyasi', amount: 680000000, deadline: '2026-06-22', category: 'Tibbiyot', status: 'active', source: 'xarid.uz', description: 'Ilmiy tadqiqot laboratoriyalari uchun zamonaviy uskunalar.' },
  { id: 10, title: 'Ofis jihozlari tenderi', organization: 'Soliq qo\'mitasi', amount: 95000000, deadline: '2026-06-22', category: 'IT', status: 'active', source: 'tender.uz', description: 'Markaziy ofis uchun mebel va jihozlar sotib olish.' },
  { id: 11, title: 'Avtomobil sotib olish', organization: 'IIV', amount: 890000000, deadline: '2026-06-25', category: 'Transport', status: 'active', source: 'xarid.uz', description: 'Ichki ishlar vazirligi uchun xizmat avtomobillari.' },
  { id: 12, title: 'Elektr jihozlari', organization: 'Energetika vazirligi', amount: 310000000, deadline: '2026-06-25', category: 'Energetika', status: 'active', source: 'tender.uz', description: 'Elektr taqsimlovchi qurilmalar va uskunalar.' },
  { id: 13, title: 'Qurilish materiallari', organization: 'Qurilish vazirligi', amount: 540000000, deadline: '2026-06-28', category: 'Qurilish', status: 'active', source: 'xarid.uz', description: 'Davlat qurilish loyihalari uchun materiallar.' },
  { id: 14, title: 'Tibbiy asboblar', organization: 'Tibbiyot markazi', amount: 420000000, deadline: '2026-06-30', category: 'Tibbiyot', status: 'active', source: 'tender.uz', description: 'Tibbiyot muassasalari uchun zamonaviy tibbiy asboblar.' },
];

const fmtAmount = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} mln`;
  return n.toLocaleString();
};

const statusBadge = (s: string) => {
  const cls = s === 'active' ? 'badge-green' : s === 'closed' ? 'badge-red' : 'badge-purple';
  const label = s === 'active' ? 'Faol' : s === 'closed' ? 'Yopilgan' : 'G\'olib aniqlangan';
  return <span className={`badge ${cls}`}>{label}</span>;
};

const categoryColor: Record<string, string> = {
  IT: 'var(--blue)', Qurilish: 'var(--orange)', Tibbiyot: 'var(--green)',
  Transport: 'var(--purple)', 'Ta\'lim': 'var(--teal)', 'Oziq-ovqat': 'var(--yellow)',
  Energetika: 'var(--red)',
};

const WEEKDAYS = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];

export default function TenderCalendar() {
  const { addToast } = useAdmin();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5); // June = 5 (0-indexed)
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [detailTender, setDetailTender] = useState<CalendarTender | null>(null);

  const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setDayModalDate(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setDayModalDate(null);
  };

  const getTendersForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return mockTenders.filter(t => t.deadline === dateStr);
  };

  const dayModalTenders = dayModalDate ? mockTenders.filter(t => t.deadline === dayModalDate) : [];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTenders = getTendersForDay(day);
    setDayModalDate(dateStr);
    if (dayTenders.length > 0) {
      addToast('Tanlandi', `${dayTenders.length} ta tender`, 'info');
    }
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Tender Kalendari</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Tenderlar muddatlarini kalendarda ko'ring</p>
        </div>
      </div>

      <div className="card mb-24">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn-sm" onClick={prevMonth}><ChevronLeft size={16} /></button>
          <h3 style={{ fontSize: '18px' }}>{monthNames[month]} {year}</h3>
          <button className="btn btn-sm" onClick={nextMonth}><ChevronRight size={16} /></button>
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
                return (
                  <div
                    key={`empty-${i}`}
                    style={{
                      minHeight: '100px',
                      border: '1px solid var(--border-1)',
                      background: 'var(--bg-1)',
                    }}
                  />
                );
              }
              const dayTenders = getTendersForDay(day);
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dayModalDate === dateStr;
              const isToday = dateStr === '2026-06-17';
              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  style={{
                    minHeight: '100px',
                    cursor: 'pointer',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-1)',
                    background: isToday ? 'var(--primary-soft)' : isSelected ? 'var(--bg-1)' : 'transparent',
                    transition: 'background 0.15s',
                    padding: '8px',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 700, color: isToday ? 'var(--primary)' : 'var(--text-2)', marginBottom: '6px' }}>
                    {day}
                  </div>
                  {dayTenders.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '4px' }}>
                        {dayTenders.length} tender
                      </div>
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {dayTenders.map(t => (
                          <div key={t.id} style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: categoryColor[t.category] || 'var(--text-4)',
                          }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Modal — list of tenders for selected day */}
      {dayModalDate && (
        <div className="modal-overlay" onClick={() => setDayModalDate(null)}>
          <div className="modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>
                {dayModalDate} — {dayModalTenders.length} ta tender
              </h3>
              <button className="btn-icon" onClick={() => setDayModalDate(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {dayModalTenders.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dayModalTenders.map(t => (
                    <div
                      key={t.id}
                      onClick={() => { setDayModalDate(null); setDetailTender(t); }}
                      style={{
                        padding: '14px 16px',
                        border: '1px solid var(--border-1)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'var(--bg-1)',
                        transition: 'border-color 0.15s',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-0)', fontSize: '14px', marginBottom: '4px' }}>{t.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{t.organization}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-0)', fontSize: '13px' }}>{fmtAmount(t.amount)} so'm</div>
                        <div style={{ marginTop: '4px' }}>{statusBadge(t.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-4)' }}>
                  <Calendar size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                  <p>Bu kunga tender mavjud emas</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDayModalDate(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}

      {/* Tender Detail Modal */}
      {detailTender && (
        <div className="modal-overlay" onClick={() => setDetailTender(null)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Tender #{detailTender.id}</h3>
              <button className="btn-icon" onClick={() => setDetailTender(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-0)', marginBottom: '8px' }}>{detailTender.title}</h4>
                {detailTender.description && (
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.5' }}>{detailTender.description}</p>
                )}
              </div>
              <div className="grid-2" style={{ gap: '16px' }}>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Tashkilot</span><div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{detailTender.organization}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Summa</span><div style={{ fontWeight: 700, color: 'var(--text-0)' }}>{fmtAmount(detailTender.amount)} so'm</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Muddat</span><div style={{ color: 'var(--text-1)' }}>{detailTender.deadline}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Holat</span><div>{statusBadge(detailTender.status)}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Kategoriya</span><div><span className="badge badge-primary">{detailTender.category}</span></div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Manba</span><div style={{ color: 'var(--text-1)' }}>{detailTender.source || '—'}</div></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailTender(null)}>Yopish</button>
              <button className="btn btn-primary" onClick={() => { setDetailTender(null); setDayModalDate(detailTender.deadline); }}>
                Shu kunga qaytish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
