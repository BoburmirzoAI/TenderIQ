import { useState } from 'react';
import { Globe, Activity, Clock, AlertTriangle, X, ChevronDown, ChevronRight, Search, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../hooks/useAdmin';

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  module: string;
  auth: boolean;
  rateLimit: boolean | string;
  avgResponse: number;
  callsToday: number;
  errors: number;
  params?: string[];
  description?: string;
}

const mockEndpoints: Endpoint[] = [
  { method: 'POST', path: '/api/v1/auth/login', module: 'auth', auth: false, rateLimit: '10/min', avgResponse: 120, callsToday: 892, errors: 12, description: 'Foydalanuvchi email va parol orqali tizimga kiradi', params: ['email', 'password'] },
  { method: 'POST', path: '/api/v1/auth/register', module: 'auth', auth: false, rateLimit: '5/min', avgResponse: 145, callsToday: 67, errors: 3, description: 'Yangi foydalanuvchi ro\'yxatdan o\'tadi', params: ['email', 'password', 'full_name'] },
  { method: 'POST', path: '/api/v1/auth/refresh', module: 'auth', auth: true, rateLimit: '30/min', avgResponse: 45, callsToday: 1240, errors: 0, description: 'JWT access token yangilash' },
  { method: 'GET', path: '/api/v1/auth/me', module: 'auth', auth: true, rateLimit: false, avgResponse: 32, callsToday: 2100, errors: 0, description: 'Joriy foydalanuvchi ma\'lumotlari' },
  { method: 'PATCH', path: '/api/v1/auth/me', module: 'auth', auth: true, rateLimit: false, avgResponse: 85, callsToday: 156, errors: 2, description: 'Profil ma\'lumotlarini yangilash' },
  { method: 'GET', path: '/api/v1/tenders/', module: 'tenders', auth: true, rateLimit: false, avgResponse: 180, callsToday: 4560, errors: 5, description: 'Filtrlar bilan tender ro\'yxatini qaytaradi', params: ['page', 'category', 'region', 'status', 'source', 'search'] },
  { method: 'GET', path: '/api/v1/tenders/{id}', module: 'tenders', auth: true, rateLimit: false, avgResponse: 65, callsToday: 2340, errors: 8, description: 'Bitta tender tafsilotlari', params: ['id'] },
  { method: 'GET', path: '/api/v1/tenders/matched/', module: 'tenders', auth: true, rateLimit: false, avgResponse: 320, callsToday: 1890, errors: 2, description: 'ML orqali mos kelgan tenderlar' },
  { method: 'POST', path: '/api/v1/tenders/save/{match_id}', module: 'tenders', auth: true, rateLimit: false, avgResponse: 55, callsToday: 445, errors: 0, description: 'Tender match ni saqlash', params: ['match_id'] },
  { method: 'GET', path: '/api/v1/tenders/calendar/', module: 'tenders', auth: true, rateLimit: false, avgResponse: 150, callsToday: 780, errors: 1, description: 'Muddatlar bo\'yicha tender kalendar' },
  { method: 'POST', path: '/api/v1/companies/', module: 'companies', auth: true, rateLimit: '5/hour', avgResponse: 200, callsToday: 23, errors: 1, description: 'Kompaniya yaratish' },
  { method: 'GET', path: '/api/v1/companies/me', module: 'companies', auth: true, rateLimit: false, avgResponse: 45, callsToday: 890, errors: 0, description: 'Joriy foydalanuvchi kompaniyasi' },
  { method: 'PATCH', path: '/api/v1/companies/me', module: 'companies', auth: true, rateLimit: false, avgResponse: 95, callsToday: 67, errors: 0, description: 'Kompaniya ma\'lumotlarini yangilash' },
  { method: 'GET', path: '/api/v1/companies/stats', module: 'companies', auth: true, rateLimit: false, avgResponse: 110, callsToday: 340, errors: 0, description: 'Kompaniya statistikasi' },
  { method: 'GET', path: '/api/v1/competitors/top', module: 'competitors', auth: true, rateLimit: false, avgResponse: 250, callsToday: 560, errors: 3, description: 'Top raqobatchilar ro\'yxati' },
  { method: 'GET', path: '/api/v1/competitors/profile/{stir}', module: 'competitors', auth: true, rateLimit: '20/min', avgResponse: 340, callsToday: 230, errors: 5, description: 'STIR bo\'yicha raqobatchi profili', params: ['stir'] },
  { method: 'GET', path: '/api/v1/competitors/tender/{id}/predict', module: 'competitors', auth: true, rateLimit: '10/min', avgResponse: 890, callsToday: 120, errors: 2, description: 'Tender uchun raqobatchilarni ML orqali bashorat', params: ['id'] },
  { method: 'POST', path: '/api/v1/ml/predict-price', module: 'ml', auth: true, rateLimit: '20/min', avgResponse: 450, callsToday: 340, errors: 8, description: 'ML orqali tender narxini bashorat qilish' },
  { method: 'POST', path: '/api/v1/ml/win-probability', module: 'ml', auth: true, rateLimit: '20/min', avgResponse: 520, callsToday: 280, errors: 5, description: 'Tender yutish ehtimolligini hisoblash' },
  { method: 'POST', path: '/api/v1/ml/tender-similarity', module: 'ml', auth: true, rateLimit: '15/min', avgResponse: 680, callsToday: 190, errors: 3, description: 'Tender o\'xshashlik tahlili' },
  { method: 'POST', path: '/api/v1/ml/risk-assessment', module: 'ml', auth: true, rateLimit: '15/min', avgResponse: 410, callsToday: 150, errors: 2, description: 'Tender risk baholash' },
  { method: 'GET', path: '/api/v1/analytics/competitors', module: 'analytics', auth: true, rateLimit: false, avgResponse: 290, callsToday: 450, errors: 1, description: 'Raqobatchilar tahlili' },
  { method: 'GET', path: '/api/v1/analytics/price-history', module: 'analytics', auth: true, rateLimit: false, avgResponse: 210, callsToday: 380, errors: 0, description: 'Narx tarixi grafigi' },
  { method: 'GET', path: '/api/v1/analytics/market', module: 'analytics', auth: true, rateLimit: false, avgResponse: 350, callsToday: 290, errors: 2, description: 'Bozor tahlili' },
  { method: 'GET', path: '/api/v1/analytics/anomalies', module: 'analytics', auth: true, rateLimit: '30/min', avgResponse: 480, callsToday: 120, errors: 4, description: 'Anomaliyalarni aniqlash' },
  { method: 'POST', path: '/api/v1/payments/create', module: 'payments', auth: true, rateLimit: '5/min', avgResponse: 350, callsToday: 45, errors: 2, description: 'To\'lov yaratish (Click/Payme)' },
  { method: 'GET', path: '/api/v1/payments/history', module: 'payments', auth: true, rateLimit: false, avgResponse: 90, callsToday: 210, errors: 0, description: 'To\'lov tarixi' },
  { method: 'POST', path: '/api/v1/payments/click/webhook', module: 'payments', auth: false, rateLimit: '100/min', avgResponse: 75, callsToday: 38, errors: 1, description: 'Click to\'lov tizimidan webhook' },
  { method: 'POST', path: '/api/v1/payments/payme/webhook', module: 'payments', auth: false, rateLimit: '100/min', avgResponse: 80, callsToday: 42, errors: 0, description: 'Payme to\'lov tizimidan webhook' },
  { method: 'GET', path: '/api/v1/notifications/', module: 'notifications', auth: true, rateLimit: false, avgResponse: 55, callsToday: 1560, errors: 0, description: 'Bildirishnomalar ro\'yxati' },
  { method: 'GET', path: '/api/v1/notifications/stats', module: 'notifications', auth: true, rateLimit: false, avgResponse: 40, callsToday: 890, errors: 0, description: 'Bildirishnoma statistikasi' },
  { method: 'PATCH', path: '/api/v1/notifications/{id}/read', module: 'notifications', auth: true, rateLimit: false, avgResponse: 30, callsToday: 670, errors: 0, description: 'Bildirishnomani o\'qilgan deb belgilash', params: ['id'] },
  { method: 'PATCH', path: '/api/v1/notifications/read-all', module: 'notifications', auth: true, rateLimit: false, avgResponse: 45, callsToday: 230, errors: 0, description: 'Barcha bildirishnomalarni o\'qilgan deb belgilash' },
  { method: 'GET', path: '/api/v1/admin/stats', module: 'admin', auth: true, rateLimit: false, avgResponse: 180, callsToday: 120, errors: 0, description: 'Admin dashboard statistikasi' },
  { method: 'GET', path: '/api/v1/admin/users', module: 'admin', auth: true, rateLimit: false, avgResponse: 150, callsToday: 85, errors: 0, description: 'Barcha foydalanuvchilar ro\'yxati' },
  { method: 'PATCH', path: '/api/v1/admin/users/{id}', module: 'admin', auth: true, rateLimit: false, avgResponse: 95, callsToday: 12, errors: 0, description: 'Foydalanuvchi ma\'lumotlarini yangilash', params: ['id'] },
];

const methodColors: Record<string, string> = {
  GET: 'badge-green', POST: 'badge-primary', PATCH: 'badge-yellow', DELETE: 'badge-red',
};

const modules = [...new Set(mockEndpoints.map(e => e.module))];
const totalCalls = mockEndpoints.reduce((s, e) => s + e.callsToday, 0);
const avgResponseAll = Math.round(mockEndpoints.reduce((s, e) => s + e.avgResponse, 0) / mockEndpoints.length);
const totalErrors = mockEndpoints.reduce((s, e) => s + e.errors, 0);
const errorRate = ((totalErrors / totalCalls) * 100).toFixed(2);

const responseTimeData = [
  { time: '08:00', ms: 120 }, { time: '09:00', ms: 145 }, { time: '10:00', ms: 190 },
  { time: '11:00', ms: 210 }, { time: '12:00', ms: 180 }, { time: '13:00', ms: 165 },
  { time: '14:00', ms: 155 }, { time: '15:00', ms: 200 }, { time: '16:00', ms: 175 },
];

const mockResponse: Record<string, object> = {
  GET: { id: 1, status: 'ok', data: { items: [], total: 0, page: 1 } },
  POST: { id: 42, created: true, message: 'Created successfully' },
  PATCH: { id: 42, updated: true, message: 'Updated successfully' },
  DELETE: { deleted: true, message: 'Deleted successfully' },
};

export default function APIEndpoints() {
  const { addToast } = useAdmin();
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [testResult, setTestResult] = useState<Endpoint | null>(null);
  const [filterModule, setFilterModule] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [editingRateLimit, setEditingRateLimit] = useState<string | null>(null);
  const [rateLimitValues, setRateLimitValues] = useState<Record<string, string>>({});
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  const toggleGroup = (module: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(module) ? next.delete(module) : next.add(module);
      return next;
    });
  };

  const filtered = mockEndpoints.filter(e => {
    if (filterModule !== 'all' && e.module !== filterModule) return false;
    if (filterMethod !== 'all' && e.method !== filterMethod) return false;
    if (searchQuery && !e.path.toLowerCase().includes(searchQuery.toLowerCase()) && !e.module.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const grouped: Record<string, Endpoint[]> = {};
  filtered.forEach(e => {
    if (!grouped[e.module]) grouped[e.module] = [];
    grouped[e.module].push(e);
  });

  const simulateTest = (ep: Endpoint) => {
    setTestingEndpoint(ep.path);
    addToast('Test', `${ep.method} ${ep.path} so'rovi yuborilmoqda...`, 'info');
    setTimeout(() => {
      setTestingEndpoint(null);
      setTestResult(ep);
    }, 1200);
  };

  const saveRateLimit = (path: string) => {
    const val = rateLimitValues[path];
    if (val) {
      addToast('Saqlandi', `Rate limit yangilandi: ${val}`, 'success');
    }
    setEditingRateLimit(null);
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-24">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>API Endpoints</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Barcha API endpointlar monitoring va boshqarish</p>
        </div>
      </div>

      <div className="grid-4 mb-24">
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Jami endpointlar</span>
            <Globe size={16} style={{ color: 'var(--blue)' }} />
          </div>
          <div className="stat-value">{mockEndpoints.length}</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Bugungi so'rovlar</span>
            <Activity size={16} style={{ color: 'var(--green)' }} />
          </div>
          <div className="stat-value">{totalCalls.toLocaleString()}</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">O'rt. javob vaqti</span>
            <Clock size={16} style={{ color: 'var(--yellow)' }} />
          </div>
          <div className="stat-value">{avgResponseAll}ms</div>
        </div>
        <div className="card stat-card">
          <div className="flex-between mb-8">
            <span className="stat-label">Xato darajasi</span>
            <AlertTriangle size={16} style={{ color: 'var(--red)' }} />
          </div>
          <div className="stat-value" style={{ color: Number(errorRate) > 2 ? 'var(--red)' : 'var(--green)' }}>
            {errorRate}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-16">
        <div className="card-body" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input
              className="input"
              placeholder="Endpoint qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
          </div>
          <select
            className="input"
            style={{ width: '160px' }}
            value={filterModule}
            onChange={e => setFilterModule(e.target.value)}
          >
            <option value="all">Barcha modullar</option>
            {modules.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            className="input"
            style={{ width: '130px' }}
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
          >
            <option value="all">Barcha usullar</option>
            {['GET', 'POST', 'PATCH', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {(filterModule !== 'all' || filterMethod !== 'all' || searchQuery) && (
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => { setFilterModule('all'); setFilterMethod('all'); setSearchQuery(''); }}
            >
              Barcha modullar
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ padding: '12px 16px' }}>Method</th>
                <th style={{ padding: '12px 16px' }}>Path</th>
                <th style={{ padding: '12px 16px' }}>Auth</th>
                <th style={{ padding: '12px 16px' }}>Rate limit</th>
                <th style={{ padding: '12px 16px' }}>Javob</th>
                <th style={{ padding: '12px 16px' }}>Bugun</th>
                <th style={{ padding: '12px 16px' }}>Xato</th>
                <th style={{ padding: '12px 16px' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([module, endpoints]) => (
                <>
                  <tr
                    key={`header-${module}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleGroup(module)}
                  >
                    <td
                      colSpan={8}
                      style={{
                        padding: '10px 16px',
                        background: 'var(--bg-1)',
                        fontWeight: 700, fontSize: '12px', color: 'var(--text-0)',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {collapsedGroups.has(module)
                          ? <ChevronRight size={14} />
                          : <ChevronDown size={14} />}
                        {module}
                        <span className="badge badge-primary" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                          {endpoints.length}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {!collapsedGroups.has(module) && endpoints.map((ep, i) => (
                    <tr
                      key={`${module}-${i}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedEndpoint(ep)}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <span className={`badge ${methodColors[ep.method]}`}>{ep.method}</span>
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-1)' }}>
                        {ep.path}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {ep.auth
                          ? <span style={{ color: 'var(--green)', fontSize: '12px' }}>Ha</span>
                          : <span style={{ color: 'var(--text-4)', fontSize: '12px' }}>Yo'q</span>}
                      </td>
                      <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                        {editingRateLimit === ep.path ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                              className="input"
                              style={{ width: '80px', height: '28px', fontSize: '11px' }}
                              defaultValue={typeof ep.rateLimit === 'string' ? ep.rateLimit : ''}
                              onChange={e => setRateLimitValues(p => ({ ...p, [ep.path]: e.target.value }))}
                              autoFocus
                            />
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ padding: '2px 6px' }}
                              onClick={() => saveRateLimit(ep.path)}
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: '12px',
                              color: ep.rateLimit ? 'var(--yellow)' : 'var(--text-4)',
                              cursor: 'pointer',
                              textDecoration: 'underline dotted',
                            }}
                            onClick={() => setEditingRateLimit(ep.path)}
                            title="Bosing tahrirlash uchun"
                          >
                            {ep.rateLimit || 'Yo\'q'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px' }}>{ep.avgResponse}ms</td>
                      <td style={{ padding: '10px 16px', fontSize: '13px' }}>{ep.callsToday.toLocaleString()}</td>
                      <td style={{ padding: '10px 16px' }}>
                        {ep.errors > 0
                          ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>{ep.errors}</span>
                          : <span style={{ color: 'var(--text-4)' }}>0</span>}
                      </td>
                      <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-sm"
                          onClick={() => simulateTest(ep)}
                          disabled={testingEndpoint === ep.path}
                        >
                          {testingEndpoint === ep.path
                            ? <Zap size={12} className="animate-spin" />
                            : <><Zap size={12} /> Test</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selectedEndpoint && (
        <div className="modal-overlay" onClick={() => setSelectedEndpoint(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${methodColors[selectedEndpoint.method]}`}>{selectedEndpoint.method}</span>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-0)', fontFamily: 'monospace' }}>
                  {selectedEndpoint.path}
                </h2>
              </div>
              <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setSelectedEndpoint(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-body">
              {selectedEndpoint.description && (
                <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px', lineHeight: 1.6 }}>
                  {selectedEndpoint.description}
                </p>
              )}

              <div className="grid-2 mb-16" style={{ gap: '10px' }}>
                {[
                  { label: 'Modul', value: selectedEndpoint.module },
                  { label: 'Auth kerak', value: selectedEndpoint.auth ? 'Ha' : 'Yo\'q' },
                  { label: 'Rate limit', value: selectedEndpoint.rateLimit ? String(selectedEndpoint.rateLimit) : 'Yo\'q' },
                  { label: 'Bugungi xatolar', value: String(selectedEndpoint.errors) },
                  { label: "O'rtacha javob", value: `${selectedEndpoint.avgResponse}ms` },
                  { label: 'Bugungi so\'rovlar', value: selectedEndpoint.callsToday.toLocaleString() },
                ].map(item => (
                  <div key={item.label} style={{ padding: '10px 12px', background: 'var(--bg-1)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '3px' }}>{item.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {selectedEndpoint.params && (
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-0)' }}>Parametrlar</h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedEndpoint.params.map(p => (
                      <span key={p} className="badge badge-primary" style={{ fontFamily: 'monospace' }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-0)' }}>
                  Mock Response ({selectedEndpoint.method})
                </h3>
                <pre style={{
                  background: 'var(--bg-0)', padding: '12px', borderRadius: '8px',
                  fontSize: '11px', color: 'var(--text-2)', fontFamily: 'monospace',
                  overflow: 'auto', border: '1px solid var(--border-1)'
                }}>
                  {JSON.stringify(mockResponse[selectedEndpoint.method], null, 2)}
                </pre>
              </div>

              <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-0)' }}>
                Javob vaqti (bugun)
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={responseTimeData}>
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="ms" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedEndpoint(null)}>Yopish</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  simulateTest(selectedEndpoint);
                  setSelectedEndpoint(null);
                }}
              >
                <Zap size={13} /> Test yuborish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test result modal */}
      {testResult && (
        <div className="modal-overlay" onClick={() => setTestResult(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${methodColors[testResult.method]}`}>{testResult.method}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-1)' }}>{testResult.path}</span>
              </div>
              <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setTestResult(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <span className="badge badge-green">200 OK</span>
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                  {Math.floor(Math.random() * 100 + 20)}ms
                </span>
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-0)' }}>Response Body</h3>
              <pre style={{
                background: 'var(--bg-0)', padding: '12px', borderRadius: '8px',
                fontSize: '11px', color: 'var(--text-2)', fontFamily: 'monospace',
                overflow: 'auto', border: '1px solid var(--border-1)'
              }}>
                {JSON.stringify(mockResponse[testResult.method], null, 2)}
              </pre>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setTestResult(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
