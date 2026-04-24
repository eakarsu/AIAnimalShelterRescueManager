import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PawPrint, Home, Stethoscope, Brain, Heart, FileText, Users, HandHeart,
  DollarSign, Package, Search, Clock, Calendar, Pill, ShieldAlert, Sparkles
} from 'lucide-react';
import api from '../api';

const cards = [
  { key: 'animals', label: 'Animals', icon: PawPrint, color: '#2563eb', bg: '#eff6ff', path: '/animals', desc: 'Manage shelter animals', endpoint: '/animals' },
  { key: 'kennels', label: 'Kennels', icon: Home, color: '#059669', bg: '#ecfdf5', path: '/kennels', desc: 'Kennel assignments & status', endpoint: '/kennels' },
  { key: 'medical', label: 'Medical Records', icon: Stethoscope, color: '#dc2626', bg: '#fef2f2', path: '/medical', desc: 'Health & veterinary records', endpoint: '/medical' },
  { key: 'behavioral', label: 'Behavioral', icon: Brain, color: '#7c3aed', bg: '#f5f3ff', path: '/behavioral', desc: 'Behavior assessments', endpoint: '/behavioral' },
  { key: 'adoptions', label: 'Applications', icon: Heart, color: '#ec4899', bg: '#fdf2f8', path: '/adoptions', desc: 'Adoption applications', endpoint: '/adoptions/applications' },
  { key: 'contracts', label: 'Contracts', icon: FileText, color: '#4f46e5', bg: '#eef2ff', path: '/contracts', desc: 'Adoption contracts', endpoint: '/adoptions/contracts' },
  { key: 'fosters', label: 'Foster Homes', icon: Users, color: '#0d9488', bg: '#f0fdfa', path: '/fosters', desc: 'Foster family management', endpoint: '/fosters' },
  { key: 'volunteers', label: 'Volunteers', icon: HandHeart, color: '#d97706', bg: '#fffbeb', path: '/volunteers', desc: 'Volunteer coordination', endpoint: '/volunteers' },
  { key: 'donations', label: 'Donations', icon: DollarSign, color: '#10b981', bg: '#ecfdf5', path: '/donations', desc: 'Donation tracking', endpoint: '/donations' },
  { key: 'inventory', label: 'Inventory', icon: Package, color: '#d97706', bg: '#fffbeb', path: '/inventory', desc: 'Supply management', endpoint: '/inventory' },
  { key: 'lostfound', label: 'Lost & Found', icon: Search, color: '#eab308', bg: '#fefce8', path: '/lostfound', desc: 'Lost & found reports', endpoint: '/lostfound' },
  { key: 'strayholds', label: 'Stray Holds', icon: Clock, color: '#64748b', bg: '#f8fafc', path: '/strayholds', desc: 'Stray hold tracking', endpoint: '/strayholds' },
  { key: 'events', label: 'Events', icon: Calendar, color: '#8b5cf6', bg: '#f5f3ff', path: '/events', desc: 'Shelter events', endpoint: '/events' },
  { key: 'medications', label: 'Medications', icon: Pill, color: '#f43f5e', bg: '#fff1f2', path: '/medications', desc: 'Medication tracking', endpoint: '/medications' },
  { key: 'quarantine', label: 'Quarantine', icon: ShieldAlert, color: '#dc2626', bg: '#fef2f2', path: '/quarantine', desc: 'Quarantine management', endpoint: '/quarantine' },
  { key: 'ai', label: 'AI Tools', icon: Sparkles, color: '#7c3aed', bg: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', path: '/ai', desc: 'AI-powered tools', endpoint: null },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchCounts = async () => {
      const results = {};
      for (const card of cards) {
        if (card.endpoint) {
          try {
            const res = await api.get(card.endpoint);
            const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.rows || []);
            results[card.key] = Array.isArray(data) ? data.length : 0;
          } catch {
            results[card.key] = 0;
          }
        }
      }
      setCounts(results);
    };
    fetchCounts();
  }, []);

  return (
    <div>
      <div className="welcome-banner">
        <h2>Welcome back, {user.first_name || 'Admin'}!</h2>
        <p>Here is an overview of your shelter operations.</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff' }}>
            <PawPrint size={24} color="#2563eb" />
          </div>
          <div className="stat-info">
            <h4>{counts.animals || 0}</h4>
            <p>Total Animals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fdf2f8' }}>
            <Heart size={24} color="#ec4899" />
          </div>
          <div className="stat-info">
            <h4>{counts.adoptions || 0}</h4>
            <p>Applications</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb' }}>
            <HandHeart size={24} color="#d97706" />
          </div>
          <div className="stat-info">
            <h4>{counts.volunteers || 0}</h4>
            <p>Volunteers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5' }}>
            <DollarSign size={24} color="#10b981" />
          </div>
          <div className="stat-info">
            <h4>{counts.donations || 0}</h4>
            <p>Donations</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          const isGradient = card.bg.includes('gradient');
          return (
            <div
              key={card.key}
              className="dashboard-card"
              onClick={() => navigate(card.path)}
              style={{ '--card-color': card.color }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: card.color }} />
              <div className="dashboard-card-icon" style={{ background: isGradient ? card.bg : card.bg }}>
                <Icon size={22} color={card.color} />
              </div>
              <h3>{card.label}</h3>
              {card.endpoint && <div className="card-count">{counts[card.key] ?? '-'}</div>}
              <div className="card-desc">{card.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
