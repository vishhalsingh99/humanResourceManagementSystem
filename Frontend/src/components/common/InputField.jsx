import { forwardRef } from 'react';

const baseInputClass =
  'w-full rounded-xl border border-neutral-700/90 bg-neutral-950/65 px-4 py-3 text-sm text-neutral-100 outline-none transition duration-200 placeholder:text-neutral-500 hover:border-neutral-500 focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12),0_0_20px_rgba(239,68,68,0.1)] disabled:bg-neutral-900 disabled:text-neutral-500';

const baseLabelClass = 'mb-2 block text-sm font-semibold text-neutral-200';

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

export { baseInputClass, baseLabelClass };
export default forwardRef(InputField);
