import { baseInputClass, baseLabelClass } from './InputField';

export default function SelectField({
  label,
  required,
  options = [],
  className = '',
  inputClassName = '',
  children,
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className={baseLabelClass}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select required={required} className={`${baseInputClass} ${inputClassName}`} {...props}>
        {children ||
          options.map((option) => {
            const value = typeof option === 'object' ? option.value : option;
            const labelText = typeof option === 'object' ? option.label : option;
            return (
              <option key={value} value={value}>
                {labelText}
              </option>
            );
          })}
      </select>
    </div>
  );
}
