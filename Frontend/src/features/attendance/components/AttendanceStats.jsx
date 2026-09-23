import { memo } from 'react';

const statStyles = [
  { key: 'present', label: 'Present', box: 'border-green-200 bg-green-50', text: 'text-green-600', value: 'text-green-700' },
  { key: 'absent', label: 'Absent', box: 'border-red-200 bg-red-50', text: 'text-red-600', value: 'text-red-700' },
  { key: 'late', label: 'Late', box: 'border-yellow-200 bg-yellow-50', text: 'text-yellow-600', value: 'text-yellow-700' },
  { key: 'halfDay', label: 'Half Day', box: 'border-blue-200 bg-blue-50', text: 'text-blue-600', value: 'text-blue-700' },
  { key: 'totalWorkingDays', label: 'Total Working Days', box: 'border-slate-200 bg-slate-50', text: 'text-slate-600', value: 'text-slate-800' },
];

function AttendanceStats({ stats }) {
  return <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
    {statStyles.map(({ key, label, box, text, value }) => <div key={key} className={`rounded-lg border p-4 ${box}`}>
      <p className={`text-sm ${text}`}>{label}</p><p className={`text-2xl font-bold ${value}`}>{stats[key]}</p>
    </div>)}
  </div>;
}

export default memo(AttendanceStats);
