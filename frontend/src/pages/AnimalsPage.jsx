import { useState } from 'react';
import { PawPrint, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const statusBadge = (val) => {
  const map = { available: 'badge-green', adopted: 'badge-blue', foster: 'badge-purple', hold: 'badge-orange', quarantine: 'badge-red', pending: 'badge-yellow', deceased: 'badge-gray' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'species', label: 'Species' },
  { key: 'breed', label: 'Breed' },
  { key: 'age', label: 'Age', render: (v) => v ? `${v} yrs` : '-' },
  { key: 'sex', label: 'Sex' },
  { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
  { key: 'intake_date', label: 'Intake Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const emptyForm = {
  name: '', species: 'dog', breed: '', age: '', sex: 'male', color: '', weight: '',
  microchip_number: '', status: 'available', intake_date: '', intake_type: 'stray',
  description: '', special_needs: '', photo_url: '',
};

export default function AnimalsPage() {
  const { data, loading, error, create, update, remove } = useCrud('/animals');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleField = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const openAdd = () => { setForm({ ...emptyForm }); setEditing(null); setShowModal(true); };
  const openEdit = (row) => {
    setForm({ ...emptyForm, ...row, intake_date: row.intake_date ? row.intake_date.split('T')[0] : '' });
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
          <h2><PawPrint size={24} /> Animal Details</h2>
        </div>
        <DetailView
          title={selected.name}
          fields={[
            { label: 'Species', value: selected.species },
            { label: 'Breed', value: selected.breed },
            { label: 'Age', value: selected.age ? `${selected.age} years` : '-' },
            { label: 'Sex', value: selected.sex },
            { label: 'Color', value: selected.color },
            { label: 'Weight', value: selected.weight ? `${selected.weight} lbs` : '-' },
            { label: 'Microchip', value: selected.microchip_number },
            { label: 'Status', value: selected.status },
            { label: 'Intake Date', value: selected.intake_date ? new Date(selected.intake_date).toLocaleDateString() : '-' },
            { label: 'Intake Type', value: selected.intake_type },
            { label: 'Description', value: selected.description },
            { label: 'Special Needs', value: selected.special_needs },
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
        <h2><PawPrint size={24} /> Animals</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Animal</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Animal' : 'Add Animal'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Name" name="name" value={form.name} onChange={handleField} required />
              <FormField label="Species" name="species" type="select" value={form.species} onChange={handleField} options={[{ value: 'dog', label: 'Dog' }, { value: 'cat', label: 'Cat' }, { value: 'bird', label: 'Bird' }, { value: 'rabbit', label: 'Rabbit' }, { value: 'other', label: 'Other' }]} required />
              <FormField label="Breed" name="breed" value={form.breed} onChange={handleField} />
              <FormField label="Age (years)" name="age" type="number" value={form.age} onChange={handleField} />
              <FormField label="Sex" name="sex" type="select" value={form.sex} onChange={handleField} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
              <FormField label="Color" name="color" value={form.color} onChange={handleField} />
              <FormField label="Weight (lbs)" name="weight" type="number" value={form.weight} onChange={handleField} />
              <FormField label="Microchip Number" name="microchip_number" value={form.microchip_number} onChange={handleField} />
              <FormField label="Status" name="status" type="select" value={form.status} onChange={handleField} options={[{ value: 'available', label: 'Available' }, { value: 'adopted', label: 'Adopted' }, { value: 'foster', label: 'Foster' }, { value: 'hold', label: 'Hold' }, { value: 'quarantine', label: 'Quarantine' }, { value: 'pending', label: 'Pending' }]} />
              <FormField label="Intake Date" name="intake_date" type="date" value={form.intake_date} onChange={handleField} />
              <FormField label="Intake Type" name="intake_type" type="select" value={form.intake_type} onChange={handleField} options={[{ value: 'stray', label: 'Stray' }, { value: 'surrender', label: 'Surrender' }, { value: 'transfer', label: 'Transfer' }, { value: 'return', label: 'Return' }, { value: 'born_in_care', label: 'Born in Care' }]} />
              <FormField label="Photo URL" name="photo_url" value={form.photo_url} onChange={handleField} />
              <FormField label="Description" name="description" type="textarea" value={form.description} onChange={handleField} className="full-width" />
              <FormField label="Special Needs" name="special_needs" type="textarea" value={form.special_needs} onChange={handleField} className="full-width" />
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
