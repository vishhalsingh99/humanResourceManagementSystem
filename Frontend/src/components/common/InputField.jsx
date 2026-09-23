import { forwardRef } from 'react';

const baseInputClass =
  'w-full rounded-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500';

const baseLabelClass = 'mb-2 block text-sm font-semibold text-slate-800';

function InputField(
  { label, required, className = '', inputClassName = '', rightElement, ...props },
  ref
) {
  return (
    <div className={className}>
      {label && (
        <label className={baseLabelClass}>
          {label} {required && <span className="text-red-500">*</span>}
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

export { baseInputClass, baseLabelClass };
export default forwardRef(InputField);
