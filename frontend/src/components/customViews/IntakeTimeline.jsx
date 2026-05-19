import { useEffect, useState } from 'react';
import api from '../../api';

export default function IntakeTimeline() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [days, setDays] = useState(30);

  const load = (d) => {
    setData(null);
    api.get(`/custom-views/intake-timeline?days=${d}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.response?.data?.error || e.message));
  };

  useEffect(() => { load(days); }, [days]);

  if (err) return <div style={{ color: 'crimson' }}>Error: {err}</div>;
  if (!data) return <div>Loading intake timeline...</div>;

  const W = 720;
  const H = 240;
  const padL = 38;
  const padB = 28;
  const padT = 10;
  const max = data.summary.max_total || 1;
  const colW = (W - padL - 10) / data.series.length;
  const chartH = H - padB - padT;

  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Intake Timeline</h3>
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 10, fontSize: 13 }}>
        <div><strong>{data.summary.total_intakes}</strong> intakes</div>
        <div>Dogs: <strong>{data.summary.total_dogs}</strong></div>
        <div>Cats: <strong>{data.summary.total_cats}</strong></div>
        <div>Other: <strong>{data.summary.total_other}</strong></div>
        <div>Avg/day: <strong>{data.summary.avg_per_day}</strong></div>
        <div>Peak: <strong>{data.summary.peak_day}</strong></div>
      </div>

      <svg width={W} height={H} style={{ background: '#fafbfc', border: '1px solid #eee', borderRadius: 6 }}>
        {/* y gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const y = padT + chartH * (1 - p);
          return (
            <g key={p}>
              <line x1={padL} y1={y} x2={W - 10} y2={y} stroke="#eee" />
              <text x={padL - 6} y={y + 3} fontSize="10" textAnchor="end" fill="#888">
                {Math.round(max * p)}
              </text>
            </g>
          );
        })}

        {data.series.map((s, i) => {
          const x = padL + i * colW;
          const dogsH = (s.dogs / max) * chartH;
          const catsH = (s.cats / max) * chartH;
          const otherH = (s.other / max) * chartH;
          const barW = Math.max(2, colW - 2);
          let y = padT + chartH;
          return (
            <g key={s.date}>
              <rect x={x} y={y - dogsH} width={barW} height={dogsH} fill="#3b82f6" />
              <rect x={x} y={y - dogsH - catsH} width={barW} height={catsH} fill="#f59e0b" />
              <rect x={x} y={y - dogsH - catsH - otherH} width={barW} height={otherH} fill="#10b981" />
              {i % Math.ceil(data.series.length / 10) === 0 && (
                <text x={x + barW / 2} y={H - 10} fontSize="9" textAnchor="middle" fill="#666">
                  {s.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, background: '#3b82f6', display: 'inline-block' }} /> Dogs
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, background: '#f59e0b', display: 'inline-block' }} /> Cats
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, background: '#10b981', display: 'inline-block' }} /> Other
        </span>
      </div>
    </div>
  );
}
