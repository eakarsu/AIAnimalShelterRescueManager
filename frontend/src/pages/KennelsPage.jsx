import { useState } from 'react';
import { Home, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const statusBadge = (val) => {
  const map = { available: 'badge-green', occupied: 'badge-red', maintenance: 'badge-orange', cleaning: 'badge-yellow' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const columns = [
  { key: 'kennel_number', label: 'Kennel #' },
  { key: 'building', label: 'Building' },
  { key: 'kennel_type', label: 'Type' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'current_occupancy', label: 'Occupancy' },
  { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
];

const emptyForm = {
  kennel_number: '', building: '', kennel_type: 'indoor', capacity: '', status: 'available', notes: '',
};

export default function KennelsPage() {
  const { data, loading, error, create, update, remove } = useCrud('/kennels');
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
          <h2><Home size={24} /> Kennel Details</h2>
        </div>
        <DetailView
          title={`Kennel ${selected.kennel_number}`}
          fields={[
            { label: 'Kennel Number', value: selected.kennel_number },
            { label: 'Building', value: selected.building },
            { label: 'Kennel Type', value: selected.kennel_type },
            { label: 'Capacity', value: selected.capacity },
            { label: 'Current Occupancy', value: selected.current_occupancy },
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
        <h2><Home size={24} /> Kennels</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Kennel</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Kennel' : 'Add Kennel'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Kennel Number" name="kennel_number" value={form.kennel_number} onChange={handleField} required />
              <FormField label="Building" name="building" value={form.building} onChange={handleField} />
              <FormField label="Kennel Type" name="kennel_type" type="select" value={form.kennel_type} onChange={handleField} options={[{ value: 'indoor', label: 'Indoor' }, { value: 'outdoor', label: 'Outdoor' }, { value: 'isolation', label: 'Isolation' }, { value: 'medical', label: 'Medical' }]} />
              <FormField label="Capacity" name="capacity" type="number" value={form.capacity} onChange={handleField} />
              <FormField label="Status" name="status" type="select" value={form.status} onChange={handleField} options={[{ value: 'available', label: 'Available' }, { value: 'occupied', label: 'Occupied' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'cleaning', label: 'Cleaning' }]} />
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
