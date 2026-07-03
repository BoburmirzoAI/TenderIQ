import { useState, type FormEvent } from 'react';
import { ShieldCheck, Mail, Lock, LogIn, RefreshCw, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: { name: string; role: string; avatar: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Iltimos, barcha maydonlarni to\'ldiring.');
      return;
    }

    setLoading(true);
    setError('');

    localStorage.removeItem('tiq_admin_access');
    localStorage.removeItem('tiq_admin_refresh');

    try {
      const { default: api } = await import('../api/axios');
      const res = await api.post('/auth/login', { email, password });
      const tokens = res.data?.data;

      localStorage.setItem('tiq_admin_access', tokens.access_token);
      if (tokens.refresh_token) {
        localStorage.setItem('tiq_admin_refresh', tokens.refresh_token);
      }

      const meRes = await api.get('/auth/me');
      const user = meRes.data?.data;

      if (!user?.is_superadmin) {
        localStorage.removeItem('tiq_admin_access');
        localStorage.removeItem('tiq_admin_refresh');
        setError('Faqat SuperAdmin kirishi mumkin.');
        setLoading(false);
        return;
      }

      const userName = user.full_name || user.email || 'Admin';
      const userData = {
        name: userName,
        role: 'SuperAdmin',
        avatar: userName.charAt(0).toUpperCase(),
      };

      localStorage.setItem('tiq_admin_user', JSON.stringify(userData));
      onLoginSuccess(userData);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setError("Email yoki parol noto'g'ri");
      } else if (status === 429) {
        setError("Juda ko'p urinish. Biroz kutib qayta urinib ko'ring");
      } else {
        setError("Tizimda xatolik yuz berdi. Qayta urinib ko'ring");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: '440px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-50px', left: '-50px',
          width: '150px', height: '150px',
          background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none'
        }} />

        <div className="auth-logo">
          <div style={{
            background: 'var(--primary-soft)', width: '64px', height: '64px',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            boxShadow: '0 8px 30px rgba(14, 165, 233, 0.2)'
          }}>
            <ShieldCheck size={36} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-0)' }}>TenderIQ Admin</h2>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '4px' }}>Platform Boshqaruv Paneli</p>
        </div>

        {error && (
          <div style={{
            background: 'var(--red-soft)', border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--text-1)', padding: '12px', borderRadius: '8px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px'
          }}>
            <AlertCircle size={16} style={{ color: 'var(--red)' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>EMAIL</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
              <input
                type="email" className="input" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tenderiq.uz"
                style={{ paddingLeft: '38px', background: 'var(--bg-2)' }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>PAROL</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
              <input
                type="password" className="input" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: '38px', background: 'var(--bg-2)' }}
                required
              />
            </div>
          </div>

          <button
            type="submit" className="btn btn-primary"
            style={{
              width: '100%', height: '42px', marginTop: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700
            }}
            disabled={loading}
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? 'Tekshirilmoqda...' : 'Kirish'}
          </button>
        </form>

        <div className="auth-divider">XAVFSIZ TIZIM</div>
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-4)' }}>
          Ruxsatsiz kirishlar kuzatiladi va qayd etiladi.
        </p>
      </div>
    </div>
  );
}
