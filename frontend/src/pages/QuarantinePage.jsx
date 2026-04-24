import { useState } from 'react';
import { ShieldAlert, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const statusBadge = (val) => {
  const map = { active: 'badge-red', completed: 'badge-green', extended: 'badge-orange', released: 'badge-blue' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const columns = [
  { key: 'animal_id', label: 'Animal ID' },
  { key: 'reason', label: 'Reason' },
  { key: 'start_date', label: 'Start Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'expected_end_date', label: 'Expected End', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'location', label: 'Location' },
  { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
];

const emptyForm = {
  animal_id: '', reason: 'infectious_disease', start_date: '', expected_end_date: '', actual_end_date: '',
  location: '', monitoring_notes: '', veterinarian: '', status: 'active', release_approved_by: '', notes: '',
};

export default function QuarantinePage() {
  const { data, loading, error, create, update, remove } = useCrud('/quarantine');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleField = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const openAdd = () => { setForm({ ...emptyForm }); setEditing(null); setShowModal(true); };
  const openEdit = (row) => {
    setForm({
      ...emptyForm, ...row,
      start_date: row.start_date ? row.start_date.split('T')[0] : '',
      expected_end_date: row.expected_end_date ? row.expected_end_date.split('T')[0] : '',
      actual_end_date: row.actual_end_date ? row.actual_end_date.split('T')[0] : '',
    });
    setEditing(row);
    setShowModal(true);
    setSelected(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id, form);
      } else {
        await create(form);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove(confirmDelete.id);
      setConfirmDelete(null);
      setSelected(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
      setConfirmDelete(null);
    }
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h2><ShieldAlert size={24} /> Quarantine Details</h2>
        </div>
        <DetailView
          title={`Quarantine #${selected.id}`}
          fields={[
            { label: 'Animal ID', value: selected.animal_id },
            { label: 'Reason', value: selected.reason },
            { label: 'Start Date', value: selected.start_date ? new Date(selected.start_date).toLocaleDateString() : '-' },
            { label: 'Expected End Date', value: selected.expected_end_date ? new Date(selected.expected_end_date).toLocaleDateString() : '-' },
            { label: 'Actual End Date', value: selected.actual_end_date ? new Date(selected.actual_end_date).toLocaleDateString() : '-' },
            { label: 'Location', value: selected.location },
            { label: 'Monitoring Notes', value: selected.monitoring_notes },
            { label: 'Veterinarian', value: selected.veterinarian },
            { label: 'Status', value: selected.status },
            { label: 'Release Approved By', value: selected.release_approved_by },
            { label: 'Notes', value: selected.notes },
            { label: 'Created At', value: selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '-' },
          ]}
          onEdit={() => openEdit(selected)}
          onDelete={() => setConfirmDelete(selected)}
          onClose={() => setSelected(null)}
        />
        <ConfirmDialog
          isOpen={!!confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2><ShieldAlert size={24} /> Quarantine</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Quarantine</button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {loading ? <div className="loading-spinner" /> : (
        <DataTable
          columns={columns}
          data={data}
          onRowClick={setSelected}
          onEdit={openEdit}
          onDelete={(row) => setConfirmDelete(row)}
        />
      )}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Quarantine' : 'Add Quarantine'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Animal ID" name="animal_id" type="number" value={form.animal_id} onChange={handleField} required />
              <FormField label="Reason" name="reason" type="select" value={form.reason} onChange={handleField} options={[{ value: 'infectious_disease', label: 'Infectious Disease' }, { value: 'bite_quarantine', label: 'Bite Quarantine' }, { value: 'observation', label: 'Observation' }, { value: 'new_intake', label: 'New Intake' }, { value: 'ringworm', label: 'Ringworm' }, { value: 'upper_respiratory', label: 'Upper Respiratory' }]} required />
              <FormField label="Start Date" name="start_date" type="date" value={form.start_date} onChange={handleField} />
              <FormField label="Expected End Date" name="expected_end_date" type="date" value={form.expected_end_date} onChange={handleField} />
              <FormField label="Actual End Date" name="actual_end_date" type="date" value={form.actual_end_date} onChange={handleField} />
              <FormField label="Location" name="location" value={form.location} onChange={handleField} />
              <FormField label="Veterinarian" name="veterinarian" value={form.veterinarian} onChange={handleField} />
              <FormField label="Status" name="status" type="select" value={form.status} onChange={handleField} options={[{ value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }, { value: 'extended', label: 'Extended' }, { value: 'released', label: 'Released' }]} />
              <FormField label="Release Approved By" name="release_approved_by" value={form.release_approved_by} onChange={handleField} />
              <FormField label="Monitoring Notes" name="monitoring_notes" type="textarea" value={form.monitoring_notes} onChange={handleField} className="full-width" />
              <FormField label="Notes" name="notes" type="textarea" value={form.notes} onChange={handleField} className="full-width" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
