import { useState } from 'react';
import api from '../../api';

export default function AdoptionReportPDF() {
  const [form, setForm] = useState({
    period_start: '2026-01-01',
    period_end: new Date().toISOString().slice(0, 10),
    shelter_name: 'Paws & Hearts Animal Shelter',
    prepared_by: 'Shelter Admin',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [lastDownload, setLastDownload] = useState(null);

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const generate = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await api.post('/custom-views/adoption-report', form, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adoption_report_${form.period_start}_${form.period_end}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setLastDownload(new Date().toLocaleString());
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ margin: 0, marginBottom: 6 }}>Adoption Report PDF</h3>
      <p style={{ color: '#666', marginTop: 0, marginBottom: 14, fontSize: 13 }}>
        Generate a downloadable PDF summarizing adoption metrics for a given period.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Period Start">
          <input type="date" value={form.period_start} onChange={(e) => onChange('period_start', e.target.value)} style={inp} />
        </Field>
        <Field label="Period End">
          <input type="date" value={form.period_end} onChange={(e) => onChange('period_end', e.target.value)} style={inp} />
        </Field>
        <Field label="Shelter Name">
          <input type="text" value={form.shelter_name} onChange={(e) => onChange('shelter_name', e.target.value)} style={inp} />
        </Field>
        <Field label="Prepared By">
          <input type="text" value={form.prepared_by} onChange={(e) => onChange('prepared_by', e.target.value)} style={inp} />
        </Field>
      </div>

      {err && <div style={{ color: 'crimson', marginTop: 10 }}>Error: {err}</div>}

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={generate}
          disabled={busy}
          style={{
            background: '#2563eb',
            color: 'white',
            padding: '9px 18px',
            border: 0,
            borderRadius: 6,
            cursor: busy ? 'wait' : 'pointer',
            fontWeight: 600,
          }}
        >
          {busy ? 'Generating PDF...' : 'Generate Adoption Report PDF'}
        </button>
        {lastDownload && (
          <span style={{ color: '#16a34a', fontSize: 13 }}>Downloaded at {lastDownload}</span>
        )}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: '#666', background: '#f9fafb', padding: 10, borderRadius: 6 }}>
        The report includes total adoptions, species breakdown, fees collected, avg days to adoption,
        live release rate, and recommendations for the chosen period.
      </div>
    </div>
  );
}

const inp = {
  width: '100%',
  padding: '7px 9px',
  border: '1px solid #d1d5db',
  borderRadius: 4,
  fontSize: 13,
};

function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{label}</div>
      {children}
    </label>
  );
}
