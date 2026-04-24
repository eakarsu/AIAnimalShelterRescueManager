import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const statusBadge = (val) => {
  const map = { active: 'badge-green', completed: 'badge-blue', voided: 'badge-red', pending: 'badge-yellow' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'adopter_name', label: 'Adopter' },
  { key: 'animal_id', label: 'Animal ID' },
  { key: 'adoption_date', label: 'Adoption Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'adoption_fee', label: 'Fee', render: (v) => v !== null && v !== undefined ? `$${v}` : '-' },
  { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
];

const emptyForm = {
  application_id: '', animal_id: '', adopter_name: '', adoption_date: '', adoption_fee: '',
  spay_neuter_required: false, return_policy: '', special_conditions: '', status: 'pending',
};

export default function ContractsPage() {
  const { data, loading, error, create, update, remove } = useCrud('/adoptions/contracts');
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
      adoption_date: row.adoption_date ? row.adoption_date.split('T')[0] : '',
      spay_neuter_required: !!row.spay_neuter_required,
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
          <h2><FileText size={24} /> Contract Details</h2>
        </div>
        <DetailView
          title={`Contract #${selected.id}`}
          fields={[
            { label: 'ID', value: selected.id },
            { label: 'Application ID', value: selected.application_id },
            { label: 'Animal ID', value: selected.animal_id },
            { label: 'Adopter Name', value: selected.adopter_name },
            { label: 'Adoption Date', value: selected.adoption_date ? new Date(selected.adoption_date).toLocaleDateString() : '-' },
            { label: 'Adoption Fee', value: selected.adoption_fee !== null && selected.adoption_fee !== undefined ? `$${selected.adoption_fee}` : '-' },
            { label: 'Spay/Neuter Required', value: selected.spay_neuter_required ? 'Yes' : 'No' },
            { label: 'Return Policy', value: selected.return_policy },
            { label: 'Special Conditions', value: selected.special_conditions },
            { label: 'Status', value: selected.status },
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
        <h2><FileText size={24} /> Adoption Contracts</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Contract</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Contract' : 'Add Contract'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Application ID" name="application_id" type="number" value={form.application_id} onChange={handleField} />
              <FormField label="Animal ID" name="animal_id" type="number" value={form.animal_id} onChange={handleField} required />
              <FormField label="Adopter Name" name="adopter_name" value={form.adopter_name} onChange={handleField} required />
              <FormField label="Adoption Date" name="adoption_date" type="date" value={form.adoption_date} onChange={handleField} />
              <FormField label="Adoption Fee" name="adoption_fee" type="number" value={form.adoption_fee} onChange={handleField} />
              <FormField label="Spay/Neuter Required" name="spay_neuter_required" type="checkbox" value={form.spay_neuter_required} onChange={handleField} />
              <FormField label="Return Policy" name="return_policy" type="textarea" value={form.return_policy} onChange={handleField} className="full-width" />
              <FormField label="Special Conditions" name="special_conditions" type="textarea" value={form.special_conditions} onChange={handleField} className="full-width" />
              <FormField label="Status" name="status" type="select" value={form.status} onChange={handleField} options={[{ value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }, { value: 'voided', label: 'Voided' }, { value: 'pending', label: 'Pending' }]} />
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
