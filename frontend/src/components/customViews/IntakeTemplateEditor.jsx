import { useEffect, useState } from 'react';
import api from '../../api';

const FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'boolean'];
const INTAKE_TYPES = ['stray', 'owner_surrender', 'transfer', 'return'];
const SPECIES = ['dog', 'cat', 'rabbit', 'other'];

const emptyTemplate = () => ({
  name: '',
  intake_type: 'stray',
  species: 'dog',
  fields: [],
  notes: '',
  active: true,
});

export default function IntakeTemplateEditor() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setErr(null);
    try {
      const r = await api.get('/custom-views/intake-templates');
      setTemplates(r.data.templates || []);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const startNew = () => setEditing(emptyTemplate());
  const startEdit = (t) => setEditing({ ...t, fields: [...t.fields] });
  const cancel = () => setEditing(null);

  const addField = () => {
    setEditing((e) => ({
      ...e,
      fields: [...e.fields, { key: '', label: '', type: 'text', required: false }],
    }));
  };

  const updateField = (idx, k, v) => {
    setEditing((e) => {
      const fields = e.fields.map((f, i) => i === idx ? { ...f, [k]: v } : f);
      return { ...e, fields };
    });
  };

  const removeField = (idx) => {
    setEditing((e) => ({ ...e, fields: e.fields.filter((_, i) => i !== idx) }));
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      if (editing.id) {
        await api.put(`/custom-views/intake-templates/${editing.id}`, editing);
        setMsg(`Updated "${editing.name}"`);
      } else {
        const r = await api.post('/custom-views/intake-templates', editing);
        setMsg(`Created "${r.data.name}"`);
      }
      setEditing(null);
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/custom-views/intake-templates/${id}`);
      setMsg('Template deleted');
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Intake Form Template Editor</h3>
        {!editing && (
          <button onClick={startNew} style={btnPrimary}>+ New Template</button>
        )}
      </div>

      {err && <div style={{ color: 'crimson', marginBottom: 10 }}>Error: {err}</div>}
      {msg && <div style={{ color: '#16a34a', marginBottom: 10, fontSize: 13 }}>{msg}</div>}

      {!editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.length === 0 && <div style={{ color: '#666', fontSize: 13 }}>No templates yet. Click "New Template" to create one.</div>}
          {templates.map((t) => (
            <div key={t.id} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#111' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    <Tag>{t.intake_type}</Tag>
                    <Tag>{t.species}</Tag>
                    <Tag color={t.active ? '#16a34a' : '#9ca3af'}>{t.active ? 'active' : 'inactive'}</Tag>
                    <span style={{ marginLeft: 6 }}>{t.fields.length} fields</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => startEdit(t)} style={btnSecondary}>Edit</button>
                  <button onClick={() => remove(t.id)} style={btnDanger}>Delete</button>
                </div>
              </div>
              {t.notes && <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}>{t.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 14 }}>
          <h4 style={{ marginTop: 0 }}>{editing.id ? 'Edit Template' : 'New Template'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Name">
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} style={inp} />
            </Field>
            <Field label="Intake Type">
              <select value={editing.intake_type} onChange={(e) => setEditing({ ...editing, intake_type: e.target.value })} style={inp}>
                {INTAKE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Species">
              <select value={editing.species} onChange={(e) => setEditing({ ...editing, species: e.target.value })} style={inp}>
                {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              rows={2}
              value={editing.notes}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              style={{ ...inp, resize: 'vertical' }}
            />
          </Field>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={editing.active}
              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
            />
            Active
          </label>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ fontSize: 13 }}>Form Fields</strong>
              <button onClick={addField} style={btnSecondary}>+ Add Field</button>
            </div>
            {editing.fields.length === 0 && <div style={{ fontSize: 12, color: '#666' }}>No fields yet.</div>}
            {editing.fields.map((f, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px 80px 40px', gap: 6, marginBottom: 6 }}>
                <input placeholder="key" value={f.key} onChange={(e) => updateField(idx, 'key', e.target.value)} style={inp} />
                <input placeholder="label" value={f.label} onChange={(e) => updateField(idx, 'label', e.target.value)} style={inp} />
                <select value={f.type} onChange={(e) => updateField(idx, 'type', e.target.value)} style={inp}>
                  {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <input type="checkbox" checked={!!f.required} onChange={(e) => updateField(idx, 'required', e.target.checked)} />
                  required
                </label>
                <button onClick={() => removeField(idx)} style={btnDanger}>X</button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={busy || !editing.name} style={btnPrimary}>
              {busy ? 'Saving...' : 'Save Template'}
            </button>
            <button onClick={cancel} style={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #d1d5db',
  borderRadius: 4,
  fontSize: 13,
  boxSizing: 'border-box',
};
const btnPrimary = {
  background: '#2563eb', color: 'white', padding: '7px 14px',
  border: 0, borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: 13,
};
const btnSecondary = {
  background: '#f3f4f6', color: '#222', padding: '6px 12px',
  border: '1px solid #d1d5db', borderRadius: 5, cursor: 'pointer', fontSize: 13,
};
const btnDanger = {
  background: '#fee2e2', color: '#991b1b', padding: '6px 12px',
  border: '1px solid #fecaca', borderRadius: 5, cursor: 'pointer', fontSize: 13,
};

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginTop: 8 }}>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>{label}</div>
      {children}
    </label>
  );
}
function Tag({ children, color = '#2563eb' }) {
  return (
    <span style={{
      display: 'inline-block', padding: '1px 7px', marginRight: 5,
      background: `${color}22`, color, borderRadius: 10, fontSize: 11, fontWeight: 600,
    }}>{children}</span>
  );
}
