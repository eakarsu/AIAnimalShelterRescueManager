import { useState } from 'react';
import { LayoutGrid, BarChart3, FileText, CalendarClock, TrendingUp, Thermometer, FileBarChart, ClipboardEdit } from 'lucide-react';
import KennelOccupancyGrid from '../components/customViews/KennelOccupancyGrid';
import IntakeTimeline from '../components/customViews/IntakeTimeline';
import AdoptionContractPDF from '../components/customViews/AdoptionContractPDF';
import FosterAssignmentScheduler from '../components/customViews/FosterAssignmentScheduler';
import IntakeVsOutcomeTrend from '../components/customViews/IntakeVsOutcomeTrend';
import OccupancyHeatmap from '../components/customViews/OccupancyHeatmap';
import AdoptionReportPDF from '../components/customViews/AdoptionReportPDF';
import IntakeTemplateEditor from '../components/customViews/IntakeTemplateEditor';

const TABS = [
  { key: 'intake-outcome', label: 'Intake vs Outcome', icon: TrendingUp, component: IntakeVsOutcomeTrend },
  { key: 'occupancy-heatmap', label: 'Occupancy Heatmap', icon: Thermometer, component: OccupancyHeatmap },
  { key: 'adoption-report', label: 'Adoption Report PDF', icon: FileBarChart, component: AdoptionReportPDF },
  { key: 'intake-templates', label: 'Intake Templates', icon: ClipboardEdit, component: IntakeTemplateEditor },
  { key: 'occupancy', label: 'Kennel Occupancy', icon: LayoutGrid, component: KennelOccupancyGrid },
  { key: 'intake', label: 'Intake Timeline', icon: BarChart3, component: IntakeTimeline },
  { key: 'contract', label: 'Adoption Contract PDF', icon: FileText, component: AdoptionContractPDF },
  { key: 'foster', label: 'Foster Scheduler', icon: CalendarClock, component: FosterAssignmentScheduler },
];

export default function CustomViewsPage() {
  const [active, setActive] = useState('intake-outcome');
  const ActiveComp = TABS.find((t) => t.key === active).component;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Shelter Views</h2>
        <p style={{ color: '#666', marginTop: 4 }}>
          Custom operational dashboards and tools for shelter management.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e5e7eb', marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent',
                border: 0,
                borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
                color: isActive ? '#2563eb' : '#555',
                padding: '10px 14px',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div data-testid={`custom-view-${active}`}>
        <ActiveComp />
      </div>
    </div>
  );
}
