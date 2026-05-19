import { useEffect, useState } from 'react';
import api from '../../api';

export default function IntakeVsOutcomeTrend() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [days, setDays] = useState(30);

  const load = (d) => {
    setData(null);
    setErr(null);
    api.get(`/custom-views/intake-vs-outcome?days=${d}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.response?.data?.error || e.message));
  };

  useEffect(() => { load(days); }, [days]);

  if (err) return <div style={{ color: 'crimson' }}>Error: {err}</div>;
  if (!data) return <div>Loading intake vs outcome trend...</div>;

  const W = 800;
  const H = 240;
  const PAD = { l: 36, r: 12, t: 12, b: 28 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const max = Math.max(data.summary.max_value, 10);
  const n = data.series.length;
  const xStep = innerW / Math.max(n - 1, 1);

  const buildPath = (key) =>
    data.series
      .map((s, i) => {
        const x = PAD.l + i * xStep;
        const y = PAD.t + innerH - (s[key] / max) * innerH;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Intake vs Outcome Trend</h3>
        <div>
          {[14, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                marginLeft: 6,
                padding: '4px 10px',
                fontSize: 12,
                background: days === d ? '#2563eb' : '#f3f4f6',
                color: days === d ? 'white' : '#333',
                border: 0,
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >{d}d</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <Stat label="Total Intakes" value={data.summary.total_intakes} color="#2563eb" />
        <Stat label="Total Outcomes" value={data.summary.total_outcomes} color="#16a34a" />
        <Stat label="Net Change" value={data.summary.net_population_change} color="#f59e0b" />
        <Stat label="Live Release Rate" value={`${data.summary.live_release_rate}%`} color="#10b981" />
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background: '#fafbfc', borderRadius: 6 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = PAD.t + innerH * (1 - t);
          return (
            <g key={i}>
              <line x1={PAD.l} x2={PAD.l + innerW} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="3,3" />
              <text x={PAD.l - 6} y={y + 3} fontSize="10" fill="#6b7280" textAnchor="end">{Math.round(max * t)}</text>
            </g>
          );
        })}
        <path d={buildPath('intakes')} stroke="#2563eb" strokeWidth="2.4" fill="none" />
        <path d={buildPath('outcomes')} stroke="#16a34a" strokeWidth="2.4" fill="none" />
        {data.series.map((s, i) => {
          const x = PAD.l + i * xStep;
          if (i % Math.max(1, Math.floor(n / 8)) !== 0) return null;
          return (
            <text key={i} x={x} y={H - 8} fontSize="9" fill="#6b7280" textAnchor="middle">
              {s.date.slice(5)}
            </text>
          );
        })}
      </svg>

      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#444' }}>
        <Legend color="#2563eb" label="Intakes" />
        <Legend color="#16a34a" label="Outcomes" />
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 12 }}>
        <Stat label="Adoptions" value={data.summary.adoptions} color="#0ea5e9" />
        <Stat label="Transfers" value={data.summary.transfers} color="#a855f7" />
        <Stat label="Returns to Owner" value={data.summary.returns_to_owner} color="#f97316" />
        <Stat label="Euthanasia" value={data.summary.euthanasia} color="#6b7280" />
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background: '#f6f8fa', borderRadius: 6, padding: 10, borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginTop: 2 }}>{value}</div>
    </div>
  );
}
function Legend({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 14, height: 3, background: color, display: 'inline-block', borderRadius: 2 }} />
      {label}
    </span>
  );
}
