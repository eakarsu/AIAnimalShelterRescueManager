import { useState } from 'react';
import { Stethoscope, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const recordTypeBadge = (val) => {
  const map = { vaccination: 'badge-green', surgery: 'badge-red', treatment: 'badge-blue', checkup: 'badge-purple', spay_neuter: 'badge-orange' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const columns = [
  { key: 'animal_id', label: 'Animal ID' },
  { key: 'record_type', label: 'Type', render: (v) => recordTypeBadge(v) },
  { key: 'description', label: 'Description', render: (v) => v ? (v.length > 50 ? v.substring(0, 50) + '...' : v) : '-' },
  { key: 'veterinarian', label: 'Veterinarian' },
  { key: 'record_date', label: 'Record Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'next_due_date', label: 'Next Due', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const emptyForm = {
  animal_id: '', record_type: 'vaccination', description: '', veterinarian: '', record_date: '', next_due_date: '', notes: '',
};

export default function MedicalPage() {
  const { data, loading, error, create, update, remove } = useCrud('/medical');
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
      record_date: row.record_date ? row.record_date.split('T')[0] : '',
      next_due_date: row.next_due_date ? row.next_due_date.split('T')[0] : '',
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
          <h2><Stethoscope size={24} /> Medical Record Details</h2>
        </div>
        <DetailView
          title={`Medical Record #${selected.id}`}
          fields={[
            { label: 'Animal ID', value: selected.animal_id },
            { label: 'Record Type', value: selected.record_type },
            { label: 'Description', value: selected.description },
            { label: 'Veterinarian', value: selected.veterinarian },
            { label: 'Record Date', value: selected.record_date ? new Date(selected.record_date).toLocaleDateString() : '-' },
            { label: 'Next Due Date', value: selected.next_due_date ? new Date(selected.next_due_date).toLocaleDateString() : '-' },
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
        <h2><Stethoscope size={24} /> Medical Records</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Record</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Medical Record' : 'Add Medical Record'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Animal ID" name="animal_id" type="number" value={form.animal_id} onChange={handleField} required />
              <FormField label="Record Type" name="record_type" type="select" value={form.record_type} onChange={handleField} options={[{ value: 'vaccination', label: 'Vaccination' }, { value: 'surgery', label: 'Surgery' }, { value: 'treatment', label: 'Treatment' }, { value: 'checkup', label: 'Checkup' }, { value: 'spay_neuter', label: 'Spay/Neuter' }, { value: 'dental', label: 'Dental' }, { value: 'microchip', label: 'Microchip' }]} required />
              <FormField label="Veterinarian" name="veterinarian" value={form.veterinarian} onChange={handleField} />
              <FormField label="Record Date" name="record_date" type="date" value={form.record_date} onChange={handleField} />
              <FormField label="Next Due Date" name="next_due_date" type="date" value={form.next_due_date} onChange={handleField} />
              <FormField label="Description" name="description" type="textarea" value={form.description} onChange={handleField} className="full-width" />
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
