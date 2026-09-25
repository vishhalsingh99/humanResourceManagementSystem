import { forwardRef } from 'react';

export const baseInputClass =
  'ui-input w-full rounded-xl px-4 py-3 text-sm outline-none transition duration-200';

export const baseLabelClass = 'mb-2 block text-sm font-semibold t-text-secondary';

function InputField(
  { label, required, className = '', inputClassName = '', rightElement, ...props },
  ref
) {
  return (
    <div className={className}>
      {label && (
        <label className={baseLabelClass}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className={rightElement ? 'relative' : undefined}>
        <input
          ref={ref}
          required={required}
          className={`${baseInputClass} ${rightElement ? 'pr-10' : ''} ${inputClassName}`}
          {...props}
        />
        {rightElement}
      </div>
    </div>
  );
}

export default forwardRef(InputField);
