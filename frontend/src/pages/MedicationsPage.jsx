import { useState } from 'react';
import { Pill, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const statusBadge = (val) => {
  const map = { active: 'badge-green', completed: 'badge-blue', discontinued: 'badge-gray', paused: 'badge-yellow' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const columns = [
  { key: 'animal_id', label: 'Animal ID' },
  { key: 'medication_name', label: 'Medication' },
  { key: 'dosage', label: 'Dosage' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'route', label: 'Route' },
  { key: 'administered_by', label: 'Administered By' },
  { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
];

const emptyForm = {
  animal_id: '', medication_name: '', dosage: '', frequency: 'once_daily', route: 'oral',
  start_date: '', end_date: '', administered_by: '', status: 'active', side_effects: '', notes: '',
};

export default function MedicationsPage() {
  const { data, loading, error, create, update, remove } = useCrud('/medications');
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
      end_date: row.end_date ? row.end_date.split('T')[0] : '',
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
          <h2><Pill size={24} /> Medication Details</h2>
        </div>
        <DetailView
          title={`${selected.medication_name || 'Medication'} #${selected.id}`}
          fields={[
            { label: 'Animal ID', value: selected.animal_id },
            { label: 'Medication Name', value: selected.medication_name },
            { label: 'Dosage', value: selected.dosage },
            { label: 'Frequency', value: selected.frequency },
            { label: 'Route', value: selected.route },
            { label: 'Start Date', value: selected.start_date ? new Date(selected.start_date).toLocaleDateString() : '-' },
            { label: 'End Date', value: selected.end_date ? new Date(selected.end_date).toLocaleDateString() : '-' },
            { label: 'Administered By', value: selected.administered_by },
            { label: 'Status', value: selected.status },
            { label: 'Side Effects', value: selected.side_effects },
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
        <h2><Pill size={24} /> Medications</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Medication</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Medication' : 'Add Medication'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Animal ID" name="animal_id" type="number" value={form.animal_id} onChange={handleField} required />
              <FormField label="Medication Name" name="medication_name" value={form.medication_name} onChange={handleField} required />
              <FormField label="Dosage" name="dosage" value={form.dosage} onChange={handleField} />
              <FormField label="Frequency" name="frequency" type="select" value={form.frequency} onChange={handleField} options={[{ value: 'once_daily', label: 'Once Daily' }, { value: 'twice_daily', label: 'Twice Daily' }, { value: 'three_times_daily', label: 'Three Times Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'as_needed', label: 'As Needed' }]} />
              <FormField label="Route" name="route" type="select" value={form.route} onChange={handleField} options={[{ value: 'oral', label: 'Oral' }, { value: 'injection', label: 'Injection' }, { value: 'topical', label: 'Topical' }, { value: 'eye_drops', label: 'Eye Drops' }, { value: 'ear_drops', label: 'Ear Drops' }]} />
              <FormField label="Start Date" name="start_date" type="date" value={form.start_date} onChange={handleField} />
              <FormField label="End Date" name="end_date" type="date" value={form.end_date} onChange={handleField} />
              <FormField label="Administered By" name="administered_by" value={form.administered_by} onChange={handleField} />
              <FormField label="Status" name="status" type="select" value={form.status} onChange={handleField} options={[{ value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }, { value: 'discontinued', label: 'Discontinued' }, { value: 'paused', label: 'Paused' }]} />
              <FormField label="Side Effects" name="side_effects" type="textarea" value={form.side_effects} onChange={handleField} className="full-width" />
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
