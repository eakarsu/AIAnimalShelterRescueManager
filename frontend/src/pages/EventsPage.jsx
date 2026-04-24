import { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const statusBadge = (val) => {
  const map = { planned: 'badge-blue', active: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const columns = [
  { key: 'event_name', label: 'Event Name' },
  { key: 'event_type', label: 'Type' },
  { key: 'event_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'location', label: 'Location' },
  { key: 'max_participants', label: 'Max Participants' },
  { key: 'current_participants', label: 'Current Participants' },
  { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
];

const emptyForm = {
  event_name: '', event_type: 'adoption_event', event_date: '', start_time: '', end_time: '',
  location: '', description: '', max_participants: '', current_participants: '', organizer: '',
  status: 'planned', notes: '',
};

export default function EventsPage() {
  const { data, loading, error, create, update, remove } = useCrud('/events');
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
      event_date: row.event_date ? row.event_date.split('T')[0] : '',
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
          <h2><Calendar size={24} /> Event Details</h2>
        </div>
        <DetailView
          title={selected.event_name || `Event #${selected.id}`}
          fields={[
            { label: 'Event Name', value: selected.event_name },
            { label: 'Event Type', value: selected.event_type },
            { label: 'Event Date', value: selected.event_date ? new Date(selected.event_date).toLocaleDateString() : '-' },
            { label: 'Start Time', value: selected.start_time },
            { label: 'End Time', value: selected.end_time },
            { label: 'Location', value: selected.location },
            { label: 'Description', value: selected.description },
            { label: 'Max Participants', value: selected.max_participants },
            { label: 'Current Participants', value: selected.current_participants },
            { label: 'Organizer', value: selected.organizer },
            { label: 'Status', value: selected.status },
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
        <h2><Calendar size={24} /> Events</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Event</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Event' : 'Add Event'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Event Name" name="event_name" value={form.event_name} onChange={handleField} required />
              <FormField label="Event Type" name="event_type" type="select" value={form.event_type} onChange={handleField} options={[{ value: 'adoption_event', label: 'Adoption Event' }, { value: 'fundraiser', label: 'Fundraiser' }, { value: 'vaccination_clinic', label: 'Vaccination Clinic' }, { value: 'workshop', label: 'Workshop' }, { value: 'community_outreach', label: 'Community Outreach' }, { value: 'volunteer_day', label: 'Volunteer Day' }]} required />
              <FormField label="Event Date" name="event_date" type="date" value={form.event_date} onChange={handleField} />
              <FormField label="Start Time" name="start_time" type="time" value={form.start_time} onChange={handleField} />
              <FormField label="End Time" name="end_time" type="time" value={form.end_time} onChange={handleField} />
              <FormField label="Location" name="location" value={form.location} onChange={handleField} />
              <FormField label="Max Participants" name="max_participants" type="number" value={form.max_participants} onChange={handleField} />
              <FormField label="Current Participants" name="current_participants" type="number" value={form.current_participants} onChange={handleField} />
              <FormField label="Organizer" name="organizer" value={form.organizer} onChange={handleField} />
              <FormField label="Status" name="status" type="select" value={form.status} onChange={handleField} options={[{ value: 'planned', label: 'Planned' }, { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }]} />
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
