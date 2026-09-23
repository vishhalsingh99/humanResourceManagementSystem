import { Search } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search',
  className = '',
  inputClassName = '',
  iconClassName = 'text-slate-400',
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
        className={`w-full rounded-none border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 ${inputClassName}`}
      />
    </div>
  );
}
