import { useState } from 'react';
import { MapPin, TrendingUp, DollarSign, ArrowLeft, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';

interface RegionData {
  name: string;
  count: number;
  totalAmount: number;
  growth: number;
}

interface RegionTender {
  id: number;
  title: string;
  amount: number;
  status: string;
  deadline: string;
  source?: string;
  description?: string;
}

const mockRegions: RegionData[] = [
  { name: 'Toshkent', count: 245, totalAmount: 82500, growth: 12.5 },
  { name: 'Samarqand', count: 187, totalAmount: 54300, growth: 8.3 },
  { name: 'Buxoro', count: 134, totalAmount: 41200, growth: -2.1 },
  { name: 'Farg\'ona', count: 156, totalAmount: 38700, growth: 15.7 },
  { name: 'Andijon', count: 142, totalAmount: 35600, growth: 6.4 },
  { name: 'Namangan', count: 128, totalAmount: 32100, growth: 4.2 },
  { name: 'Qashqadaryo', count: 98, totalAmount: 29800, growth: 11.0 },
  { name: 'Surxondaryo', count: 76, totalAmount: 21500, growth: -1.5 },
  { name: 'Navoiy', count: 89, totalAmount: 48200, growth: 22.3 },
  { name: 'Xorazm', count: 94, totalAmount: 26700, growth: 3.8 },
  { name: 'Jizzax', count: 67, totalAmount: 18400, growth: 7.1 },
  { name: 'Sirdaryo', count: 54, totalAmount: 14800, growth: -3.2 },
  { name: 'Toshkent viloyati', count: 178, totalAmount: 52600, growth: 9.6 },
  { name: 'Qoraqalpog\'iston', count: 63, totalAmount: 17300, growth: 5.5 },
];

const regionTenders: Record<string, RegionTender[]> = {
  'Toshkent': [
    { id: 1, title: 'IT uskunalarni yetkazib berish', amount: 450000000, status: 'active', deadline: '2026-06-25', source: 'tender.uz', description: 'Toshkent shahrining markaziy hokimligi uchun zamonaviy IT uskunalar.' },
    { id: 2, title: 'Server va tarmoq jihozlari', amount: 780000000, status: 'active', deadline: '2026-07-01', source: 'xarid.uz', description: 'Davlat tashkilotlari uchun server infratuzilmasini modernizatsiya qilish.' },
    { id: 3, title: 'Ofis jihozlari ta\'minoti', amount: 120000000, status: 'closed', deadline: '2026-06-10', source: 'tender.uz', description: 'Markaziy ofislar uchun mebel va jihozlar sotib olish.' },
  ],
  'Samarqand': [
    { id: 4, title: 'Binoni ta\'mirlash ishlari', amount: 1200000000, status: 'active', deadline: '2026-06-30', source: 'xarid.uz', description: 'Samarqand viloyati hokimligi bosh binosi ta\'mirlash ishlari.' },
    { id: 5, title: 'Muzey rekonstruksiyasi', amount: 2300000000, status: 'active', deadline: '2026-07-15', source: 'tender.uz', description: 'Afrosiyob muzeyi rekonstruksiyasi va modernizatsiyasi.' },
  ],
};

const fmtAmount = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} mln`;
  return n.toLocaleString();
};

const totalRegions = mockRegions.length;
const mostActive = mockRegions.reduce((a, b) => a.count > b.count ? a : b);
const highestValue = mockRegions.reduce((a, b) => a.totalAmount > b.totalAmount ? a : b);

export default function TenderMap() {
  const { addToast } = useAdmin();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [detailTender, setDetailTender] = useState<RegionTender | null>(null);

  const tenders = selectedRegion ? (regionTenders[selectedRegion] || []) : [];

  const handleRegionClick = (regionName: string) => {
    setSelectedRegion(regionName);
    addToast('Hudud tanlandi', `${regionName} hududiga o'tildi`, 'info');
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Tender xaritasi</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Hududlar bo'yicha tender taqsimoti</p>
        </div>
      </div>

      <div className="grid-3 mb-24">
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Jami hududlar</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={16} style={{ color: 'var(--blue)' }} />
            </div>
          </div>
          <div className="stat-value">{totalRegions}</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Eng faol hudud</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} style={{ color: 'var(--green)' }} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '18px' }}>{mostActive.name}</div>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{mostActive.count} ta tender</span>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Eng yuqori qiymat</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--orange-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} style={{ color: 'var(--orange)' }} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '18px' }}>{highestValue.name}</div>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{highestValue.totalAmount.toLocaleString()} mln</span>
        </div>
      </div>

      {selectedRegion ? (
        <div>
          <button className="btn mb-24" onClick={() => setSelectedRegion(null)}>
            <ArrowLeft size={14} /> Barcha hududlar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-0)' }}>
              {selectedRegion} tenderlari
            </h2>
            <span className="badge badge-blue">{tenders.length} ta</span>
          </div>
          {tenders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tenders.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setDetailTender(t)}
                  style={{
                    padding: '16px',
                    border: '1px solid var(--border-1)',
                    borderRadius: '8px',
                    marginBottom: '0',
                    cursor: 'pointer',
                    background: 'var(--bg-1)',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-0)', marginBottom: '6px' }}>
                      #{t.id} — {t.title}
                    </div>
                    {t.description && (
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '8px', lineHeight: '1.4' }}>{t.description}</div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>Muddat: {t.deadline}</span>
                      {t.source && <span className="badge badge-cyan" style={{ fontSize: '10px' }}>{t.source}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)', marginBottom: '6px' }}>
                      {fmtAmount(t.amount)} so'm
                    </div>
                    <span className={`badge ${t.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                      {t.status === 'active' ? 'Faol' : 'Yopilgan'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                Bu hudud uchun tender ma'lumotlari hali yuklanmagan
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {mockRegions.map((region) => (
              <div
                key={region.name}
                className="card"
                style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onClick={() => handleRegionClick(region.name)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                }}
              >
                <div className="card-body">
                  <div className="flex-between mb-8">
                    <span style={{ fontWeight: 700, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} style={{ color: 'var(--primary)' }} /> {region.name}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="badge badge-blue">{region.count}</span>
                      <span className={`badge ${region.growth >= 0 ? 'badge-green' : 'badge-red'}`}>
                        {region.growth >= 0 ? '+' : ''}{region.growth}%
                      </span>
                    </div>
                  </div>
                  <div className="grid-2" style={{ gap: '8px', marginTop: '12px' }}>
                    <div>
                      <span className="stat-label">Tenderlar</span>
                      <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-0)' }}>{region.count}</div>
                    </div>
                    <div>
                      <span className="stat-label">Jami summa</span>
                      <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-0)' }}>{(region.totalAmount / 1000).toFixed(1)} mlrd</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-0)' }}>Hududlar bo'yicha tender soni</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={mockRegions}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
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
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Summa</span><div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)' }}>{fmtAmount(detailTender.amount)} so'm</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Holat</span><div><span className={`badge ${detailTender.status === 'active' ? 'badge-green' : 'badge-red'}`}>{detailTender.status === 'active' ? 'Faol' : 'Yopilgan'}</span></div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Muddat</span><div style={{ color: 'var(--text-1)' }}>{detailTender.deadline}</div></div>
                <div><span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Manba</span><div style={{ color: 'var(--text-1)' }}>{detailTender.source || '—'}</div></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailTender(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
