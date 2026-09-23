import { Plus } from 'lucide-react';
import { inputClassName, labelClassName } from '../constants/employee.constants';

function FieldLabel({ field }) {
  return (
    <label className={labelClassName}>
      {field.label} {field.required && <span className="text-red-500">*</span>}
    </label>
  );
}

export default function EmployeeFormField({ field, value, onChange, onAddOption, error = '' }) {
  const handleChange = (event) => onChange(field.name, event.target.value);

  if (field.type === 'file') {
    const handleFileChange = (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        onChange(field.name, { error: 'Resume file must not exceed 2 MB' });
        event.target.value = '';
        return;
      }

      if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
        onChange(field.name, { error: 'Resume file must be a PDF, DOC, or DOCX file' });
        event.target.value = '';
        return;
      }

      onChange(field.name, { file });
    };

    return (
      <div className={field.className}>
        <FieldLabel field={field} />
        <input
          type="file"
          accept={field.accept}
          onChange={handleFileChange}
          className={`${inputClassName} ${error ? 'border-red-500' : ''}`}
        />
        {field.fileName && <p className="mt-1 break-all text-xs text-slate-500">Current file: {field.fileName}</p>}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className={field.className}>
        <FieldLabel field={field} />
        <textarea
          rows={field.rows}
          value={value}
          onChange={handleChange}
          className={`${inputClassName} resize-none`}
          required={field.required}
        />
      </div>
    );
  }

  if (field.type === 'select' || field.type === 'selectWithAdd') {
    const select = (
      <select
        value={value}
        onChange={handleChange}
        className={inputClassName}
        required={field.required} 
        disabled={field.disabled}
      >
        {field.options.map((option) => (
          <option key={typeof option === 'object' ? option.value : option} value={typeof option === 'object' ? option.value : option}>
            {typeof option === 'object' ? option.label : option}
          </option>
        ))}
      </select>
    );

    return (
      <div className={field.className}>
        <FieldLabel field={field} />
        {field.type === 'selectWithAdd' ? (
          <div className="flex gap-2">
            {select}
            <button
              type="button"
              onClick={() => onAddOption(field.name)}
              className="flex items-center justify-center gap-2 rounded-none bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 cursor-pointer"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        ) : (
          select
        )}
      </div>
    );
  }

  return (
    <div className={field.className}>
      <FieldLabel field={field} />
      <input
        type={field.type}
        value={value}
        onChange={handleChange}
        min={field.min}
        step={field.step}
        inputMode={field.inputMode}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        readOnly={field.readOnly}
        style={field.textTransform ? { textTransform: field.textTransform } : undefined}
        className={`${inputClassName} ${error ? 'border-red-500' : ''}`}
        required={field.required}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
