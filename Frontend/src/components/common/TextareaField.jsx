import { baseInputClass, baseLabelClass } from './InputField';

export default function TextareaField({
  label,
  required,
  className = '',
  inputClassName = '',
  rows = 4,
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className={baseLabelClass}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        required={required}
        className={`${baseInputClass} resize-none ${inputClassName}`}
        {...props}
      />
    </div>
  );
}
