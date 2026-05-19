import { useState } from 'react';
import api from '../../api';

export default function FosterAssignmentScheduler() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [weeks, setWeeks] = useState(2);
  const [focus, setFocus] = useState('all');

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const resp = await api.post('/custom-views/foster-schedule', { weeks, focus });
      setData(resp.data);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginTop: 0 }}>Foster Assignment Scheduler</h3>
      <p style={{ color: '#666', marginTop: 0 }}>Greedily match animals to foster homes based on experience and capacity.</p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'end', marginBottom: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
          <span>Duration (weeks)</span>
          <input type="number" min="1" max="12" value={weeks}
            onChange={(e) => setWeeks(parseInt(e.target.value) || 1)}
            style={{ padding: 6, border: '1px solid #ddd', borderRadius: 4, width: 100 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
          <span>Focus</span>
          <select value={focus} onChange={(e) => setFocus(e.target.value)}
            style={{ padding: 6, border: '1px solid #ddd', borderRadius: 4 }}>
            <option value="all">All</option>
            <option value="puppies">Puppies / Kittens</option>
            <option value="seniors">Seniors</option>
            <option value="medical">Medical</option>
            <option value="general">General</option>
          </select>
        </label>
        <button onClick={run} disabled={busy}
          style={{ background: '#16a34a', color: 'white', border: 0, padding: '8px 18px',
            borderRadius: 6, cursor: busy ? 'wait' : 'pointer', fontWeight: 600 }}>
          {busy ? 'Scheduling...' : 'Run Scheduler'}
        </button>
      </div>

      {err && <div style={{ color: 'crimson' }}>Error: {err}</div>}

      {data && (
        <>
          <div style={{ display: 'flex', gap: 14, marginBottom: 12, fontSize: 13 }}>
            <span>Assigned: <strong>{data.summary.assigned}</strong>/<strong>{data.summary.total_animals}</strong></span>
            <span>Fosters used: <strong>{data.summary.fosters_used}</strong></span>
            <span>Unmatched: <strong>{data.summary.unmatched}</strong></span>
            <span>Avg score: <strong>{data.summary.avg_score}</strong></span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f6f8fa', textAlign: 'left' }}>
                <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>Animal</th>
                <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>Species</th>
                <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>Needs</th>
                <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>Foster</th>
                <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>Score</th>
                <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>Start</th>
                <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>End</th>
                <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.assignments.map((a) => (
                <tr key={a.animal_id}>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                    <strong>{a.animal_name}</strong> <span style={{ color: '#888' }}>({a.animal_id})</span>
                  </td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{a.species}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{a.needs}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{a.foster_name}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{
                      background: a.match_score >= 60 ? '#dcfce7' : (a.match_score >= 30 ? '#fef9c3' : '#fee2e2'),
                      padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    }}>{a.match_score}</span>
                  </td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{a.start_date}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{a.end_date}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0', color: '#555' }}>{a.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.unmatched.length > 0 && (
            <div style={{ marginTop: 12, padding: 10, background: '#fef2f2', borderRadius: 6, fontSize: 13 }}>
              <strong>Unmatched ({data.unmatched.length}):</strong>
              {data.unmatched.map((u) => (
                <div key={u.animal.id}>
                  {u.animal.name} ({u.animal.id}) &mdash; {u.reason}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
