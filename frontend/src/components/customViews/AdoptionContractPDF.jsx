import { useState } from 'react';
import api from '../../api';

const defaults = {
  adopter_name: 'Jane Doe',
  adopter_email: 'jane@example.com',
  adopter_phone: '555-0100',
  adopter_address: '123 Main St, Springfield',
  animal_name: 'Bella',
  animal_id: 'A-1042',
  species: 'Dog',
  breed: 'Labrador Mix',
  age: '3 years',
  sex: 'Female',
  adoption_date: new Date().toISOString().slice(0, 10),
  fee: 175,
  microchip: 'MC-9817224',
  vaccinations: 'DHPP, Rabies, Bordetella',
  spay_neuter: 'Spayed',
};

export default function AdoptionContractPDF() {
  const [form, setForm] = useState(defaults);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const generate = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const resp = await api.post('/custom-views/adoption-contract', form, { responseType: 'blob' });
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adoption_contract_${form.animal_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus({ ok: true, msg: `Generated PDF (${blob.size} bytes)` });
    } catch (e) {
      setStatus({ ok: false, msg: e.response?.data?.error || e.message });
    } finally {
      setBusy(false);
    }
  };

  const fields = [
    ['adopter_name', 'Adopter Name'],
    ['adopter_email', 'Adopter Email'],
    ['adopter_phone', 'Adopter Phone'],
    ['adopter_address', 'Adopter Address'],
    ['animal_id', 'Animal ID'],
    ['animal_name', 'Animal Name'],
    ['species', 'Species'],
    ['breed', 'Breed'],
    ['age', 'Age'],
    ['sex', 'Sex'],
    ['microchip', 'Microchip #'],
    ['vaccinations', 'Vaccinations'],
    ['spay_neuter', 'Spay/Neuter'],
    ['adoption_date', 'Adoption Date'],
    ['fee', 'Adoption Fee ($)'],
  ];

  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginTop: 0 }}>Adoption Contract PDF Generator</h3>
      <p style={{ color: '#666', marginTop: 0 }}>Fill the form and generate a downloadable adoption contract PDF.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {fields.map(([k, label]) => (
          <label key={k} style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#444' }}>
            <span style={{ marginBottom: 3 }}>{label}</span>
            <input
              type={k === 'adoption_date' ? 'date' : (k === 'fee' ? 'number' : 'text')}
              value={form[k]}
              onChange={(e) => set(k, e.target.value)}
              style={{ padding: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
            />
          </label>
        ))}
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={generate}
          disabled={busy}
          style={{
            background: '#2563eb', color: 'white', border: 0, padding: '8px 18px',
            borderRadius: 6, cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
          }}
        >
          {busy ? 'Generating...' : 'Generate Contract PDF'}
        </button>
        {status && (
          <span style={{ color: status.ok ? 'green' : 'crimson', fontSize: 13 }}>{status.msg}</span>
        )}
      </div>
    </div>
  );
}
