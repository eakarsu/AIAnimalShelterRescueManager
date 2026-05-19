import { useEffect, useState } from 'react';
import api from '../../api';

const STATUS_COLORS = {
  occupied: '#ef4444',
  available: '#22c55e',
  cleaning: '#eab308',
  maintenance: '#9ca3af',
};

export default function KennelOccupancyGrid() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    api.get('/custom-views/kennel-occupancy')
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.response?.data?.error || e.message));
  }, []);

  if (err) return <div style={{ color: 'crimson' }}>Error: {err}</div>;
  if (!data) return <div>Loading kennel occupancy...</div>;

  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Kennel Occupancy Grid</h3>
        <div style={{ fontSize: 13, color: '#555' }}>
          <strong>{data.summary.occupied}</strong> occupied / <strong>{data.summary.total}</strong> total
          &nbsp;({data.summary.occupancy_rate}%)
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 12, fontSize: 12 }}>
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 12, background: v, borderRadius: 2, display: 'inline-block' }} />
            <span style={{ textTransform: 'capitalize' }}>{k}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {data.grid.map((b) => (
          <div key={b.building}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: '#333' }}>{b.building}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {b.rows.map((row) => (
                <div key={row.row} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <div style={{ width: 18, fontSize: 11, color: '#666' }}>{row.row}</div>
                  {row.cells.map((c) => (
                    <div
                      key={c.kennel_number}
                      onMouseEnter={() => setHover(c)}
                      onMouseLeave={() => setHover(null)}
                      title={`${c.kennel_number} - ${c.status}${c.animal ? ` (${c.animal.name})` : ''}`}
                      style={{
                        width: 38, height: 38, borderRadius: 4, background: STATUS_COLORS[c.status],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                        border: hover && hover.kennel_number === c.kennel_number ? '2px solid #111' : '1px solid rgba(0,0,0,0.1)',
                      }}
                    >
                      {c.kennel_number}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hover && (
        <div style={{ marginTop: 12, padding: 10, background: '#f6f8fa', borderRadius: 6, fontSize: 13 }}>
          <strong>{hover.building} / {hover.kennel_number}</strong> &mdash; status: {hover.status}, capacity: {hover.capacity}
          {hover.animal && (
            <span> &mdash; {hover.animal.name} ({hover.animal.species}), {hover.animal.days_in_kennel} days</span>
          )}
        </div>
      )}
    </div>
  );
}
