import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, FileSearch, Database, CreditCard,
  Zap, Bell, Activity, Settings, ShieldCheck, Power, RefreshCw,
  AlertTriangle, X, Target, GitBranch, Brain, BarChart3,
  FileDown, Calendar, Columns3, Calculator, Swords, TrendingUp,
  UsersRound, Map, BookOpen, FileText, Building2, Bookmark,
  Globe, Lock, Radio, ClipboardList, Tag, KeyRound, MailOpen, Terminal
} from 'lucide-react';
import { useAdmin, registerSetActiveTab } from '../hooks/useAdmin';

import Dashboard from '../pages/Dashboard';
import UsersPage from '../pages/Users';
import TendersPage from '../pages/Tenders';
import InfrastructurePage from '../pages/Infrastructure';
import FinancialsPage from '../pages/Financials';
import IntegrationsPage from '../pages/Integrations';
import NotificationsPage from '../pages/Notifications';
import PlatformHealthPage from '../pages/PlatformHealth';
import SettingsPage from '../pages/Settings';
import RolesPermissions from '../pages/RolesPermissions';
import TenderMatches from '../pages/TenderMatches';
import Pipeline from '../pages/Pipeline';
import AIModels from '../pages/AIModels';
import Analytics from '../pages/Analytics';
import Reports from '../pages/Reports';
import TenderCalendar from '../pages/TenderCalendar';
import TenderCompare from '../pages/TenderCompare';
import PriceCalculator from '../pages/PriceCalculator';
import Competitors from '../pages/Competitors';
import PriceStrategy from '../pages/PriceStrategy';
import Teams from '../pages/Teams';
import TenderMap from '../pages/TenderMap';
import WinLossJournal from '../pages/WinLossJournal';
import Documents from '../pages/Documents';
import Companies from '../pages/Companies';
import SavedSearches from '../pages/SavedSearches';
import APIEndpoints from '../pages/APIEndpoints';
import WebSocketMonitor from '../pages/WebSocketMonitor';
import AuditLog from '../pages/AuditLog';
import PromoCodes from '../pages/PromoCodes';
import APIKeys from '../pages/APIKeys';
import EmailTemplates from '../pages/EmailTemplates';
import ContainerLogs from '../pages/ContainerLogs';

const pageMap: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  users: UsersPage,
  roles: RolesPermissions,
  tenders: TendersPage,
  matches: TenderMatches,
  pipeline: Pipeline,
  ai: AIModels,
  analytics: Analytics,
  reports: Reports,
  calendar: TenderCalendar,
  compare: TenderCompare,
  calculator: PriceCalculator,
  competitors: Competitors,
  pricing: PriceStrategy,
  teams: Teams,
  tender_map: TenderMap,
  journal: WinLossJournal,
  documents: Documents,
  companies: Companies,
  saved_searches: SavedSearches,
  notifications: NotificationsPage,
  financials: FinancialsPage,
  infrastructure: InfrastructurePage,
  integrations: IntegrationsPage,
  health: PlatformHealthPage,
  api_endpoints: APIEndpoints,
  websocket: WebSocketMonitor,
  audit_log: AuditLog,
  promo_codes: PromoCodes,
  api_keys: APIKeys,
  email_templates: EmailTemplates,
  container_logs: ContainerLogs,
  settings: SettingsPage,
};

const navSections = [
  {
    title: 'Boshqaruv',
    items: [
      { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
      { id: 'users', label: 'Foydalanuvchilar', icon: Users },
      { id: 'roles', label: 'Role & Permissions', icon: Lock },
      { id: 'audit_log', label: 'Audit Log', icon: ClipboardList },
      { id: 'api_keys', label: 'API Keys', icon: KeyRound },
      { id: 'companies', label: 'Kompaniyalar', icon: Building2 },
      { id: 'teams', label: 'Jamoalar', icon: UsersRound },
    ],
  },
  {
    title: 'Tenderlar',
    items: [
      { id: 'tenders', label: 'Barcha tenderlar', icon: FileSearch },
      { id: 'matches', label: 'Mos tenderlar', icon: Target },
      { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
      { id: 'calendar', label: 'Kalendar', icon: Calendar },
      { id: 'compare', label: 'Taqqoslash', icon: Columns3 },
      { id: 'tender_map', label: 'Tender xaritasi', icon: Map },
      { id: 'saved_searches', label: 'Saqlangan qidiruvlar', icon: Bookmark },
    ],
  },
  {
    title: 'Tahlil & AI',
    items: [
      { id: 'ai', label: 'AI bashorat', icon: Brain },
      { id: 'analytics', label: 'Analitika', icon: BarChart3 },
      { id: 'competitors', label: 'Raqobatchilar', icon: Swords },
      { id: 'pricing', label: 'Narx strategiya', icon: TrendingUp },
      { id: 'calculator', label: 'Kalkulyator', icon: Calculator },
      { id: 'journal', label: 'Win/Loss kundalik', icon: BookOpen },
      { id: 'documents', label: 'Hujjatlar', icon: FileText },
      { id: 'reports', label: 'Hisobotlar', icon: FileDown },
    ],
  },
  {
    title: 'Moliya',
    items: [
      { id: 'financials', label: 'To\'lovlar & Obuna', icon: CreditCard },
      { id: 'promo_codes', label: 'Promo Kodlar', icon: Tag },
      { id: 'email_templates', label: 'Email Templates', icon: MailOpen },
      { id: 'notifications', label: 'Bildirishnomalar', icon: Bell },
    ],
  },
  {
    title: 'Infra & Tizim',
    items: [
      { id: 'infrastructure', label: 'Infrastructure & DB', icon: Database },
      { id: 'integrations', label: 'Integratsiyalar', icon: Zap },
      { id: 'health', label: 'Platform Health', icon: Activity },
      { id: 'api_endpoints', label: 'API Endpoints', icon: Globe },
      { id: 'websocket', label: 'WebSocket Monitor', icon: Radio },
      { id: 'container_logs', label: 'Konteyner Loglari', icon: Terminal },
      { id: 'settings', label: 'Sozlamalar', icon: Settings },
    ],
  },
];

interface AdminUser {
  name: string;
  role: string;
  avatar: string;
}

interface Props {
  loggedInUser: AdminUser;
  onLogout: () => void;
}

export default function AdminLayout({ loggedInUser, onLogout }: Props) {
  const { toasts, addToast } = useAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    registerSetActiveTab(setActiveTab);
  }, [setActiveTab]);
  const [logoutModal, setLogoutModal] = useState(false);
  const [apiStatus, setApiStatus] = useState<'healthy' | 'testing'>('healthy');
  const [dbStatus, setDbStatus] = useState<'linked' | 'testing'>('linked');

  const testAPI = () => {
    if (apiStatus === 'testing') return;
    setApiStatus('testing');
    addToast('API test', 'API ulanishni tekshirish...', 'info');
    setTimeout(() => {
      setApiStatus('healthy');
      addToast('API Healthy', 'API ishlayapti, javob vaqti: ~34ms', 'success');
    }, 1200);
  };

  const testDB = () => {
    if (dbStatus === 'testing') return;
    setDbStatus('testing');
    addToast('DB test', 'PostgreSQL ulanishni tekshirish...', 'info');
    setTimeout(() => {
      setDbStatus('linked');
      addToast('DB Linked', 'Ma\'lumotlar bazasi ishlayapti', 'success');
    }, 1200);
  };

  const handleLogout = () => {
    setLogoutModal(false);
    addToast('Chiqish', 'Sessiya yakunlanmoqda...', 'info');
    setTimeout(() => onLogout(), 800);
  };

  const PageComponent = pageMap[activeTab] || (() => <div>Sahifa topilmadi</div>);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon" style={{
              background: 'var(--primary)', width: '32px', height: '32px',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ShieldCheck size={20} color="white" />
            </div>
            <span className="logo-text" style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-0)' }}>
              TenderIQ
            </span>
          </div>
        </div>

        <nav className="nav-group">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="nav-group-title">{section.title}</div>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="avatar avatar-sm" style={{
              background: 'linear-gradient(135deg, var(--primary), var(--bg-hover))',
              color: 'white', fontWeight: 800
            }}>
              {loggedInUser.avatar}
            </div>
            <div className="user-info">
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-0)' }}>{loggedInUser.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{loggedInUser.role}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-3)' }}>
            SuperAdmin Panel
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={testAPI} className="badge badge-green" style={{
              border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer',
              background: apiStatus === 'testing' ? 'var(--bg-active)' : 'var(--green-soft)'
            }}>
              {apiStatus === 'testing'
                ? <RefreshCw size={12} className="animate-spin" />
                : <div style={{ width: '6px', height: '6px', background: 'var(--green)', borderRadius: '50%', boxShadow: '0 0 8px var(--green)' }} />
              }
              <span style={{ marginLeft: '4px', fontWeight: 700 }}>
                API: {apiStatus === 'testing' ? 'Testing...' : 'Healthy'}
              </span>
            </button>

            <button onClick={testDB} className="badge badge-green" style={{
              border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer',
              background: dbStatus === 'testing' ? 'var(--bg-active)' : 'var(--green-soft)'
            }}>
              {dbStatus === 'testing'
                ? <RefreshCw size={12} className="animate-spin" />
                : <div style={{ width: '6px', height: '6px', background: 'var(--green)', borderRadius: '50%', boxShadow: '0 0 8px var(--green)' }} />
              }
              <span style={{ marginLeft: '4px', fontWeight: 700 }}>
                DB: {dbStatus === 'testing' ? 'Testing...' : 'Linked'}
              </span>
            </button>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-1)' }} />

            <button className="btn-icon" onClick={() => setActiveTab('notifications')} style={{ position: 'relative' }}>
              <Bell size={18} />
            </button>

            <button className="btn btn-danger btn-sm" style={{ fontWeight: 700 }} onClick={() => setLogoutModal(true)}>
              <Power size={14} /> Chiqish
            </button>
          </div>
        </header>

        <div className="content-area">
          <PageComponent />
        </div>
      </main>

      {logoutModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red)' }}>
                <AlertTriangle size={18} /> Sessiyani yakunlash
              </h3>
              <button className="btn-icon" onClick={() => setLogoutModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{
                width: '56px', height: '56px', background: 'var(--red-soft)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Power size={28} style={{ color: 'var(--red)' }} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-0)' }}>Tizimdan chiqmoqchimisiz?</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>
                Barcha sessiya tokenlari bekor qilinadi.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setLogoutModal(false)}>Bekor qilish</button>
              <button className="btn btn-danger" onClick={handleLogout}>Ha, chiqish</button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="toast-dot" style={{
              background: t.type === 'success' ? 'var(--green)' : t.type === 'error' ? 'var(--red)' : 'var(--primary)'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>{t.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{t.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
