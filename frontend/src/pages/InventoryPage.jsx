import { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const columns = [
  { key: 'item_name', label: 'Item Name' },
  { key: 'category', label: 'Category' },
  { key: 'quantity', label: 'Quantity', render: (v, row) => {
    const isLow = row.reorder_level != null && v != null && Number(v) <= Number(row.reorder_level);
    return <span style={isLow ? { color: '#dc2626', fontWeight: 'bold' } : {}}>{v ?? '-'}</span>;
  }},
  { key: 'unit', label: 'Unit' },
  { key: 'reorder_level', label: 'Reorder Level' },
  { key: 'cost_per_unit', label: 'Cost/Unit', render: (v) => v != null ? `$${Number(v).toFixed(2)}` : '-' },
  { key: 'supplier', label: 'Supplier' },
];

const emptyForm = {
  item_name: '', category: '', quantity: '', unit: '', reorder_level: '', cost_per_unit: '',
  supplier: '', location: '', last_restocked: '', expiry_date: '', notes: '',
};

export default function InventoryPage() {
  const { data, loading, error, create, update, remove } = useCrud('/inventory');
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
      last_restocked: row.last_restocked ? row.last_restocked.split('T')[0] : '',
      expiry_date: row.expiry_date ? row.expiry_date.split('T')[0] : '',
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
          <h2><Package size={24} /> Inventory Details</h2>
        </div>
        <DetailView
          title={selected.item_name}
          fields={[
            { label: 'Category', value: selected.category },
            { label: 'Quantity', value: selected.quantity },
            { label: 'Unit', value: selected.unit },
            { label: 'Reorder Level', value: selected.reorder_level },
            { label: 'Cost Per Unit', value: selected.cost_per_unit != null ? `$${Number(selected.cost_per_unit).toFixed(2)}` : '-' },
            { label: 'Supplier', value: selected.supplier },
            { label: 'Location', value: selected.location },
            { label: 'Last Restocked', value: selected.last_restocked ? new Date(selected.last_restocked).toLocaleDateString() : '-' },
            { label: 'Expiry Date', value: selected.expiry_date ? new Date(selected.expiry_date).toLocaleDateString() : '-' },
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
        <h2><Package size={24} /> Inventory</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Item</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Item' : 'Add Item'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Item Name" name="item_name" value={form.item_name} onChange={handleField} required />
              <FormField label="Category" name="category" type="select" value={form.category} onChange={handleField} options={[{ value: 'food', label: 'Food' }, { value: 'bedding', label: 'Bedding' }, { value: 'cleaning', label: 'Cleaning' }, { value: 'medical', label: 'Medical' }, { value: 'toys', label: 'Toys' }, { value: 'office', label: 'Office' }, { value: 'other', label: 'Other' }]} />
              <FormField label="Quantity" name="quantity" type="number" value={form.quantity} onChange={handleField} required />
              <FormField label="Unit" name="unit" type="select" value={form.unit} onChange={handleField} options={[{ value: 'bags', label: 'Bags' }, { value: 'boxes', label: 'Boxes' }, { value: 'bottles', label: 'Bottles' }, { value: 'cans', label: 'Cans' }, { value: 'cases', label: 'Cases' }, { value: 'each', label: 'Each' }, { value: 'gallons', label: 'Gallons' }, { value: 'lbs', label: 'Lbs' }, { value: 'rolls', label: 'Rolls' }]} />
              <FormField label="Reorder Level" name="reorder_level" type="number" value={form.reorder_level} onChange={handleField} />
              <FormField label="Cost Per Unit" name="cost_per_unit" type="number" value={form.cost_per_unit} onChange={handleField} />
              <FormField label="Supplier" name="supplier" value={form.supplier} onChange={handleField} />
              <FormField label="Location" name="location" value={form.location} onChange={handleField} />
              <FormField label="Last Restocked" name="last_restocked" type="date" value={form.last_restocked} onChange={handleField} />
              <FormField label="Expiry Date" name="expiry_date" type="date" value={form.expiry_date} onChange={handleField} />
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
