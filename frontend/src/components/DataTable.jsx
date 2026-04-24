import { useState } from 'react';
import { Search, Edit2, Trash2, Inbox } from 'lucide-react';

export default function DataTable({ columns, data, onRowClick, onDelete, onEdit, searchPlaceholder }) {
  const [search, setSearch] = useState('');

  const filtered = data.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return columns.some((col) => {
      const val = row[col.key];
      if (val == null) return false;
      return String(val).toLowerCase().includes(q);
    });
  });

  return (
    <div className="data-table-wrapper">
      <div className="data-table-toolbar">
        <div className="data-table-search">
          <Search />
          <input
            type="text"
            placeholder={searchPlaceholder || 'Search...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Inbox />
          <p>No records found</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {(onEdit || onDelete) && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <tr key={row.id || idx} onClick={() => onRowClick && onRowClick(row)}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td>
                    <div className="actions-cell">
                      {onEdit && (
                        <button
                          className="edit-btn"
                          onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="delete-btn"
                          onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
