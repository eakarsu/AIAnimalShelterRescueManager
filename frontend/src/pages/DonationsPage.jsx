import { useState } from 'react';
import { DollarSign, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const columns = [
  { key: 'donor_name', label: 'Donor Name' },
  { key: 'donor_email', label: 'Email' },
  { key: 'amount', label: 'Amount', render: (v) => v != null ? `$${Number(v).toFixed(2)}` : '-' },
  { key: 'donation_type', label: 'Type' },
  { key: 'campaign', label: 'Campaign' },
  { key: 'donation_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'payment_method', label: 'Payment Method' },
];

const emptyForm = {
  donor_name: '', donor_email: '', amount: '', donation_type: 'monetary', campaign: '',
  payment_method: '', donation_date: '', receipt_number: '', is_recurring: false, notes: '',
};

export default function DonationsPage() {
  const { data, loading, error, create, update, remove } = useCrud('/donations');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleField = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const openAdd = () => { setForm({ ...emptyForm }); setEditing(null); setShowModal(true); };
  const openEdit = (row) => {
    setForm({ ...emptyForm, ...row, donation_date: row.donation_date ? row.donation_date.split('T')[0] : '' });
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
          <h2><DollarSign size={24} /> Donation Details</h2>
        </div>
        <DetailView
          title={selected.donor_name}
          fields={[
            { label: 'Email', value: selected.donor_email },
            { label: 'Amount', value: selected.amount != null ? `$${Number(selected.amount).toFixed(2)}` : '-' },
            { label: 'Donation Type', value: selected.donation_type },
            { label: 'Campaign', value: selected.campaign },
            { label: 'Payment Method', value: selected.payment_method },
            { label: 'Donation Date', value: selected.donation_date ? new Date(selected.donation_date).toLocaleDateString() : '-' },
            { label: 'Receipt Number', value: selected.receipt_number },
            { label: 'Is Recurring', value: selected.is_recurring ? 'Yes' : 'No' },
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
        <h2><DollarSign size={24} /> Donations</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Donation</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Donation' : 'Add Donation'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Donor Name" name="donor_name" value={form.donor_name} onChange={handleField} required />
              <FormField label="Donor Email" name="donor_email" value={form.donor_email} onChange={handleField} />
              <FormField label="Amount" name="amount" type="number" value={form.amount} onChange={handleField} required />
              <FormField label="Donation Type" name="donation_type" type="select" value={form.donation_type} onChange={handleField} options={[{ value: 'monetary', label: 'Monetary' }, { value: 'supplies', label: 'Supplies' }, { value: 'services', label: 'Services' }, { value: 'other', label: 'Other' }]} />
              <FormField label="Campaign" name="campaign" value={form.campaign} onChange={handleField} />
              <FormField label="Payment Method" name="payment_method" type="select" value={form.payment_method} onChange={handleField} options={[{ value: 'credit_card', label: 'Credit Card' }, { value: 'check', label: 'Check' }, { value: 'cash', label: 'Cash' }, { value: 'online', label: 'Online' }, { value: 'bank_transfer', label: 'Bank Transfer' }]} />
              <FormField label="Donation Date" name="donation_date" type="date" value={form.donation_date} onChange={handleField} />
              <FormField label="Receipt Number" name="receipt_number" value={form.receipt_number} onChange={handleField} />
              <FormField label="Is Recurring" name="is_recurring" type="checkbox" value={form.is_recurring} onChange={handleField} />
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
