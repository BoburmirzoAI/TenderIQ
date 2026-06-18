import { useState } from 'react';
import { Brain, BarChart3, Calculator, TrendingUp, Cpu, X, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';

interface Prediction {
  id: number;
  type: 'price' | 'win' | 'risk' | 'similarity';
  user: string;
  tender: string;
  result: string;
  confidence: number;
  createdAt: string;
}

interface AIPredictionDetail {
  id: number;
  tenderName: string;
  winProbability: number;
  confidenceScore: number;
  predictedPriceMin: number;
  predictedPriceMax: number;
  recommendation: 'apply' | 'skip';
  date: string;
  reasoning: string;
  factors: string[];
  riskLevel: 'low' | 'medium' | 'high';
  riskNotes: string;
}

const mockPredictions: Prediction[] = [
  { id: 1, type: 'price', user: 'Bobur S.', tender: 'IT uskunalarni yetkazib berish', result: '420-480 mln', confidence: 87, createdAt: '2026-06-17 14:30' },
  { id: 2, type: 'win', user: 'Jasur K.', tender: 'Binoni ta\'mirlash', result: '72% ehtimollik', confidence: 82, createdAt: '2026-06-17 13:15' },
  { id: 3, type: 'risk', user: 'Dilnoza R.', tender: 'Dori vositalari', result: 'O\'rta risk', confidence: 75, createdAt: '2026-06-17 12:00' },
  { id: 4, type: 'similarity', user: 'Aziz T.', tender: 'Transport xizmatlari', result: '5 ta o\'xshash tender', confidence: 91, createdAt: '2026-06-17 10:45' },
  { id: 5, type: 'price', user: 'Nodira Y.', tender: 'Server jihozlari', result: '750-820 mln', confidence: 84, createdAt: '2026-06-16 16:20' },
  { id: 6, type: 'win', user: 'Sherzod U.', tender: 'Yo\'l ta\'mirlash', result: '45% ehtimollik', confidence: 68, createdAt: '2026-06-16 15:00' },
  { id: 7, type: 'risk', user: 'Malika N.', tender: 'Maktab inventari', result: 'Past risk', confidence: 88, createdAt: '2026-06-16 13:30' },
  { id: 8, type: 'price', user: 'Otabek M.', tender: 'Oziq-ovqat yetkazish', result: '195-230 mln', confidence: 79, createdAt: '2026-06-16 11:00' },
  { id: 9, type: 'similarity', user: 'Bobur S.', tender: 'Laboratoriya uskunalari', result: '3 ta o\'xshash tender', confidence: 85, createdAt: '2026-06-15 17:45' },
  { id: 10, type: 'win', user: 'Jasur K.', tender: 'Ofis jihozlari', result: '58% ehtimollik', confidence: 71, createdAt: '2026-06-15 14:30' },
  { id: 11, type: 'risk', user: 'Aziz T.', tender: 'Qurilish materiallari', result: 'Yuqori risk', confidence: 92, createdAt: '2026-06-15 12:00' },
  { id: 12, type: 'price', user: 'Dilnoza R.', tender: 'Elektr jihozlari', result: '310-360 mln', confidence: 81, createdAt: '2026-06-14 16:15' },
  { id: 13, type: 'win', user: 'Nodira Y.', tender: 'Tibbiy asboblar', result: '83% ehtimollik', confidence: 86, createdAt: '2026-06-14 14:00' },
  { id: 14, type: 'similarity', user: 'Sherzod U.', tender: 'Suv ta\'minoti', result: '7 ta o\'xshash tender', confidence: 93, createdAt: '2026-06-14 10:30' },
  { id: 15, type: 'price', user: 'Malika N.', tender: 'Avtomobil sotib olish', result: '890-950 mln', confidence: 76, createdAt: '2026-06-13 15:45' },
];

const detailedPredictions: AIPredictionDetail[] = [
  { id: 1, tenderName: 'IT uskunalarni yetkazib berish — Toshkent shahar', winProbability: 78, confidenceScore: 87, predictedPriceMin: 420000000, predictedPriceMax: 480000000, recommendation: 'apply', date: '2026-06-17', reasoning: 'Ushbu tender uchun tahlil qilingan 42 ta o\'xshash tender asosida narx oralig\'i aniqlandi. Tarixiy ma\'lumotlar shuni ko\'rsatadiki, IT uskunalar bo\'yicha Toshkent shahridagi tenderlar o\'rtacha 450M so\'m atrofida yopiladi.', factors: ['42 ta tarixiy tender tahlili', 'Bozor narxi indeksi: +3.2%', 'Mavsum koeffitsienti: 1.05', 'Raqobatchilar soni: o\'rta (4-6 ta)', 'Texnik murakkablik: past'], riskLevel: 'low', riskNotes: 'Narx riski past. Yetkazib berish muddati risk omil bo\'lishi mumkin.' },
  { id: 2, tenderName: 'Binoni ta\'mirlash ishlari — Yunusobod tumani', winProbability: 72, confidenceScore: 82, predictedPriceMin: 1200000000, predictedPriceMax: 1400000000, recommendation: 'apply', date: '2026-06-17', reasoning: 'Qurilish sektoridagi 28 ta tender asosida g\'alaba ehtimoli 72% deb baholandi. Kompaniyaning oldingi qurilish tajribasi va mavjud mashina parki ijobiy ta\'sir ko\'rsatadi.', factors: ['28 ta qurilish tenderi tahlili', 'Kompaniya tajribasi: yuqori', 'Sertifikatlar: to\'liq', 'Raqobatchilar: 3 ta asosiy', 'Narx raqobatbardoshligi: yaxshi'], riskLevel: 'medium', riskNotes: 'Raqobatchi BuildMax past narx bilan kelishi mumkin. Texnik ball muhim bo\'ladi.' },
  { id: 3, tenderName: 'Dori vositalari sotib olish — Respublika buyurtmasi', winProbability: 55, confidenceScore: 75, predictedPriceMin: 280000000, predictedPriceMax: 320000000, recommendation: 'skip', date: '2026-06-17', reasoning: 'Dori vositalari tenderida litsenziya va sertifikat talablari juda qattiq. Mavjud hujjatlar 3 ta asosiy talabni qoplamasligini ko\'rsatmoqda.', factors: ['Litsenziya muddati: 8 oy qolgan', 'GMP sertifikati: yo\'q', 'Raqobatchilar: 8 ta', 'Import kvotasi: cheklangan', 'Texnik talab: yuqori'], riskLevel: 'high', riskNotes: 'GMP sertifikatisiz g\'alaba imkoniyati past. Keyingi tenderga tayyorgarlik ko\'rish tavsiya etiladi.' },
  { id: 4, tenderName: 'Transport xizmatlari — Samarqand yo\'nalishlari', winProbability: 65, confidenceScore: 91, predictedPriceMin: 85000000, predictedPriceMax: 95000000, recommendation: 'apply', date: '2026-06-17', reasoning: '7 ta o\'xshash transport tenderi topildi. Narx oralig\'i va g\'alaba ehtimoli yuqori ishonch bilan bashorat qilindi.', factors: ['7 ta o\'xshash tender', 'Marshrut mos kelishi: 94%', 'Mashina parki: yetarli', 'Narx raqobatbardoshligi: yuqori', 'Tajriba: 3 yil'], riskLevel: 'low', riskNotes: 'Yoqilg\'i narxi o\'zgarishi kichik risk tug\'dirishi mumkin.' },
  { id: 5, tenderName: 'Server va tarmoq jihozlari — Davlat idorasi', winProbability: 81, confidenceScore: 84, predictedPriceMin: 750000000, predictedPriceMax: 820000000, recommendation: 'apply', date: '2026-06-16', reasoning: 'IT infratuzilma sektorida kompaniyaning kuchli pozitsiyasi mavjud. Cisco va Dell partnerligi asosiy ustunlik beradi.', factors: ['ISO 27001 sertifikati', 'Cisco Premier Partner', 'Dell Authorized Reseller', 'Texnik xodimlar: 12 ta sertifikatlangan', 'Avvalgi davlat loyihalari: 5 ta'], riskLevel: 'low', riskNotes: 'Past risk. Yagona muammo — tovar yetkazib berish muddati (16 hafta).' },
  { id: 6, tenderName: 'Yo\'l ta\'mirlash loyihasi — Chilonzor', winProbability: 45, confidenceScore: 68, predictedPriceMin: 3200000000, predictedPriceMax: 3500000000, recommendation: 'skip', date: '2026-06-16', reasoning: 'Katta qurilish loyihalari uchun tajriba ko\'rsatkichlari yetarli emas. Raqobatchilar portfeli ancha kuchli.', factors: ['Talab: 5 yillik tajriba', 'Mavjud tajriba: 2 yil', 'Kapital: cheklangan', 'Raqobatchilar: kuchli', 'Garov miqdori: 10%'], riskLevel: 'high', riskNotes: 'Tajriba va kapital talablari bajarilmaydi. Skip tavsiya etiladi.' },
  { id: 7, tenderName: 'Maktab inventari yetkazish — 50 ta maktab', winProbability: 88, confidenceScore: 88, predictedPriceMin: 145000000, predictedPriceMax: 168000000, recommendation: 'apply', date: '2026-06-16', reasoning: 'Ta\'lim sektori tender tahlili ijobiy natija ko\'rsatmoqda. Mahalliy ishlab chiqaruvchi sifatida ustunlik mavjud.', factors: ['Mahalliy ishlab chiqaruvchi imtiyozi', 'Avvalgi ta\'lim loyihasi tajribasi', 'Narx raqobatbardoshligi: yuqori', 'Sifat sertifikatlari: to\'liq', 'Yetkazib berish tarmog\'i: kuchli'], riskLevel: 'low', riskNotes: 'Juda past risk. G\'alaba ehtimoli yuqori.' },
  { id: 8, tenderName: 'Oziq-ovqat yetkazib berish — Kasalxona kompleksi', winProbability: 62, confidenceScore: 79, predictedPriceMin: 195000000, predictedPriceMax: 230000000, recommendation: 'apply', date: '2026-06-16', reasoning: 'Oziq-ovqat yetkazish sohasi o\'rta darajali raqobat muhitini ko\'rsatadi. Sanitariya sertifikatlari va sovutish tizimi mavjudligi afzallik beradi.', factors: ['Sanitariya sertifikati: mavjud', 'Sovutish transporti: 3 ta', 'HACCP sertifikati: mavjud', 'Avvalgi tacriba: 2 loyiha', 'Narx: bozor o\'rtasidan 5% past'], riskLevel: 'medium', riskNotes: 'Yangi raqiblar kirib kelishi mumkin. Narx chegarasiga diqqat.' },
];

const usageByDay = [
  { day: '11-iyun', count: 12 }, { day: '12-iyun', count: 18 }, { day: '13-iyun', count: 8 },
  { day: '14-iyun', count: 22 }, { day: '15-iyun', count: 15 }, { day: '16-iyun', count: 28 },
  { day: '17-iyun', count: 35 },
];

const usageByType = [
  { name: 'Narx bashorat', value: 42, color: 'var(--blue)' },
  { name: 'G\'alaba ehtimoli', value: 28, color: 'var(--green)' },
  { name: 'Risk baholash', value: 18, color: 'var(--orange)' },
  { name: 'O\'xshashlik', value: 12, color: 'var(--purple)' },
];

const topUsers = [
  { name: 'Bobur S.', usage: 45 }, { name: 'Jasur K.', usage: 38 },
  { name: 'Aziz T.', usage: 32 }, { name: 'Dilnoza R.', usage: 28 },
  { name: 'Nodira Y.', usage: 22 },
];

const typeBadge = (type: string) => {
  const cls = type === 'price' ? 'badge-blue' : type === 'win' ? 'badge-green' : type === 'risk' ? 'badge-yellow' : 'badge-purple';
  const label = type === 'price' ? 'Narx' : type === 'win' ? 'G\'alaba' : type === 'risk' ? 'Risk' : 'O\'xshashlik';
  return <span className={`badge ${cls}`}>{label}</span>;
};

const fmtAmount = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${Math.round(n / 1e6).toLocaleString('ru-RU')} mln`;
  return n.toLocaleString('ru-RU');
};

const categories = ['IT', 'Qurilish', 'Tibbiyot', 'Transport', 'Ta\'lim', 'Oziq-ovqat'];
const regions = ['Toshkent', 'Samarqand', 'Buxoro', 'Farg\'ona', 'Andijon', 'Navoiy', 'Namangan'];

const tdStyle: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };

export default function AIModels() {
  const { addToast } = useAdmin();
  const [tab, setTab] = useState<'bashoratlar' | 'history' | 'stats' | 'predict'>('bashoratlar');
  const [filterType, setFilterType] = useState('all');
  const [predCategory, setPredCategory] = useState('IT');
  const [predRegion, setPredRegion] = useState('Toshkent');
  const [predAmountMin, setPredAmountMin] = useState('100');
  const [predAmountMax, setPredAmountMax] = useState('500');
  const [predResult, setPredResult] = useState<{ price: string; range: string; confidence: number } | null>(null);
  const [selectedPredDetail, setSelectedPredDetail] = useState<AIPredictionDetail | null>(null);

  const filtered = mockPredictions.filter(p => filterType === 'all' || p.type === filterType);

  const runPrediction = () => {
    const basePrice = Math.floor(Math.random() * 300 + 200);
    setPredResult({
      price: `${basePrice} mln so'm`,
      range: `${basePrice - 40}–${basePrice + 40} mln`,
      confidence: Math.floor(Math.random() * 15 + 78),
    });
    addToast('Bashorat', 'Narx bashorati muvaffaqiyatli bajarildi', 'success');
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>AI Bashoratlar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>AI bashorat natijalari va foydalanish statistikasi</p>
        </div>
      </div>

      <div className="tabs mb-24">
        <button className={`tab ${tab === 'bashoratlar' ? 'active' : ''}`} onClick={() => setTab('bashoratlar')}>
          <TrendingUp size={14} /> Bashoratlar
        </button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          <Brain size={14} /> Bashoratlar tarixi
        </button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          <BarChart3 size={14} /> Foydalanish statistikasi
        </button>
        <button className={`tab ${tab === 'predict' ? 'active' : ''}`} onClick={() => setTab('predict')}>
          <Calculator size={14} /> Narx bashorat
        </button>
      </div>

      {/* ---- BASHORATLAR TAB ---- */}
      {tab === 'bashoratlar' && (
        <>
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>So'nggi AI bashoratlar</h3>
            </div>
            <div className="table-wrap">
              <table className="table" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: '200px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '200px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '100px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={tdStyle}>Tender nomi</th>
                    <th style={tdStyle}>G'alaba ehtimoli</th>
                    <th style={tdStyle}>Ishonch darajasi</th>
                    <th style={tdStyle}>Narx oralig'i</th>
                    <th style={tdStyle}>Tavsiya</th>
                    <th style={tdStyle}>Sana</th>
                    <th style={tdStyle}>Batafsil</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedPredictions.map((pred) => (
                    <tr
                      key={pred.id}
                      style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onClick={() => setSelectedPredDetail(pred)}
                    >
                      <td style={{ ...tdStyle, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pred.tenderName}</td>
                      <td style={tdStyle}>
                        <span className={`badge ${pred.winProbability >= 70 ? 'badge-green' : pred.winProbability >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                          {pred.winProbability}%
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span className={`badge ${pred.confidenceScore >= 85 ? 'badge-green' : pred.confidenceScore >= 70 ? 'badge-yellow' : 'badge-red'}`}>
                          {pred.confidenceScore}%
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '13px' }}>
                        {fmtAmount(pred.predictedPriceMin)} – {fmtAmount(pred.predictedPriceMax)}
                      </td>
                      <td style={tdStyle}>
                        <span className={`badge ${pred.recommendation === 'apply' ? 'badge-green' : 'badge-red'}`}>
                          {pred.recommendation === 'apply' ? 'Ariza topshir' : 'O\'tkazib yubor'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-4)' }}>{pred.date}</td>
                      <td style={tdStyle}>
                        <button className="btn btn-sm btn-ghost">
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Prediction Detail Modal */}
          {selectedPredDetail && (
            <div className="modal-overlay" onClick={() => setSelectedPredDetail(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-0)', flex: 1, paddingRight: '12px' }}>{selectedPredDetail.tenderName}</h2>
                  <button className="btn btn-sm btn-ghost" onClick={() => setSelectedPredDetail(null)}><X size={14} /></button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Stats row */}
                  <div className="grid-4" style={{ gap: '12px' }}>
                    <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '14px', textAlign: 'center', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '6px' }}>G'alaba ehtimoli</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: selectedPredDetail.winProbability >= 70 ? 'var(--green)' : selectedPredDetail.winProbability >= 50 ? 'var(--yellow)' : 'var(--red)' }}>
                        {selectedPredDetail.winProbability}%
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '14px', textAlign: 'center', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '6px' }}>Ishonch darajasi</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--blue)' }}>{selectedPredDetail.confidenceScore}%</div>
                    </div>
                    <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '14px', textAlign: 'center', border: '1px solid var(--border)', gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '6px' }}>Narx oralig'i</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)' }}>
                        {fmtAmount(selectedPredDetail.predictedPriceMin)} – {fmtAmount(selectedPredDetail.predictedPriceMax)}
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: '13px' }}>Tavsiya:</span>
                    <span className={`badge ${selectedPredDetail.recommendation === 'apply' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '13px', padding: '4px 12px' }}>
                      {selectedPredDetail.recommendation === 'apply' ? 'Ariza topshirish tavsiya etiladi' : 'O\'tkazib yuborish tavsiya etiladi'}
                    </span>
                  </div>

                  {/* Reasoning */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-0)', marginBottom: '8px' }}>AI Tahlil (Reasoning)</h4>
                    <div style={{ background: 'var(--bg-1)', borderRadius: '8px', padding: '14px', fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6', border: '1px solid var(--border)' }}>
                      {selectedPredDetail.reasoning}
                    </div>
                  </div>

                  {/* Factors */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-0)', marginBottom: '10px' }}>Hisobga olingan omillar</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedPredDetail.factors.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-2)' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-0)', marginBottom: '8px' }}>Risk baholash</h4>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--bg-1)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border)' }}>
                      <span className={`badge ${selectedPredDetail.riskLevel === 'low' ? 'badge-green' : selectedPredDetail.riskLevel === 'medium' ? 'badge-yellow' : 'badge-red'}`} style={{ flexShrink: 0 }}>
                        {selectedPredDetail.riskLevel === 'low' ? 'Past risk' : selectedPredDetail.riskLevel === 'medium' ? 'O\'rta risk' : 'Yuqori risk'}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.5' }}>{selectedPredDetail.riskNotes}</span>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => setSelectedPredDetail(null)}>Yopish</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ---- HISTORY TAB ---- */}
      {tab === 'history' && (
        <>
          <div className="card mb-24">
            <div className="card-body" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select className="input select" style={{ width: '180px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">Barcha turlar</option>
                <option value="price">Narx bashorat</option>
                <option value="win">G'alaba ehtimoli</option>
                <option value="risk">Risk baholash</option>
                <option value="similarity">O'xshashlik</option>
              </select>
              <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>{filtered.length} ta natija</span>
            </div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={tdStyle}>ID</th>
                    <th style={tdStyle}>Turi</th>
                    <th style={tdStyle}>Foydalanuvchi</th>
                    <th style={tdStyle}>Tender</th>
                    <th style={tdStyle}>Natija</th>
                    <th style={tdStyle}>Ishonch</th>
                    <th style={tdStyle}>Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>#{p.id}</td>
                      <td style={tdStyle}>{typeBadge(p.type)}</td>
                      <td style={tdStyle}>{p.user}</td>
                      <td style={{ ...tdStyle }}><strong style={{ fontSize: '13px' }}>{p.tender}</strong></td>
                      <td style={{ ...tdStyle, fontSize: '13px' }}>{p.result}</td>
                      <td style={tdStyle}>
                        <span className={`badge ${p.confidence >= 85 ? 'badge-green' : p.confidence >= 70 ? 'badge-yellow' : 'badge-red'}`}>
                          {p.confidence}%
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-4)' }}>{p.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ---- STATS TAB ---- */}
      {tab === 'stats' && (
        <>
          <div className="grid-2 mb-24">
            <div className="card">
              <div className="card-header"><h3>Kunlik foydalanish</h3></div>
              <div className="card-body" style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageByDay}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3>Model turlari bo'yicha</h3></div>
              <div className="card-body" style={{ height: '280px', display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={usageByType} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={(props: any) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`}>
                      {usageByType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Top foydalanuvchilar</h3></div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={tdStyle}>#</th>
                    <th style={tdStyle}>Foydalanuvchi</th>
                    <th style={tdStyle}>So'rovlar soni</th>
                    <th style={tdStyle}>Ulush</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((u, i) => (
                    <tr key={u.name} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={tdStyle}><strong>{u.name}</strong></td>
                      <td style={tdStyle}>{u.usage}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-2)' }}>
                            <div style={{ width: `${(u.usage / 45) * 100}%`, height: '100%', borderRadius: 3, background: 'var(--primary)' }} />
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>{Math.round((u.usage / 165) * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ---- PREDICT TAB ---- */}
      {tab === 'predict' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3>Narx bashorat parametrlari</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Kategoriya</label>
                <select className="input select" value={predCategory} onChange={e => setPredCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Hudud</label>
                <select className="input select" value={predRegion} onChange={e => setPredRegion(e.target.value)}>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Min summa (mln)</label>
                  <input className="input" type="number" value={predAmountMin} onChange={e => setPredAmountMin(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Max summa (mln)</label>
                  <input className="input" type="number" value={predAmountMax} onChange={e => setPredAmountMax(e.target.value)} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={runPrediction}>
                <Cpu size={14} /> Bashorat qilish
              </button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Natija</h3></div>
            <div className="card-body">
              {predResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'var(--green-soft)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                    <span className="stat-label">Bashorat qilingan narx</span>
                    <div className="stat-value" style={{ color: 'var(--green)', marginTop: '8px' }}>{predResult.price}</div>
                  </div>
                  <div className="grid-2">
                    <div style={{ background: 'var(--blue-soft)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
                      <span className="stat-label">Narx oralig'i</span>
                      <div className="stat-value" style={{ fontSize: '16px', color: 'var(--blue)', marginTop: '8px' }}>{predResult.range}</div>
                    </div>
                    <div style={{ background: 'var(--purple-soft)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
                      <span className="stat-label">Ishonch darajasi</span>
                      <div className="stat-value" style={{ fontSize: '16px', color: 'var(--purple)', marginTop: '8px' }}>{predResult.confidence}%</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-4)', padding: '10px', background: 'var(--bg-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    Kategoriya: <strong>{predCategory}</strong> | Hudud: <strong>{predRegion}</strong> | Oraliq: <strong>{predAmountMin}–{predAmountMax} mln</strong>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)' }}>
                  <Brain size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p>Bashorat qilish uchun parametrlarni kiriting va tugmani bosing</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
