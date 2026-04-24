import { useNavigate, useLocation } from 'react-router-dom';
import {
  PawPrint, Home, Stethoscope, Brain, Heart, FileText, Users, HandHeart,
  DollarSign, Package, Search, Clock, Calendar, Pill, ShieldAlert, Sparkles,
  LogOut, LayoutDashboard
} from 'lucide-react';

const navSections = [
  {
    title: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Animal Management',
    items: [
      { path: '/animals', label: 'Animals', icon: PawPrint },
      { path: '/kennels', label: 'Kennels', icon: Home },
      { path: '/medical', label: 'Medical Records', icon: Stethoscope },
      { path: '/behavioral', label: 'Behavioral', icon: Brain },
      { path: '/medications', label: 'Medications', icon: Pill },
      { path: '/quarantine', label: 'Quarantine', icon: ShieldAlert },
    ]
  },
  {
    title: 'Adoption & Foster',
    items: [
      { path: '/adoptions', label: 'Applications', icon: Heart },
      { path: '/contracts', label: 'Contracts', icon: FileText },
      { path: '/fosters', label: 'Foster Homes', icon: Users },
    ]
  },
  {
    title: 'People & Resources',
    items: [
      { path: '/volunteers', label: 'Volunteers', icon: HandHeart },
      { path: '/donations', label: 'Donations', icon: DollarSign },
      { path: '/inventory', label: 'Inventory', icon: Package },
      { path: '/events', label: 'Events', icon: Calendar },
    ]
  },
  {
    title: 'Operations',
    items: [
      { path: '/lostfound', label: 'Lost & Found', icon: Search },
      { path: '/strayholds', label: 'Stray Holds', icon: Clock },
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { path: '/ai', label: 'AI Tools', icon: Sparkles },
    ]
  },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>
          <PawPrint size={24} />
          Animal Shelter & Rescue Manager
        </h1>
        <div className="header-right">
          <span className="header-user">
            {user.first_name ? `${user.first_name} ${user.last_name}` : user.email || 'User'}
          </span>
          <button className="header-logout" onClick={handleLogout}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </header>
      <div className="app-body">
        <nav className="sidebar">
          {navSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              <div className="sidebar-section-title">{section.title}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.path}
                    className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon size={18} />
                    {item.label}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
