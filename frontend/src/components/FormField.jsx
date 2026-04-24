export default function FormField({ label, type = 'text', name, value, onChange, options, required, placeholder, className }) {
  const handleChange = (e) => {
    const val = type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(name, val);
  };

  if (type === 'checkbox') {
    return (
      <div className={`form-group ${className || ''}`}>
        <div className="form-checkbox-row">
          <input
            type="checkbox"
            id={name}
            name={name}
            checked={!!value}
            onChange={handleChange}
          />
          <label htmlFor={name}>{label}</label>
        </div>
      </div>
    );
  }

  return (
    <div className={`form-group ${className || ''}`}>
      <label htmlFor={name}>{label}{required && ' *'}</label>
      {type === 'select' ? (
        <select id={name} name={name} value={value || ''} onChange={handleChange} required={required}>
          <option value="">{placeholder || `Select ${label}`}</option>
          {(options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={handleChange}
          required={required}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value || ''}
          onChange={handleChange}
          required={required}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
