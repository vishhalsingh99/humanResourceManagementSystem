import { useMemo, useState } from 'react';
import { Users, UserCheck, UserX, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import SearchBar from '../../components/common/SearchBar';

const statCards = (employees) => {
  const active = employees.filter((e) => e.status !== 'inactive').length;
  const inactive = employees.filter((e) => e.status === 'inactive').length;
  const departments = new Set(employees.map((e) => e.department).filter(Boolean)).size;
  return [
    { label: 'Total Employees', value: employees.length, icon: Users, box: 'border-red-500/25 bg-red-500/10', text: 'text-red-400', value_cls: 'text-red-300' },
    { label: 'Active', value: active, icon: UserCheck, box: 'border-emerald-500/25 bg-emerald-500/10', text: 'text-emerald-400', value_cls: 'text-emerald-300' },
    { label: 'Inactive', value: inactive, icon: UserX, box: 't-border bg-neutral-800/60', text: 't-text-muted', value_cls: 't-text-secondary' },
    { label: 'Departments', value: departments, icon: Building2, box: 'border-blue-500/25 bg-blue-500/10', text: 'text-blue-400', value_cls: 'text-blue-300' },
  ];
};

export default function ReportEmployees() {
  const { employees } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('');

  const safeEmployees = Array.isArray(employees) ? employees : [];

  const departments = useMemo(
    () => [...new Set(safeEmployees.map((e) => e.department).filter(Boolean))].sort(),
    [safeEmployees],
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return safeEmployees.filter((e) => {
      const matchesSearch =
        (e.name || '').toLowerCase().includes(term) ||
        (e.employee_id || e.employeeId || '').toLowerCase().includes(term) ||
        (e.department || '').toLowerCase().includes(term) ||
        (e.designation || '').toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? e.status !== 'inactive' : e.status === 'inactive');
      const matchesDept = !deptFilter || e.department === deptFilter;
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [safeEmployees, search, statusFilter, deptFilter]);

  const stats = statCards(safeEmployees);

  return (
    <div className="p-4 sm:p-6 mt-4 lg:p-10">
      {/* Header */}
      <div className="mb-6">
        <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-red-400">Reports</p>
        <h1 className="text-3xl font-semibold t-text-heading">Employee Report</h1>
        <p className="mt-1 text-sm t-text-muted">Overview of all employee records.</p>
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
          placeholder="Search by name, ID, department…"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border t-border bg-[var(--bg-input)] px-4 py-2.5 text-sm t-text-primary outline-none transition focus:border-red-500/70"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-xl border t-border bg-[var(--bg-input)] px-4 py-2.5 text-sm t-text-primary outline-none transition focus:border-red-500/70"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border t-border bg-[var(--bg-surface)] backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="t-thead">
                {['#', 'Name', 'Employee ID', 'Department', 'Designation', 'Join Date', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide t-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => (
                <tr key={emp.id} className="border-t t-divider transition-colors hover:bg-neutral-800/30">
                  <td className="px-5 py-3 text-sm t-text-subtle">{idx + 1}</td>
                  <td className="px-5 py-3 text-sm font-semibold t-text-primary">{emp.name}</td>
                  <td className="px-5 py-3 text-sm t-text-secondary">{emp.employee_id || emp.employeeId || '—'}</td>
                  <td className="px-5 py-3 text-sm t-text-secondary">{emp.department || '—'}</td>
                  <td className="px-5 py-3 text-sm t-text-secondary">{emp.designation || '—'}</td>
                  <td className="px-5 py-3 text-sm t-text-secondary">{emp.join_date ? String(emp.join_date).slice(0, 10) : '—'}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        emp.status === 'inactive'
                          ? 'bg-neutral-700/60 t-text-muted'
                          : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {emp.status === 'inactive' ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center t-text-subtle">
                    No employees found.
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
