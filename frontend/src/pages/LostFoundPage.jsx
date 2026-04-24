import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const reportTypeBadge = (val) => {
  const map = { lost: 'badge-red', found: 'badge-blue' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const statusBadge = (val) => {
  const map = { open: 'badge-yellow', matched: 'badge-green', closed: 'badge-gray', reunited: 'badge-blue' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const columns = [
  { key: 'report_type', label: 'Report Type', render: (v) => reportTypeBadge(v) },
  { key: 'animal_type', label: 'Animal Type' },
  { key: 'breed', label: 'Breed' },
  { key: 'location_found_lost', label: 'Location' },
  { key: 'date_reported', label: 'Date Reported', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'reporter_name', label: 'Reporter' },
  { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
];

const emptyForm = {
  report_type: 'lost', animal_type: '', breed: '', color: '', size: '', sex: '',
  microchip_number: '', location_found_lost: '', date_reported: '', reporter_name: '',
  reporter_phone: '', reporter_email: '', description: '', status: 'open', notes: '',
};

export default function LostFoundPage() {
  const { data, loading, error, create, update, remove } = useCrud('/lostfound');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleField = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const openAdd = () => { setForm({ ...emptyForm }); setEditing(null); setShowModal(true); };
  const openEdit = (row) => {
    setForm({ ...emptyForm, ...row, date_reported: row.date_reported ? row.date_reported.split('T')[0] : '' });
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
          <h2><Search size={24} /> Lost & Found Details</h2>
        </div>
        <DetailView
          title={`${selected.report_type ? selected.report_type.charAt(0).toUpperCase() + selected.report_type.slice(1) : ''} - ${selected.animal_type || 'Unknown'}`}
          fields={[
            { label: 'Report Type', value: selected.report_type },
            { label: 'Animal Type', value: selected.animal_type },
            { label: 'Breed', value: selected.breed },
            { label: 'Color', value: selected.color },
            { label: 'Size', value: selected.size },
            { label: 'Sex', value: selected.sex },
            { label: 'Microchip Number', value: selected.microchip_number },
            { label: 'Location', value: selected.location_found_lost },
            { label: 'Date Reported', value: selected.date_reported ? new Date(selected.date_reported).toLocaleDateString() : '-' },
            { label: 'Reporter Name', value: selected.reporter_name },
            { label: 'Reporter Phone', value: selected.reporter_phone },
            { label: 'Reporter Email', value: selected.reporter_email },
            { label: 'Description', value: selected.description },
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
        <h2><Search size={24} /> Lost & Found</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Report</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Report' : 'Add Report'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Report Type" name="report_type" type="select" value={form.report_type} onChange={handleField} options={[{ value: 'lost', label: 'Lost' }, { value: 'found', label: 'Found' }]} required />
              <FormField label="Animal Type" name="animal_type" value={form.animal_type} onChange={handleField} required />
              <FormField label="Breed" name="breed" value={form.breed} onChange={handleField} />
              <FormField label="Color" name="color" value={form.color} onChange={handleField} />
              <FormField label="Size" name="size" type="select" value={form.size} onChange={handleField} options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]} />
              <FormField label="Sex" name="sex" type="select" value={form.sex} onChange={handleField} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'unknown', label: 'Unknown' }]} />
              <FormField label="Microchip Number" name="microchip_number" value={form.microchip_number} onChange={handleField} />
              <FormField label="Location" name="location_found_lost" value={form.location_found_lost} onChange={handleField} />
              <FormField label="Date Reported" name="date_reported" type="date" value={form.date_reported} onChange={handleField} />
              <FormField label="Reporter Name" name="reporter_name" value={form.reporter_name} onChange={handleField} />
              <FormField label="Reporter Phone" name="reporter_phone" value={form.reporter_phone} onChange={handleField} />
              <FormField label="Reporter Email" name="reporter_email" value={form.reporter_email} onChange={handleField} />
              <FormField label="Description" name="description" type="textarea" value={form.description} onChange={handleField} className="full-width" />
              <FormField label="Status" name="status" type="select" value={form.status} onChange={handleField} options={[{ value: 'open', label: 'Open' }, { value: 'matched', label: 'Matched' }, { value: 'closed', label: 'Closed' }, { value: 'reunited', label: 'Reunited' }]} />
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
