import { useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const statusBadge = (val) => {
  const map = { pending: 'badge-yellow', approved: 'badge-green', denied: 'badge-red', review: 'badge-blue', withdrawn: 'badge-gray' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const columns = [
  { key: 'applicant_name', label: 'Applicant' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'preferred_species', label: 'Species' },
  { key: 'preferred_breed', label: 'Breed' },
  { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
  { key: 'application_date', label: 'Applied', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const emptyForm = {
  applicant_name: '', email: '', phone: '', address: '', housing_type: 'house',
  has_yard: false, has_other_pets: false, other_pets_details: '', has_children: false,
  children_ages: '', experience: '', preferred_species: '', preferred_breed: '',
  preferred_age: '', preferred_size: 'any', reason: '', veterinarian_reference: '',
  animal_id: '', status: 'pending', notes: '',
};

export default function AdoptionsPage() {
  const { data, loading, error, create, update, remove } = useCrud('/adoptions/applications');
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
      application_date: row.application_date ? row.application_date.split('T')[0] : '',
      has_yard: !!row.has_yard,
      has_other_pets: !!row.has_other_pets,
      has_children: !!row.has_children,
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
          <h2><Heart size={24} /> Adoption Application Details</h2>
        </div>
        <DetailView
          title={selected.applicant_name}
          fields={[
            { label: 'Applicant Name', value: selected.applicant_name },
            { label: 'Email', value: selected.email },
            { label: 'Phone', value: selected.phone },
            { label: 'Address', value: selected.address },
            { label: 'Housing Type', value: selected.housing_type },
            { label: 'Has Yard', value: selected.has_yard ? 'Yes' : 'No' },
            { label: 'Has Other Pets', value: selected.has_other_pets ? 'Yes' : 'No' },
            { label: 'Other Pets Details', value: selected.other_pets_details },
            { label: 'Has Children', value: selected.has_children ? 'Yes' : 'No' },
            { label: 'Children Ages', value: selected.children_ages },
            { label: 'Experience', value: selected.experience },
            { label: 'Preferred Species', value: selected.preferred_species },
            { label: 'Preferred Breed', value: selected.preferred_breed },
            { label: 'Preferred Age', value: selected.preferred_age },
            { label: 'Preferred Size', value: selected.preferred_size },
            { label: 'Reason', value: selected.reason },
            { label: 'Veterinarian Reference', value: selected.veterinarian_reference },
            { label: 'Animal ID', value: selected.animal_id },
            { label: 'Status', value: selected.status },
            { label: 'Application Date', value: selected.application_date ? new Date(selected.application_date).toLocaleDateString() : '-' },
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
        <h2><Heart size={24} /> Adoption Applications</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Application</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Application' : 'Add Application'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Applicant Name" name="applicant_name" value={form.applicant_name} onChange={handleField} required />
              <FormField label="Email" name="email" value={form.email} onChange={handleField} required />
              <FormField label="Phone" name="phone" value={form.phone} onChange={handleField} />
              <FormField label="Address" name="address" type="textarea" value={form.address} onChange={handleField} className="full-width" />
              <FormField label="Housing Type" name="housing_type" type="select" value={form.housing_type} onChange={handleField} options={[{ value: 'house', label: 'House' }, { value: 'apartment', label: 'Apartment' }, { value: 'condo', label: 'Condo' }, { value: 'townhouse', label: 'Townhouse' }, { value: 'mobile_home', label: 'Mobile Home' }]} />
              <FormField label="Has Yard" name="has_yard" type="checkbox" value={form.has_yard} onChange={handleField} />
              <FormField label="Has Other Pets" name="has_other_pets" type="checkbox" value={form.has_other_pets} onChange={handleField} />
              <FormField label="Other Pets Details" name="other_pets_details" type="textarea" value={form.other_pets_details} onChange={handleField} className="full-width" />
              <FormField label="Has Children" name="has_children" type="checkbox" value={form.has_children} onChange={handleField} />
              <FormField label="Children Ages" name="children_ages" value={form.children_ages} onChange={handleField} />
              <FormField label="Experience" name="experience" type="textarea" value={form.experience} onChange={handleField} className="full-width" />
              <FormField label="Preferred Species" name="preferred_species" value={form.preferred_species} onChange={handleField} />
              <FormField label="Preferred Breed" name="preferred_breed" value={form.preferred_breed} onChange={handleField} />
              <FormField label="Preferred Age" name="preferred_age" value={form.preferred_age} onChange={handleField} />
              <FormField label="Preferred Size" name="preferred_size" type="select" value={form.preferred_size} onChange={handleField} options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'any', label: 'Any' }]} />
              <FormField label="Reason for Adoption" name="reason" type="textarea" value={form.reason} onChange={handleField} className="full-width" />
              <FormField label="Veterinarian Reference" name="veterinarian_reference" value={form.veterinarian_reference} onChange={handleField} />
              <FormField label="Animal ID" name="animal_id" type="number" value={form.animal_id} onChange={handleField} />
              <FormField label="Status" name="status" type="select" value={form.status} onChange={handleField} options={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'denied', label: 'Denied' }, { value: 'review', label: 'Review' }, { value: 'withdrawn', label: 'Withdrawn' }]} />
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
