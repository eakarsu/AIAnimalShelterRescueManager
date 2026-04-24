import { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const statusBadge = (val) => {
  const map = { active: 'badge-green', inactive: 'badge-gray', suspended: 'badge-red', full: 'badge-orange' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const columns = [
  { key: 'foster_name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'max_animals', label: 'Max Animals' },
  { key: 'current_animals', label: 'Current Animals' },
  { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
];

const emptyForm = {
  foster_name: '', email: '', phone: '', address: '', housing_type: '', has_yard: false,
  max_animals: '', can_foster_dogs: false, can_foster_cats: false, can_foster_medical: false,
  can_foster_behavioral: false, experience: '', status: 'active', notes: '',
};

export default function FostersPage() {
  const { data, loading, error, create, update, remove } = useCrud('/fosters');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleField = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const openAdd = () => { setForm({ ...emptyForm }); setEditing(null); setShowModal(true); };
  const openEdit = (row) => {
    setForm({ ...emptyForm, ...row });
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
          <h2><Users size={24} /> Foster Details</h2>
        </div>
        <DetailView
          title={selected.foster_name}
          fields={[
            { label: 'Email', value: selected.email },
            { label: 'Phone', value: selected.phone },
            { label: 'Address', value: selected.address },
            { label: 'Housing Type', value: selected.housing_type },
            { label: 'Has Yard', value: selected.has_yard ? 'Yes' : 'No' },
            { label: 'Max Animals', value: selected.max_animals },
            { label: 'Current Animals', value: selected.current_animals },
            { label: 'Can Foster Dogs', value: selected.can_foster_dogs ? 'Yes' : 'No' },
            { label: 'Can Foster Cats', value: selected.can_foster_cats ? 'Yes' : 'No' },
            { label: 'Can Foster Medical', value: selected.can_foster_medical ? 'Yes' : 'No' },
            { label: 'Can Foster Behavioral', value: selected.can_foster_behavioral ? 'Yes' : 'No' },
            { label: 'Experience', value: selected.experience },
            { label: 'Status', value: selected.status },
            { label: 'Notes', value: selected.notes },
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
        <h2><Users size={24} /> Fosters</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Foster</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Foster' : 'Add Foster'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Name" name="foster_name" value={form.foster_name} onChange={handleField} required />
              <FormField label="Email" name="email" value={form.email} onChange={handleField} required />
              <FormField label="Phone" name="phone" value={form.phone} onChange={handleField} />
              <FormField label="Address" name="address" type="textarea" value={form.address} onChange={handleField} className="full-width" />
              <FormField label="Housing Type" name="housing_type" type="select" value={form.housing_type} onChange={handleField} options={[{ value: 'house', label: 'House' }, { value: 'apartment', label: 'Apartment' }, { value: 'condo', label: 'Condo' }, { value: 'townhouse', label: 'Townhouse' }]} />
              <FormField label="Has Yard" name="has_yard" type="checkbox" value={form.has_yard} onChange={handleField} />
              <FormField label="Max Animals" name="max_animals" type="number" value={form.max_animals} onChange={handleField} />
              <FormField label="Can Foster Dogs" name="can_foster_dogs" type="checkbox" value={form.can_foster_dogs} onChange={handleField} />
              <FormField label="Can Foster Cats" name="can_foster_cats" type="checkbox" value={form.can_foster_cats} onChange={handleField} />
              <FormField label="Can Foster Medical" name="can_foster_medical" type="checkbox" value={form.can_foster_medical} onChange={handleField} />
              <FormField label="Can Foster Behavioral" name="can_foster_behavioral" type="checkbox" value={form.can_foster_behavioral} onChange={handleField} />
              <FormField label="Experience" name="experience" type="textarea" value={form.experience} onChange={handleField} className="full-width" />
              <FormField label="Status" name="status" type="select" value={form.status} onChange={handleField} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }, { value: 'full', label: 'Full' }]} />
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
