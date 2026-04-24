import { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const statusBadge = (val) => {
  const map = { on_hold: 'badge-orange', released: 'badge-green', claimed: 'badge-blue', expired: 'badge-red' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const columns = [
  { key: 'animal_id', label: 'Animal ID' },
  { key: 'intake_date', label: 'Intake Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'hold_start_date', label: 'Hold Start', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'hold_end_date', label: 'Hold End', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'legal_hold_days', label: 'Hold Days' },
  { key: 'found_location', label: 'Found Location' },
  { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
];

const emptyForm = {
  animal_id: '', intake_date: '', hold_start_date: '', hold_end_date: '', legal_hold_days: 3,
  found_location: '', finder_name: '', finder_phone: '', is_claimed: false, claimed_by: '',
  claimed_date: '', status: 'on_hold', notes: '',
};

export default function StrayHoldsPage() {
  const { data, loading, error, create, update, remove } = useCrud('/strayholds');
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
      intake_date: row.intake_date ? row.intake_date.split('T')[0] : '',
      hold_start_date: row.hold_start_date ? row.hold_start_date.split('T')[0] : '',
      hold_end_date: row.hold_end_date ? row.hold_end_date.split('T')[0] : '',
      claimed_date: row.claimed_date ? row.claimed_date.split('T')[0] : '',
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
          <h2><Clock size={24} /> Stray Hold Details</h2>
        </div>
        <DetailView
          title={`Stray Hold #${selected.id}`}
          fields={[
            { label: 'Animal ID', value: selected.animal_id },
            { label: 'Intake Date', value: selected.intake_date ? new Date(selected.intake_date).toLocaleDateString() : '-' },
            { label: 'Hold Start Date', value: selected.hold_start_date ? new Date(selected.hold_start_date).toLocaleDateString() : '-' },
            { label: 'Hold End Date', value: selected.hold_end_date ? new Date(selected.hold_end_date).toLocaleDateString() : '-' },
            { label: 'Legal Hold Days', value: selected.legal_hold_days },
            { label: 'Found Location', value: selected.found_location },
            { label: 'Finder Name', value: selected.finder_name },
            { label: 'Finder Phone', value: selected.finder_phone },
            { label: 'Is Claimed', value: selected.is_claimed ? 'Yes' : 'No' },
            { label: 'Claimed By', value: selected.claimed_by },
            { label: 'Claimed Date', value: selected.claimed_date ? new Date(selected.claimed_date).toLocaleDateString() : '-' },
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
        <h2><Clock size={24} /> Stray Holds</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Stray Hold</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Stray Hold' : 'Add Stray Hold'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Animal ID" name="animal_id" type="number" value={form.animal_id} onChange={handleField} required />
              <FormField label="Intake Date" name="intake_date" type="date" value={form.intake_date} onChange={handleField} />
              <FormField label="Hold Start Date" name="hold_start_date" type="date" value={form.hold_start_date} onChange={handleField} />
              <FormField label="Hold End Date" name="hold_end_date" type="date" value={form.hold_end_date} onChange={handleField} />
              <FormField label="Legal Hold Days" name="legal_hold_days" type="number" value={form.legal_hold_days} onChange={handleField} />
              <FormField label="Found Location" name="found_location" value={form.found_location} onChange={handleField} />
              <FormField label="Finder Name" name="finder_name" value={form.finder_name} onChange={handleField} />
              <FormField label="Finder Phone" name="finder_phone" value={form.finder_phone} onChange={handleField} />
              <FormField label="Is Claimed" name="is_claimed" type="checkbox" value={form.is_claimed} onChange={handleField} />
              <FormField label="Claimed By" name="claimed_by" value={form.claimed_by} onChange={handleField} />
              <FormField label="Claimed Date" name="claimed_date" type="date" value={form.claimed_date} onChange={handleField} />
              <FormField label="Status" name="status" type="select" value={form.status} onChange={handleField} options={[{ value: 'on_hold', label: 'On Hold' }, { value: 'released', label: 'Released' }, { value: 'claimed', label: 'Claimed' }, { value: 'expired', label: 'Expired' }]} />
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
