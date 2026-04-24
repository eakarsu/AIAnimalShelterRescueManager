import { Edit2, Trash2, X } from 'lucide-react';

export default function DetailView({ title, fields, onEdit, onDelete, onClose, children }) {
  return (
    <div className="detail-view">
      <div className="detail-header">
        <h3>{title}</h3>
        <div className="detail-header-actions">
          {onEdit && (
            <button className="btn btn-primary btn-sm" onClick={onEdit}>
              <Edit2 size={14} /> Edit
            </button>
          )}
          {onDelete && (
            <button className="btn btn-danger btn-sm" onClick={onDelete}>
              <Trash2 size={14} /> Delete
            </button>
          )}
          {onClose && (
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              <X size={14} /> Close
            </button>
          )}
        </div>
      </div>
      <div className="detail-body">
        <div className="detail-grid">
          {fields.map((f, i) => (
            <div key={i} className="detail-field">
              <span className="detail-field-label">{f.label}</span>
              <span className="detail-field-value">{f.value ?? '-'}</span>
            </div>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
