import { useEffect, useState } from 'react';
import api from '../../api';

function colorFor(v) {
  // 0 cool -> 100 hot, blue -> red gradient
  const clamped = Math.max(0, Math.min(100, v));
  const r = Math.round(40 + (clamped / 100) * 200);
  const g = Math.round(180 - (clamped / 100) * 130);
  const b = Math.round(220 - (clamped / 100) * 200);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function OccupancyHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [weeks, setWeeks] = useState(8);
  const [hover, setHover] = useState(null);

  const load = (w) => {
    setData(null);
    setErr(null);
    api.get(`/custom-views/occupancy-heatmap?weeks=${w}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.response?.data?.error || e.message));
  };

  useEffect(() => { load(weeks); }, [weeks]);

  if (err) return <div style={{ color: 'crimson' }}>Error: {err}</div>;
  if (!data) return <div>Loading occupancy heatmap...</div>;

  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Kennel Occupancy Heatmap</h3>
        <div>
          {[4, 8, 12, 26].map((w) => (
            <button
              key={w}
              onClick={() => setWeeks(w)}
              style={{
                marginLeft: 6,
                padding: '4px 10px',
                fontSize: 12,
                background: weeks === w ? '#2563eb' : '#f3f4f6',
                color: weeks === w ? 'white' : '#333',
                border: 0, borderRadius: 4, cursor: 'pointer',
              }}
            >{w}w</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <Stat label="Avg Occupancy" value={`${data.summary.avg_occupancy}%`} color="#2563eb" />
        <Stat label="Peak" value={`${data.summary.peak_overall}%`} color="#dc2626" />
        <Stat label="Hottest Bldg" value={data.summary.hottest_building} color="#f97316" />
        <Stat label="Coolest Bldg" value={data.summary.coolest_building} color="#0ea5e9" />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px', color: '#555' }}>Building</th>
              {data.week_labels.map((wl) => (
                <th key={wl} style={{ padding: '4px 2px', color: '#666', fontWeight: 500, fontSize: 11 }}>{wl}</th>
              ))}
              <th style={{ padding: '4px 8px', color: '#555' }}>Avg</th>
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row) => (
              <tr key={row.building}>
                <td style={{ padding: '4px 8px', fontWeight: 600, color: '#222' }}>{row.building}</td>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    onMouseEnter={() => setHover({ building: row.building, week: data.week_labels[i], value: v })}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      background: colorFor(v),
                      color: v > 70 ? 'white' : '#111',
                      textAlign: 'center',
                      padding: '8px 4px',
                      borderRadius: 3,
                      border: '1px solid white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      minWidth: 38,
                    }}
                    title={`${row.building} ${data.week_labels[i]}: ${v}%`}
                  >
                    {v}
                  </td>
                ))}
                <td style={{ padding: '4px 8px', fontWeight: 600, color: '#444' }}>{row.avg}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hover && (
        <div style={{ marginTop: 10, padding: 10, background: '#f6f8fa', borderRadius: 6, fontSize: 13 }}>
          <strong>{hover.building}</strong> &mdash; {hover.week}: <strong>{hover.value}%</strong> occupancy
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 11, color: '#555' }}>
        Cool
        {[10, 25, 40, 55, 70, 85, 100].map((v) => (
          <span key={v} style={{ width: 22, height: 14, background: colorFor(v), display: 'inline-block', borderRadius: 2 }} />
        ))}
        Hot
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background: '#f6f8fa', borderRadius: 6, padding: 10, borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginTop: 2 }}>{value}</div>
    </div>
  );
}
