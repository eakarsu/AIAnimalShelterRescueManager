import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="confirm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="confirm-dialog">
        <AlertTriangle size={36} color="#dc2626" style={{ marginBottom: 8 }} />
        <h4>{title || 'Confirm Delete'}</h4>
        <p>{message || 'Are you sure you want to delete this item? This action cannot be undone.'}</p>
        <div className="confirm-actions">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
