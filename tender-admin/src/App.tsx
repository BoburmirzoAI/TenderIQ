import { useEffect, useState } from 'react';
import { AdminProvider } from './hooks/useAdmin';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import api from './api/axios';
import './index.css';

interface AdminUser {
  name: string;
  role: string;
  avatar: string;
}

const STORAGE_KEY = 'tiq_admin_user';

function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tiq_admin_access');
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!token || !saved) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then(() => {
        try {
          setUser(JSON.parse(saved) as AdminUser);
        } catch {
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('tiq_admin_access');
        localStorage.removeItem('tiq_admin_refresh');
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLoginSuccess = (u: AdminUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('tiq_admin_access');
    localStorage.removeItem('tiq_admin_refresh');
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-1, #f5f6fa)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-2, #888)' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border-1, #ddd)', borderTopColor: 'var(--primary, #0ea5e9)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Tekshirilmoqda...
        </div>
      </div>
    );
  }

  return (
    <AdminProvider>
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <AdminLayout loggedInUser={user} onLogout={handleLogout} />
      )}
    </AdminProvider>
  );
}

export default App;
