import { useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const statusBadge = (val) => {
  const map = { active: 'badge-green', inactive: 'badge-gray', on_leave: 'badge-yellow' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'skills', label: 'Skills' },
  { key: 'hours_completed', label: 'Hours Completed' },
  { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
];

const emptyForm = {
  name: '', email: '', phone: '', address: '', emergency_contact: '', emergency_phone: '',
  skills: '', availability: '', start_date: '', hours_completed: '', status: 'active', notes: '',
};

export default function VolunteersPage() {
  const { data, loading, error, create, update, remove } = useCrud('/volunteers');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleField = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const openAdd = () => { setForm({ ...emptyForm }); setEditing(null); setShowModal(true); };
  const openEdit = (row) => {
    setForm({ ...emptyForm, ...row, start_date: row.start_date ? row.start_date.split('T')[0] : '' });
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
          <h2><Heart size={24} /> Volunteer Details</h2>
        </div>
        <DetailView
          title={selected.name}
          fields={[
            { label: 'Email', value: selected.email },
            { label: 'Phone', value: selected.phone },
            { label: 'Address', value: selected.address },
            { label: 'Emergency Contact', value: selected.emergency_contact },
            { label: 'Emergency Phone', value: selected.emergency_phone },
            { label: 'Skills', value: selected.skills },
            { label: 'Availability', value: selected.availability },
            { label: 'Start Date', value: selected.start_date ? new Date(selected.start_date).toLocaleDateString() : '-' },
            { label: 'Hours Completed', value: selected.hours_completed },
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
        <h2><Heart size={24} /> Volunteers</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Volunteer</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Volunteer' : 'Add Volunteer'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Name" name="name" value={form.name} onChange={handleField} required />
              <FormField label="Email" name="email" value={form.email} onChange={handleField} required />
              <FormField label="Phone" name="phone" value={form.phone} onChange={handleField} />
              <FormField label="Address" name="address" type="textarea" value={form.address} onChange={handleField} className="full-width" />
              <FormField label="Emergency Contact" name="emergency_contact" value={form.emergency_contact} onChange={handleField} />
              <FormField label="Emergency Phone" name="emergency_phone" value={form.emergency_phone} onChange={handleField} />
              <FormField label="Skills" name="skills" type="textarea" value={form.skills} onChange={handleField} className="full-width" />
              <FormField label="Availability" name="availability" type="textarea" value={form.availability} onChange={handleField} className="full-width" />
              <FormField label="Start Date" name="start_date" type="date" value={form.start_date} onChange={handleField} />
              <FormField label="Hours Completed" name="hours_completed" type="number" value={form.hours_completed} onChange={handleField} />
              <FormField label="Status" name="status" type="select" value={form.status} onChange={handleField} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'on_leave', label: 'On Leave' }]} />
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
