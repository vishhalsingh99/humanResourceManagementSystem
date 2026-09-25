import { memo } from 'react';

const statStyles = [
  { key: 'present', label: 'Present', box: 'border-emerald-500/25 bg-emerald-500/10', text: 'text-emerald-400', value: 'text-emerald-300' },
  { key: 'absent', label: 'Absent', box: 'border-red-500/25 bg-red-500/10', text: 'text-red-400', value: 'text-red-300' },
  { key: 'late', label: 'Late', box: 'border-amber-500/25 bg-amber-500/10', text: 'text-amber-400', value: 'text-amber-300' },
  { key: 'halfDay', label: 'Half Day', box: 'border-blue-500/25 bg-blue-500/10', text: 'text-blue-400', value: 'text-blue-300' },
  { key: 'totalWorkingDays', label: 'Total Working Days', box: 'border-neutral-700 bg-neutral-800/60', text: 'text-neutral-400', value: 'text-neutral-200' },
];

function AttendanceStats({ stats }) {
  return <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
    {statStyles.map(({ key, label, box, text, value }) => <div key={key} className={`rounded-lg border p-4 ${box}`}>
      <p className={`text-sm ${text}`}>{label}</p><p className={`text-2xl font-bold ${value}`}>{stats[key]}</p>
    </div>)}
  </div>;
}

export default memo(AttendanceStats);
