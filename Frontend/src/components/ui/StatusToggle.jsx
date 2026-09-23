export default function StatusToggle({ isActive, disabled = false, onToggle }) {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-green-600' : 'text-red-600'}`}>
        {isActive ? 'ON' : 'OFF'}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        disabled={disabled}
        onClick={onToggle}
        className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
          isActive ? 'bg-green-500 focus-visible:ring-green-400' : 'bg-red-500 focus-visible:ring-red-400'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ease-in-out ${
            isActive ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>

      <span className={`text-[10px] font-semibold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    </div>
  );
}
