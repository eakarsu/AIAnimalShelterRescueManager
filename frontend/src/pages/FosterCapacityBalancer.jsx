import { useEffect, useState } from 'react';

export default function FosterCapacityBalancer() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/foster-capacity-balancer')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="page">
      <h1>Foster Capacity Balancer</h1>
      <p>Match urgent placements to foster capacity, skills, and household constraints.</p>
      <div className="dashboard-grid">
        {data && Object.entries(data.summary).map(([key, value]) => (
          <div className="card" key={key}>
            <h3>{key.replaceAll('_', ' ')}</h3>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="card">
        {(data?.placements || []).map((placement) => (
          <div key={placement.animal} style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
            <strong>{placement.animal}</strong>
            <div>{placement.foster} - fit {placement.fit_score}% - {placement.action}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
