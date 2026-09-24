import { Search } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search',
  className = '',
  inputClassName = '',
  iconClassName = 'text-neutral-500',
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={18}
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${iconClassName}`}
      />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-neutral-700/90 bg-neutral-950/65 py-3 pl-11 pr-4 text-sm text-neutral-100 outline-none transition duration-200 placeholder:text-neutral-500 hover:border-neutral-500 focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)] ${inputClassName}`}
      />
    </div>
  );
}
