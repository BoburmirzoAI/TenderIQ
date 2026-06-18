import { useState } from 'react';
import { Calculator, TrendingUp, Shield, DollarSign, BarChart3 } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface CalcResult {
  recommendedPrice: number;
  winProbability: number;
  riskScore: number;
  priceMin: number;
  priceMax: number;
}

interface HistoricalTender {
  id: number;
  title: string;
  category: string;
  region: string;
  winningAmount: number;
  bidCount: number;
  date: string;
}

const categories = ['IT', 'Qurilish', 'Tibbiyot', 'Transport', 'Ta\'lim', 'Oziq-ovqat', 'Energetika'];
const regions = ['Toshkent', 'Samarqand', 'Buxoro', 'Farg\'ona', 'Andijon', 'Navoiy', 'Namangan'];
const competitionLevels = [
  { key: 'low', label: 'Past', description: '1-3 ishtirokchi' },
  { key: 'medium', label: 'O\'rta', description: '4-8 ishtirokchi' },
  { key: 'high', label: 'Yuqori', description: '9+ ishtirokchi' },
];

const historicalTenders: HistoricalTender[] = [
  { id: 1, title: 'IT uskunalar tenderi', category: 'IT', region: 'Toshkent', winningAmount: 420000000, bidCount: 5, date: '2026-05-15' },
  { id: 2, title: 'Server jihozlari', category: 'IT', region: 'Toshkent', winningAmount: 750000000, bidCount: 3, date: '2026-04-20' },
  { id: 3, title: 'Tarmoq infratuzilmasi', category: 'IT', region: 'Samarqand', winningAmount: 380000000, bidCount: 7, date: '2026-03-10' },
  { id: 4, title: 'Qurilish materiallari', category: 'Qurilish', region: 'Toshkent', winningAmount: 1100000000, bidCount: 4, date: '2026-05-28' },
  { id: 5, title: 'Yo\'l ta\'mirlash', category: 'Qurilish', region: 'Navoiy', winningAmount: 3200000000, bidCount: 6, date: '2026-04-05' },
  { id: 6, title: 'Dori vositalari', category: 'Tibbiyot', region: 'Buxoro', winningAmount: 290000000, bidCount: 8, date: '2026-05-01' },
  { id: 7, title: 'Tibbiy asboblar', category: 'Tibbiyot', region: 'Toshkent', winningAmount: 510000000, bidCount: 4, date: '2026-03-22' },
  { id: 8, title: 'Transport xizmatlari', category: 'Transport', region: 'Farg\'ona', winningAmount: 82000000, bidCount: 9, date: '2026-04-15' },
];

const fmtAmount = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} mln`;
  return n.toLocaleString();
};

export default function PriceCalculator() {
  const { addToast } = useAdmin();
  const [category, setCategory] = useState('IT');
  const [region, setRegion] = useState('Toshkent');
  const [estimatedAmount, setEstimatedAmount] = useState('500');
  const [competition, setCompetition] = useState('medium');
  const [result, setResult] = useState<CalcResult | null>(null);

  const calculate = () => {
    const base = Number(estimatedAmount);
    if (!base || base <= 0) {
      addToast('Xato', 'Summani to\'g\'ri kiriting', 'error');
      return;
    }
    const compFactor = competition === 'low' ? 0.95 : competition === 'medium' ? 0.88 : 0.82;
    const recommended = Math.round(base * compFactor);
    const winProb = competition === 'low' ? Math.floor(Math.random() * 15 + 70) : competition === 'medium' ? Math.floor(Math.random() * 15 + 50) : Math.floor(Math.random() * 15 + 35);
    const risk = competition === 'low' ? Math.floor(Math.random() * 10 + 15) : competition === 'medium' ? Math.floor(Math.random() * 15 + 35) : Math.floor(Math.random() * 15 + 55);
    setResult({
      recommendedPrice: recommended,
      winProbability: winProb,
      riskScore: risk,
      priceMin: Math.round(recommended * 0.9),
      priceMax: Math.round(recommended * 1.1),
    });
    addToast('Hisoblandi', 'Narx tavsiyasi tayyor', 'success');
  };

  const similarTenders = historicalTenders.filter(t => t.category === category).slice(0, 5);

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>Narx kalkulyatori</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Tender uchun optimal narx va taklif hisoblang</p>
        </div>
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="card-header"><h3><Calculator size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Parametrlar</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Kategoriya</label>
              <select className="input select" value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Hudud</label>
              <select className="input select" value={region} onChange={e => setRegion(e.target.value)}>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Taxminiy summa (mln so'm)</label>
              <input className="input" type="number" value={estimatedAmount} onChange={e => setEstimatedAmount(e.target.value)} placeholder="500" />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>Raqobat darajasi</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {competitionLevels.map(cl => (
                  <div
                    key={cl.key}
                    onClick={() => setCompetition(cl.key)}
                    className="card"
                    style={{
                      flex: 1, cursor: 'pointer', textAlign: 'center', padding: '12px',
                      border: competition === cl.key ? '2px solid var(--primary)' : undefined,
                      background: competition === cl.key ? 'var(--primary-soft)' : undefined,
                    }}
                  >
                    <strong style={{ fontSize: '13px', display: 'block' }}>{cl.label}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{cl.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={calculate}>
              <Calculator size={14} /> Hisoblash
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Natija</h3></div>
          <div className="card-body">
            {result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="stat-card" style={{ background: 'var(--green-soft)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                  <DollarSign size={24} style={{ color: 'var(--green)', marginBottom: '4px' }} />
                  <span className="stat-label">Tavsiya etilgan narx</span>
                  <div className="stat-value" style={{ color: 'var(--green)' }}>{fmtAmount(result.recommendedPrice * 1e6)} so'm</div>
                </div>
                <div className="grid-2">
                  <div className="stat-card" style={{ background: 'var(--blue-soft)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <TrendingUp size={18} style={{ color: 'var(--blue)', marginBottom: '4px' }} />
                    <span className="stat-label">G'alaba ehtimoli</span>
                    <div className="stat-value" style={{ fontSize: '20px', color: result.winProbability >= 60 ? 'var(--green)' : 'var(--yellow)' }}>
                      {result.winProbability}%
                    </div>
                  </div>
                  <div className="stat-card" style={{ background: 'var(--orange-soft)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <Shield size={18} style={{ color: 'var(--orange)', marginBottom: '4px' }} />
                    <span className="stat-label">Risk bali</span>
                    <div className="stat-value" style={{ fontSize: '20px', color: result.riskScore >= 50 ? 'var(--red)' : 'var(--green)' }}>
                      {result.riskScore}/100
                    </div>
                  </div>
                </div>
                <div className="stat-card" style={{ background: 'var(--purple-soft)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <BarChart3 size={18} style={{ color: 'var(--purple)', marginBottom: '4px' }} />
                  <span className="stat-label">Narx oralig'i</span>
                  <div className="stat-value" style={{ fontSize: '16px', color: 'var(--purple)' }}>
                    {fmtAmount(result.priceMin * 1e6)} — {fmtAmount(result.priceMax * 1e6)} so'm
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-4)' }}>
                <Calculator size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p>Parametrlarni kiriting va "Hisoblash" tugmasini bosing</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>O'xshash tenderlar tarixi ({category})</h3></div>
        {similarTenders.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tender</th>
                  <th>Hudud</th>
                  <th>G'olib summasi</th>
                  <th>Takliflar soni</th>
                  <th>Sana</th>
                </tr>
              </thead>
              <tbody>
                {similarTenders.map(t => (
                  <tr key={t.id}>
                    <td><strong style={{ fontSize: '13px' }}>{t.title}</strong></td>
                    <td><span className="badge badge-primary">{t.region}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--green)' }}>{fmtAmount(t.winningAmount)} so'm</td>
                    <td><span className="badge badge-blue">{t.bidCount} ta</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--text-4)' }}>{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card-body" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-4)' }}>
            Bu kategoriyada tarixiy ma'lumot mavjud emas
          </div>
        )}
      </div>
    </div>
  );
}
