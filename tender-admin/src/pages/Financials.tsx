import { useState } from 'react';
import { CreditCard, TrendingUp, Users, RefreshCw, X, Eye, Receipt, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';

const revenueChart = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  click: Math.floor(Math.random() * 3000000 + 500000),
  payme: Math.floor(Math.random() * 2000000 + 300000),
}));

const planBreakdown = [
  { name: 'Free', value: 1139, color: 'var(--text-3)' },
  { name: 'Pro', value: 86, color: 'var(--yellow)' },
  { name: 'Business', value: 23, color: 'var(--purple)' },
];

const mockPayments = [
  { id: 1, user: 'Bobur Sobirjonov', email: 'bobur@mail.uz', amount: 990000, provider: 'click', plan: 'business', status: 'completed', paid_at: '2026-06-15 14:20', tx_id: 'CLK-78912', card_last4: '4532', receipt_url: '#' },
  { id: 2, user: 'Jasur Karimov', email: 'jasur@mail.uz', amount: 299000, provider: 'payme', plan: 'pro', status: 'completed', paid_at: '2026-06-14 10:15', tx_id: 'PME-45678', card_last4: '8901', receipt_url: '#' },
  { id: 3, user: 'Sherzod Umarov', email: 'sherzod@mail.uz', amount: 990000, provider: 'click', plan: 'business', status: 'completed', paid_at: '2026-06-13 16:30', tx_id: 'CLK-78913', card_last4: '2345', receipt_url: '#' },
  { id: 4, user: 'Otabek Mirzayev', email: 'otabek@mail.uz', amount: 299000, provider: 'payme', plan: 'pro', status: 'failed', paid_at: '2026-06-12 09:45', tx_id: 'PME-45679', card_last4: '6789', receipt_url: '#' },
  { id: 5, user: 'Malika Nurmatova', email: 'malika@mail.uz', amount: 299000, provider: 'click', plan: 'pro', status: 'completed', paid_at: '2026-06-11 11:20', tx_id: 'CLK-78914', card_last4: '1234', receipt_url: '#' },
  { id: 6, user: 'Dilnoza Rahimova', email: 'dilnoza@mail.uz', amount: 299000, provider: 'payme', plan: 'pro', status: 'completed', paid_at: '2026-06-10 08:30', tx_id: 'PME-45680', card_last4: '5678', receipt_url: '#' },
  { id: 7, user: 'Aziz Toshmatov', email: 'aziz@mail.uz', amount: 990000, provider: 'click', plan: 'business', status: 'pending', paid_at: '2026-06-09 15:10', tx_id: 'CLK-78915', card_last4: '9012', receipt_url: '#' },
];

const mockSubscriptions = [
  { id: 1, user: 'Bobur Sobirjonov', email: 'bobur@mail.uz', plan: 'business', starts: '2026-06-01', expires: '2026-07-01', requests_used: 1245, requests_limit: 5000, is_active: true, auto_renew: true },
  { id: 2, user: 'Jasur Karimov', email: 'jasur@mail.uz', plan: 'pro', starts: '2026-06-10', expires: '2026-07-10', requests_used: 312, requests_limit: 500, is_active: true, auto_renew: true },
  { id: 3, user: 'Sherzod Umarov', email: 'sherzod@mail.uz', plan: 'business', starts: '2026-05-15', expires: '2026-06-15', requests_used: 4890, requests_limit: 5000, is_active: false, auto_renew: false },
  { id: 4, user: 'Otabek Mirzayev', email: 'otabek@mail.uz', plan: 'pro', starts: '2026-06-05', expires: '2026-07-05', requests_used: 89, requests_limit: 500, is_active: true, auto_renew: true },
  { id: 5, user: 'Malika Nurmatova', email: 'malika@mail.uz', plan: 'pro', starts: '2026-06-08', expires: '2026-07-08', requests_used: 234, requests_limit: 500, is_active: true, auto_renew: false },
];

const fmtAmount = (n: number) => n.toString().replace(/\B(?=(\d{3})(?!\d))/g, ' ') + ' UZS';
const providerBadge = (p: string) => p === 'click' ? 'badge-blue' : 'badge-teal';
const statusBadge = (s: string) => s === 'completed' ? 'badge-green' : s === 'failed' ? 'badge-red' : 'badge-yellow';

export default function FinancialsPage() {
  const { addToast } = useAdmin();
  const [tab, setTab] = useState<'overview' | 'payments' | 'subscriptions' | 'plans'>('overview');
  const [paymentDetail, setPaymentDetail] = useState<typeof mockPayments[0] | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [subDetail, setSubDetail] = useState<typeof mockSubscriptions[0] | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);

  return (
    <div className="page-container">
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)', marginBottom: '24px' }}>Moliya</h1>

      <div className="tabs mb-24">
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Umumiy</button>
        <button className={`tab ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}>To'lovlar</button>
        <button className={`tab ${tab === 'subscriptions' ? 'active' : ''}`} onClick={() => setTab('subscriptions')}>Obunalar</button>
        <button className={`tab ${tab === 'plans' ? 'active' : ''}`} onClick={() => setTab('plans')}>Plan narxlari</button>
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid-4 mb-24">
            <div className="card stat-card">
              <div className="flex-between mb-8"><span className="stat-label">Jami daromad</span><CreditCard size={16} style={{ color: 'var(--green)' }} /></div>
              <div className="stat-value">47.2M</div>
              <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '4px' }}>+12.3% o'tgan oyga nisbatan</div>
            </div>
            <div className="card stat-card">
              <div className="flex-between mb-8"><span className="stat-label">Oylik daromad (MRR)</span><TrendingUp size={16} style={{ color: 'var(--primary)' }} /></div>
              <div className="stat-value">8.4M</div>
              <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px' }}>109 ta faol obuna</div>
            </div>
            <div className="card stat-card">
              <div className="flex-between mb-8"><span className="stat-label">Faol obunalar</span><Users size={16} style={{ color: 'var(--purple)' }} /></div>
              <div className="stat-value">109</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>Pro: 86 | Business: 23</div>
            </div>
            <div className="card stat-card">
              <div className="flex-between mb-8"><span className="stat-label">Click / Payme</span><CreditCard size={16} style={{ color: 'var(--blue)' }} /></div>
              <div className="stat-value" style={{ fontSize: '20px' }}>62 / 47</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>Shu oyda</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
            <div className="card">
              <div className="card-header"><span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Daromad trendi (30 kun)</span></div>
              <div className="card-body" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChart}>
                    <XAxis dataKey="day" stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-4)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: any) => `${(v/1e6).toFixed(1)}M`} />
                    <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="click" stroke="var(--blue)" fill="var(--blue-soft)" strokeWidth={2} name="Click" />
                    <Area type="monotone" dataKey="payme" stroke="var(--teal)" fill="var(--teal-soft)" strokeWidth={2} name="Payme" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Obuna taqsimoti</span></div>
              <div className="card-body" style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie data={planBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {planBreakdown.map((e, i) => <Cell key={i} fill={e.color} stroke="var(--bg-1)" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  {planBreakdown.map(p => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color }} />
                      <span style={{ color: 'var(--text-2)' }}>{p.name}: {p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'payments' && (
        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>To'lovlar tarixi</span>
            <span className="badge badge-primary">{mockPayments.length} ta</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px' }}>ID</th>
                  <th style={{ padding: '12px 16px' }}>Foydalanuvchi</th>
                  <th style={{ padding: '12px 16px' }}>Summa</th>
                  <th style={{ padding: '12px 16px' }}>Provider</th>
                  <th style={{ padding: '12px 16px' }}>Plan</th>
                  <th style={{ padding: '12px 16px' }}>Holat</th>
                  <th style={{ padding: '12px 16px' }}>Sana</th>
                  <th style={{ padding: '12px 16px' }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {mockPayments.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setPaymentDetail(p)}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-4)' }}>{p.id}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-0)' }}>{p.user}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{p.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-0)' }}>{fmtAmount(p.amount)}</td>
                    <td style={{ padding: '12px 16px' }}><span className={`badge ${providerBadge(p.provider)}`}>{p.provider.toUpperCase()}</span></td>
                    <td style={{ padding: '12px 16px' }}><span className={`badge ${p.plan === 'business' ? 'badge-purple' : 'badge-yellow'}`}>{p.plan}</span></td>
                    <td style={{ padding: '12px 16px' }}><span className={`badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: '13px' }}>{p.paid_at}</td>
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-icon" title="Batafsil" onClick={() => setPaymentDetail(p)}><Eye size={15} /></button>
                        {p.status === 'completed' && (
                          <button className="btn-icon" title="Qaytarish" onClick={() => addToast('Qaytarildi', `To'lov #${p.id} qaytarildi`, 'info')}>
                            <RefreshCw size={14} style={{ color: 'var(--red)' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'subscriptions' && (
        <div className="card">
          <div className="card-header flex-between">
            <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Obunalar</span>
            <button className="btn btn-sm btn-primary" onClick={() => addToast('Info', 'Manual obuna yaratish (backend kerak)', 'info')}>+ Qo'shish</button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px' }}>ID</th>
                  <th style={{ padding: '12px 16px' }}>Foydalanuvchi</th>
                  <th style={{ padding: '12px 16px' }}>Plan</th>
                  <th style={{ padding: '12px 16px' }}>Boshlanish</th>
                  <th style={{ padding: '12px 16px' }}>Tugash</th>
                  <th style={{ padding: '12px 16px' }}>So'rovlar</th>
                  <th style={{ padding: '12px 16px' }}>Holat</th>
                  <th style={{ padding: '12px 16px' }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {mockSubscriptions.map(s => (
                  <tr key={s.id}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-4)' }}>{s.id}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-0)' }}>{s.user}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{s.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}><span className={`badge ${s.plan === 'business' ? 'badge-purple' : 'badge-yellow'}`}>{s.plan}</span></td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{s.starts}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{s.expires}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress" style={{ width: '80px', height: '6px' }}>
                          <div className="progress-fill" style={{
                            width: `${Math.min((s.requests_used / s.requests_limit) * 100, 100)}%`,
                            background: (s.requests_used / s.requests_limit) > 0.8 ? 'var(--red)' : 'var(--green)'
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{s.requests_used}/{s.requests_limit}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{s.is_active ? <span className="badge badge-green">Faol</span> : <span className="badge badge-red">Tugagan</span>}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-icon" title="Batafsil" onClick={() => setSubDetail(s)}><Eye size={15} /></button>
                        <button className="btn-icon" title="Bekor qilish" onClick={() => addToast('Bekor qilindi', `${s.user} obunasi bekor qilindi`, 'info')}>
                          <X size={15} style={{ color: 'var(--red)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <div className="card">
          <div className="card-header"><span style={{ fontWeight: 700, color: 'var(--text-0)' }}>Plan narxlari va limitlar</span></div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px' }}>Xususiyat</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>FREE</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>PRO</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>BUSINESS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>Narx (UZS/oy)</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>0</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--yellow)' }}>299 000</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--purple)' }}>990 000</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>Kunlik so'rovlar</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>50</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>500</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>5 000</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>ML tahlil</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}><span className="badge badge-red">Yo'q</span></td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}><span className="badge badge-green">Ha</span></td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}><span className="badge badge-green">Ha</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>API kirish</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}><span className="badge badge-red">Yo'q</span></td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}><span className="badge badge-red">Yo'q</span></td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}><span className="badge badge-green">Ha</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>Hujjat tahlili</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}><span className="badge badge-red">Yo'q</span></td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}><span className="badge badge-green">Ha</span></td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}><span className="badge badge-green">Ha</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>Saqlangan tenderlar</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>10</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>500</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>Cheksiz</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>Jamoa a'zolari</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>5</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="card-footer">
            <button className="btn btn-primary" onClick={() => setConfirmSave(true)}>Saqlash</button>
          </div>
        </div>
      )}

      {paymentDetail && (
        <div className="modal-overlay" onClick={() => { setPaymentDetail(null); setShowReceipt(false); }}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>To'lov tafsiloti #{paymentDetail.id}</h3>
              <button className="btn-icon" onClick={() => { setPaymentDetail(null); setShowReceipt(false); }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-0)', borderRadius: '12px', border: '1px solid var(--border-1)' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-0)' }}>{fmtAmount(paymentDetail.amount)}</div>
                <div style={{ marginTop: '8px' }}><span className={`badge ${statusBadge(paymentDetail.status)}`}>{paymentDetail.status}</span></div>
              </div>

              <div className="grid-2">
                <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Foydalanuvchi</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-0)' }}>{paymentDetail.user}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{paymentDetail.email}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Plan</div>
                  <div><span className={`badge ${paymentDetail.plan === 'business' ? 'badge-purple' : 'badge-yellow'}`}>{paymentDetail.plan}</span></div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>To'lov tizimi</div>
                  <div><span className={`badge ${providerBadge(paymentDetail.provider)}`}>{paymentDetail.provider.toUpperCase()}</span></div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px' }}>Sana</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '13px' }}>{paymentDetail.paid_at}</div>
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                <div className="flex-between">
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Tranzaksiya ID</div>
                    <div className="font-mono" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>{paymentDetail.tx_id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Karta</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-1)' }}>**** {paymentDetail.card_last4}</div>
                  </div>
                </div>
              </div>

              {showReceipt && (
                <div style={{ padding: '16px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border-1)', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-0)', fontSize: '14px' }}>TenderIQ — To'lov cheki</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div className="flex-between"><span style={{ color: 'var(--text-3)' }}>Chek raqami:</span><span className="font-mono" style={{ color: 'var(--text-1)' }}>{paymentDetail.tx_id}</span></div>
                    <div className="flex-between"><span style={{ color: 'var(--text-3)' }}>Sana:</span><span style={{ color: 'var(--text-1)' }}>{paymentDetail.paid_at}</span></div>
                    <div className="flex-between"><span style={{ color: 'var(--text-3)' }}>Xaridor:</span><span style={{ color: 'var(--text-1)' }}>{paymentDetail.user}</span></div>
                    <div className="flex-between"><span style={{ color: 'var(--text-3)' }}>Xizmat:</span><span style={{ color: 'var(--text-1)' }}>TenderIQ {paymentDetail.plan} obuna</span></div>
                    <div className="flex-between"><span style={{ color: 'var(--text-3)' }}>To'lov usuli:</span><span style={{ color: 'var(--text-1)' }}>{paymentDetail.provider.toUpperCase()} (*{paymentDetail.card_last4})</span></div>
                    <div className="divider" />
                    <div className="flex-between"><span style={{ fontWeight: 700, color: 'var(--text-0)' }}>JAMI:</span><span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '14px' }}>{fmtAmount(paymentDetail.amount)}</span></div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowReceipt(!showReceipt)}>
                <Receipt size={14} /> {showReceipt ? 'Chekni yopish' : 'Chek ko\'rish'}
              </button>
              {paymentDetail.status === 'completed' && (
                <button className="btn btn-danger" onClick={() => { addToast('Qaytarildi', `To'lov #${paymentDetail.id} qaytarildi`, 'info'); setPaymentDetail(null); }}>
                  <RefreshCw size={14} /> Qaytarish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {subDetail && (
        <div className="modal-overlay" onClick={() => setSubDetail(null)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)' }}>Obuna tafsiloti</h3>
              <button className="btn-icon" onClick={() => setSubDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar avatar-lg" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 800 }}>{subDetail.user.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-0)' }}>{subDetail.user}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{subDetail.email}</div>
                </div>
              </div>
              <div className="grid-2">
                <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Plan</div>
                  <div style={{ marginTop: '4px' }}><span className={`badge ${subDetail.plan === 'business' ? 'badge-purple' : 'badge-yellow'}`}>{subDetail.plan}</span></div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Holat</div>
                  <div style={{ marginTop: '4px' }}>{subDetail.is_active ? <span className="badge badge-green">Faol</span> : <span className="badge badge-red">Tugagan</span>}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Boshlanish</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-1)', marginTop: '4px' }}>{subDetail.starts}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Tugash</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-1)', marginTop: '4px' }}>{subDetail.expires}</div>
                </div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-0)', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                <div className="flex-between mb-8">
                  <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>So'rovlar ishlatilgan</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>{subDetail.requests_used} / {subDetail.requests_limit}</span>
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{
                    width: `${Math.min((subDetail.requests_used / subDetail.requests_limit) * 100, 100)}%`,
                    background: (subDetail.requests_used / subDetail.requests_limit) > 0.8 ? 'var(--red)' : 'var(--green)'
                  }} />
                </div>
              </div>
              <div className="flex-between" style={{ padding: '8px 0' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Avtomatik yangilash</span>
                <span className={`badge ${subDetail.auto_renew ? 'badge-green' : 'badge-red'}`}>{subDetail.auto_renew ? 'Yoqilgan' : 'O\'chirilgan'}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSubDetail(null)}>Yopish</button>
              <button className="btn btn-danger" onClick={() => { addToast('Bekor qilindi', `${subDetail.user} obunasi bekor qilindi`, 'info'); setSubDetail(null); }}>Obunani bekor qilish</button>
            </div>
          </div>
        </div>
      )}

      {confirmSave && (
        <div className="modal-overlay" onClick={() => setConfirmSave(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--yellow)' }} /> Tasdiqlash
              </h3>
              <button className="btn-icon" onClick={() => setConfirmSave(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-1)' }}>Plan narxlari va limitlarni o'zgartirmoqchimisiz?</p>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>Bu barcha yangi obunalarga ta'sir qiladi.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmSave(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={() => { addToast('Saqlandi', 'Plan narxlari yangilandi', 'success'); setConfirmSave(false); }}>Ha, saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
