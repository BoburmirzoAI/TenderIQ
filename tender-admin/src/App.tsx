import { useState } from 'react';
import { AdminProvider } from './hooks/useAdmin';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import './index.css';

interface AdminUser {
  name: string;
  role: string;
  avatar: string;
}

const STORAGE_KEY = 'tiq_admin_user';

function App() {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const token = localStorage.getItem('tiq_admin_access');
    const saved = localStorage.getItem(STORAGE_KEY);
    if (token && saved) {
      try {
        return JSON.parse(saved) as AdminUser;
      } catch {
        return null;
      }
    }
    return null;
  });

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
