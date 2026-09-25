import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import SearchBar from '../../components/common/SearchBar';

const statusCls = {
  Scheduled: 'bg-amber-500/15 text-amber-300',
  Completed: 'bg-emerald-500/15 text-emerald-300',
  Cancelled: 'bg-rose-500/15 text-rose-300',
};

export default function ReportMeetings() {
  const { meetings } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const safeMeetings = Array.isArray(meetings) ? meetings : [];

  const scheduled = safeMeetings.filter((m) => m.status === 'Scheduled').length;
  const completed = safeMeetings.filter((m) => m.status === 'Completed').length;
  const cancelled = safeMeetings.filter((m) => m.status === 'Cancelled').length;

  const stats = [
    { label: 'Total Meetings', value: safeMeetings.length, icon: CalendarDays, box: 'border-red-500/25 bg-red-500/10', text: 'text-red-400', value_cls: 'text-red-300' },
    { label: 'Scheduled', value: scheduled, icon: Clock, box: 'border-amber-500/25 bg-amber-500/10', text: 'text-amber-400', value_cls: 'text-amber-300' },
    { label: 'Completed', value: completed, icon: CheckCircle2, box: 'border-emerald-500/25 bg-emerald-500/10', text: 'text-emerald-400', value_cls: 'text-emerald-300' },
    { label: 'Cancelled', value: cancelled, icon: XCircle, box: 't-border bg-neutral-800/60', text: 't-text-muted', value_cls: 't-text-secondary' },
  ];

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return safeMeetings.filter((m) => {
      const matchesSearch =
        (m.employee?.name || '').toLowerCase().includes(term) ||
        (m.organizer?.name || '').toLowerCase().includes(term) ||
        (m.organizer?.department || '').toLowerCase().includes(term) ||
        (m.date || '').includes(search);
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [safeMeetings, search, statusFilter]);

  return (
    <div className="p-4 sm:p-6 mt-4 lg:p-10">
      {/* Header */}
      <div className="mb-6">
        <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-red-400">Reports</p>
        <h1 className="text-3xl font-semibold t-text-heading">Meeting Report</h1>
        <p className="mt-1 text-sm t-text-muted">Overview of all scheduled and past meetings.</p>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, box, text, value_cls }) => (
          <div key={label} className={`rounded-xl border p-4 ${box}`}>
            <div className="mb-2 flex items-center gap-2">
              <Icon size={16} className={text} />
              <p className={`text-sm font-medium ${text}`}>{label}</p>
            </div>
            <p className={`text-3xl font-bold ${value_cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          className="flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by employee, organizer, department…"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border t-border bg-[var(--bg-input)] px-4 py-2.5 text-sm t-text-primary outline-none transition focus:border-red-500/70"
        >
          <option value="all">All Status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border t-border bg-[var(--bg-surface)] backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="t-thead">
                {['#', 'Employee', 'Organizer', 'Department', 'Date', 'Time', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide t-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((meeting, idx) => (
                <tr key={meeting._id} className="border-t t-divider transition-colors hover:bg-neutral-800/30">
                  <td className="px-5 py-3 text-sm t-text-subtle">{idx + 1}</td>
                  <td className="px-5 py-3 text-sm font-semibold t-text-primary">{meeting.employee?.name || '—'}</td>
                  <td className="px-5 py-3 text-sm t-text-secondary">{meeting.organizer?.name || '—'}</td>
                  <td className="px-5 py-3 text-sm t-text-secondary">{meeting.organizer?.department || '—'}</td>
                  <td className="px-5 py-3 text-sm t-text-secondary">{meeting.date || '—'}</td>
                  <td className="px-5 py-3 text-sm t-text-secondary">{meeting.time || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusCls[meeting.status] || 'bg-neutral-700/60 t-text-muted'}`}>
                      {meeting.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center t-text-subtle">
                    No meetings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
