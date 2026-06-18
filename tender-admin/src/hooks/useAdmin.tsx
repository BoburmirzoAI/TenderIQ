import { createContext, useContext, useState, type ReactNode } from 'react';

interface Toast {
  id: number;
  title: string;
  desc: string;
  type: 'success' | 'error' | 'info';
}

interface AdminContextType {
  toasts: Toast[];
  addToast: (title: string, desc: string, type?: 'success' | 'error' | 'info') => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(false);

  const addToast = (title: string, desc: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, desc, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  return (
    <AdminContext.Provider value={{ toasts, addToast, loading, setLoading }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
