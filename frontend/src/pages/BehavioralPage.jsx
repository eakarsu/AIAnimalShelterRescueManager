import { useState } from 'react';
import { Brain, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DetailView from '../components/DetailView';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import useCrud from '../hooks/useCrud';

const ratingBadge = (val) => {
  const map = { excellent: 'badge-green', good: 'badge-blue', fair: 'badge-yellow', poor: 'badge-orange', concerning: 'badge-red' };
  return <span className={`badge ${map[val] || 'badge-gray'}`}>{val || 'unknown'}</span>;
};

const renderLevel = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  const color = num <= 2 ? '#22c55e' : num === 3 ? '#eab308' : '#ef4444';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {num}
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
    </span>
  );
};

const columns = [
  { key: 'animal_id', label: 'Animal ID' },
  { key: 'assessor', label: 'Assessor' },
  { key: 'assessment_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'overall_rating', label: 'Overall Rating', render: (v) => ratingBadge(v) },
  { key: 'aggression_level', label: 'Aggression', render: (v) => renderLevel(v) },
  { key: 'sociability_level', label: 'Sociability', render: (v) => renderLevel(v) },
];

const emptyForm = {
  animal_id: '', assessor: '', assessment_date: '', aggression_level: '', fear_level: '',
  sociability_level: '', energy_level: '', trainability_level: '', good_with_kids: false,
  good_with_dogs: false, good_with_cats: false, bite_history: false, bite_details: '',
  overall_rating: 'good', notes: '',
};

export default function BehavioralPage() {
  const { data, loading, error, create, update, remove } = useCrud('/behavioral');
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
      assessment_date: row.assessment_date ? row.assessment_date.split('T')[0] : '',
      good_with_kids: !!row.good_with_kids,
      good_with_dogs: !!row.good_with_dogs,
      good_with_cats: !!row.good_with_cats,
      bite_history: !!row.bite_history,
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
          <h2><Brain size={24} /> Behavioral Assessment Details</h2>
        </div>
        <DetailView
          title={`Assessment #${selected.id}`}
          fields={[
            { label: 'Animal ID', value: selected.animal_id },
            { label: 'Assessor', value: selected.assessor },
            { label: 'Assessment Date', value: selected.assessment_date ? new Date(selected.assessment_date).toLocaleDateString() : '-' },
            { label: 'Overall Rating', value: selected.overall_rating },
            { label: 'Aggression Level', value: selected.aggression_level },
            { label: 'Fear Level', value: selected.fear_level },
            { label: 'Sociability Level', value: selected.sociability_level },
            { label: 'Energy Level', value: selected.energy_level },
            { label: 'Trainability Level', value: selected.trainability_level },
            { label: 'Good with Kids', value: selected.good_with_kids ? 'Yes' : 'No' },
            { label: 'Good with Dogs', value: selected.good_with_dogs ? 'Yes' : 'No' },
            { label: 'Good with Cats', value: selected.good_with_cats ? 'Yes' : 'No' },
            { label: 'Bite History', value: selected.bite_history ? 'Yes' : 'No' },
            { label: 'Bite Details', value: selected.bite_details },
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
        <h2><Brain size={24} /> Behavioral Assessments</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Assessment</button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Assessment' : 'Add Assessment'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Animal ID" name="animal_id" type="number" value={form.animal_id} onChange={handleField} required />
              <FormField label="Assessor" name="assessor" value={form.assessor} onChange={handleField} />
              <FormField label="Assessment Date" name="assessment_date" type="date" value={form.assessment_date} onChange={handleField} />
              <FormField label="Aggression Level (1-5)" name="aggression_level" type="number" value={form.aggression_level} onChange={handleField} />
              <FormField label="Fear Level (1-5)" name="fear_level" type="number" value={form.fear_level} onChange={handleField} />
              <FormField label="Sociability Level (1-5)" name="sociability_level" type="number" value={form.sociability_level} onChange={handleField} />
              <FormField label="Energy Level (1-5)" name="energy_level" type="number" value={form.energy_level} onChange={handleField} />
              <FormField label="Trainability Level (1-5)" name="trainability_level" type="number" value={form.trainability_level} onChange={handleField} />
              <FormField label="Good with Kids" name="good_with_kids" type="checkbox" value={form.good_with_kids} onChange={handleField} />
              <FormField label="Good with Dogs" name="good_with_dogs" type="checkbox" value={form.good_with_dogs} onChange={handleField} />
              <FormField label="Good with Cats" name="good_with_cats" type="checkbox" value={form.good_with_cats} onChange={handleField} />
              <FormField label="Bite History" name="bite_history" type="checkbox" value={form.bite_history} onChange={handleField} />
              <FormField label="Bite Details" name="bite_details" type="textarea" value={form.bite_details} onChange={handleField} className="full-width" />
              <FormField label="Overall Rating" name="overall_rating" type="select" value={form.overall_rating} onChange={handleField} options={[{ value: 'excellent', label: 'Excellent' }, { value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' }, { value: 'poor', label: 'Poor' }, { value: 'concerning', label: 'Concerning' }]} />
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
