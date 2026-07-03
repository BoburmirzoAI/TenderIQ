import { useState } from 'react';
import { Calculator, TrendingUp, Shield, DollarSign, BarChart3, RefreshCw, ExternalLink } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { aiModelsApi, api, type AIPriceEstimate } from '../api/admin';

const categories = ['IT', 'Qurilish', 'Tibbiyot', 'Transport', "Ta'lim", 'Oziq-ovqat', 'Energetika'];
const regions = ['Toshkent', 'Samarqand', 'Buxoro', "Farg'ona", 'Andijon', 'Navoiy', 'Namangan'];
const competitionLevels = [
  { key: 'low', label: 'Past', description: '1-3 ishtirokchi' },
  { key: 'medium', label: "O'rta", description: '4-8 ishtirokchi' },
  { key: 'high', label: 'Yuqori', description: '9+ ishtirokchi' },
];

interface SimilarTender { id: number; title: string; category?: string; region?: string; amount?: number; deadline?: string; status: string }

const fmtAmount = (n?: number) => {
  if (!n) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} mln`;
  return n.toLocaleString();
};

const winProb = (competition: string, confidence: number) => {
  const base = competition === 'low' ? 70 : competition === 'medium' ? 50 : 35;
  return Math.min(95, Math.round(base + confidence * 0.2));
};

const riskScore = (competition: string, sampleCount: number) => {
  const base = competition === 'low' ? 20 : competition === 'medium' ? 40 : 60;
  const adj = sampleCount >= 10 ? -10 : sampleCount >= 5 ? -5 : 5;
  return Math.max(5, Math.min(95, base + adj));
};

export default function PriceCalculator() {
  const { addToast, setActiveTab } = useAdmin();
  const [category, setCategory] = useState('IT');
  const [region, setRegion] = useState('Toshkent');
  const [estimatedAmount, setEstimatedAmount] = useState('500');
  const [competition, setCompetition] = useState('medium');
  const [result, setResult] = useState<AIPriceEstimate | null>(null);
  const [similar, setSimilar] = useState<SimilarTender[]>([]);
  const [calculating, setCalculating] = useState(false);

  const calculate = async () => {
    const base = Number(estimatedAmount);
    if (!base || base <= 0) { addToast('Xato', "Summani to'g'ri kiriting", 'error'); return; }
    setCalculating(true);
    try {
      const [estimate, tenderRes] = await Promise.all([
        aiModelsApi.predictPrice({ category, region, amount_min_mln: base * 0.5, amount_max_mln: base * 1.5 }),
        api.get<{ data: SimilarTender[] }>('/admin/tenders', { params: { category, page_size: 5 } }),
      ]);
      setResult(estimate);
      setSimilar(tenderRes.data.data ?? []);
      addToast('Hisoblandi', `${estimate.sample_count} ta tarixiy tender asosida`, 'success');
    } catch {
      addToast('Xatolik', "Hisoblashda xato yuz berdi", 'error');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Narx kalkulyatori</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Tender uchun optimal narx va taklif hisoblang</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.('pricing')}><ExternalLink size={13} /> Narx strategiya</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.('ai')}><ExternalLink size={13} /> AI bashorat</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'Analitika', tab: 'analytics', icon: BarChart3, color: 'var(--primary)' },
          { label: 'Tenderlar', tab: 'tenders', icon: TrendingUp, color: 'var(--teal)' },
          { label: 'Raqobatchilar', tab: 'competitors', icon: Shield, color: 'var(--yellow)' },
          { label: 'Win/Loss', tab: 'journal', icon: TrendingUp, color: 'var(--purple)' },
          { label: 'Hisobotlar', tab: 'reports', icon: BarChart3, color: 'var(--green)' },
          { label: 'Moliya', tab: 'financials', icon: DollarSign, color: 'var(--red)' },
        ].map(btn => (
          <button key={btn.label} className="btn btn-ghost btn-sm" onClick={() => setActiveTab?.(btn.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderColor: 'var(--border-1)' }}>
            <btn.icon size={13} style={{ color: btn.color }} /> {btn.label}
          </button>
        ))}
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={16} /> Parametrlar
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Kategoriya</label>
              <select className="input select" value={category} onChange={e => { setCategory(e.target.value); setResult(null); }}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Hudud</label>
              <select className="input select" value={region} onChange={e => { setRegion(e.target.value); setResult(null); }}>
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
                  <div key={cl.key} onClick={() => setCompetition(cl.key)} className="card"
                    style={{ flex: 1, cursor: 'pointer', textAlign: 'center', padding: '12px', border: competition === cl.key ? '2px solid var(--primary)' : undefined, background: competition === cl.key ? 'var(--primary-soft)' : undefined }}>
                    <strong style={{ fontSize: '13px', display: 'block' }}>{cl.label}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{cl.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={calculate} disabled={calculating}>
              {calculating ? <RefreshCw size={14} className="animate-spin" /> : <Calculator size={14} />} Hisoblash
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 style={{ fontWeight: 700 }}>Natija</h3></div>
          <div className="card-body">
            {result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--green-soft)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                  <DollarSign size={24} style={{ color: 'var(--green)', marginBottom: '4px' }} />
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Tavsiya etilgan narx oralig'i</div>
                  <div style={{ fontWeight: 800, fontSize: '20px', color: 'var(--green)' }}>
                    {result.amount_min_mln.toFixed(0)}–{result.amount_max_mln.toFixed(0)} mln so'm
                  </div>
                  {result.avg_tender_amount_mln && (
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                      O'rt: {result.avg_tender_amount_mln.toFixed(0)} mln so'm ({result.sample_count} tender asosida)
                    </div>
                  )}
                </div>

                <div className="grid-2">
                  <div style={{ background: 'var(--blue-soft)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <TrendingUp size={18} style={{ color: 'var(--blue)', marginBottom: '4px' }} />
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>G'alaba ehtimoli</div>
                    <div style={{ fontWeight: 800, fontSize: '22px', color: winProb(competition, result.confidence) >= 60 ? 'var(--green)' : 'var(--yellow)' }}>
                      {winProb(competition, result.confidence)}%
                    </div>
                  </div>
                  <div style={{ background: 'var(--orange-soft)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <Shield size={18} style={{ color: 'var(--orange)', marginBottom: '4px' }} />
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Risk bali</div>
                    <div style={{ fontWeight: 800, fontSize: '22px', color: riskScore(competition, result.sample_count) >= 50 ? 'var(--red)' : 'var(--green)' }}>
                      {riskScore(competition, result.sample_count)}/100
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-0)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-4)' }}>AI ishonchlilik darajasi</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{result.confidence}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '4px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${result.confidence}%`, background: 'var(--primary)', borderRadius: '4px', transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-5)', marginTop: '6px' }}>
                    {result.sample_count >= 3 ? `${result.sample_count} ta o'xshash tender tahlil qilindi` : "Yetarli tarixiy ma'lumot yo'q — taxminiy natija"}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-4)' }}>
                <BarChart3 size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p style={{ fontSize: '13px' }}>Parametrlarni kiriting va "Hisoblash" tugmasini bosing</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ fontWeight: 700 }}>O'xshash tenderlar ({category})</h3>
        </div>
        {similar.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px' }}>Tender</th>
                  <th style={{ padding: '12px 16px' }}>Hudud</th>
                  <th style={{ padding: '12px 16px' }}>Summa</th>
                  <th style={{ padding: '12px 16px' }}>Muddat</th>
                  <th style={{ padding: '12px 16px' }}>Holat</th>
                </tr>
              </thead>
              <tbody>
                {similar.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}><strong style={{ fontSize: '13px' }}>{t.title}</strong></td>
                    <td style={{ padding: '12px 16px' }}>{t.region ? <span className="badge badge-primary">{t.region}</span> : '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--green)' }}>{fmtAmount(t.amount)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-4)' }}>{t.deadline?.slice(0, 10) ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${t.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {t.status === 'active' ? 'Faol' : t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-4)', fontSize: '13px' }}>
            {calculating ? <RefreshCw size={20} className="animate-spin" style={{ opacity: 0.4 }} /> : "Hisoblash tugagach o'xshash tenderlar ko'rsatiladi"}
          </div>
        )}
      </div>
    </div>
  );
}
