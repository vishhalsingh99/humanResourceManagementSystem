import { Search } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search',
  className = '',
  inputClassName = '',
  iconClassName = 't-text-subtle',
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
        className={`ui-input w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition duration-200 ${inputClassName}`}
      />
    </div>
  );
}
