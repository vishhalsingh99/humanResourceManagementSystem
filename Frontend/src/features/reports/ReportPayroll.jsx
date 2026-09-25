import { useMemo, useState } from 'react';
import { IndianRupee, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import SearchBar from '../../components/common/SearchBar';

const statusCls = {
  Paid: 'bg-emerald-500/15 text-emerald-300',
  Pending: 'bg-amber-500/15 text-amber-300',
  Failed: 'bg-rose-500/15 text-rose-300',
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ReportPayroll() {
  const { payrolls } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('');

  const safePayrolls = Array.isArray(payrolls) ? payrolls : [];

  const totalPaid = safePayrolls
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + Number(p.net_salary || 0), 0);
  const pending = safePayrolls.filter((p) => p.status === 'Pending').length;
  const failed = safePayrolls.filter((p) => p.status === 'Failed').length;
  const paid = safePayrolls.filter((p) => p.status === 'Paid').length;

  const stats = [
    { label: 'Total Paid', value: `₹${totalPaid.toLocaleString()}`, icon: IndianRupee, box: 'border-emerald-500/25 bg-emerald-500/10', text: 'text-emerald-400', value_cls: 'text-emerald-300' },
    { label: 'Paid Records', value: paid, icon: CheckCircle2, box: 'border-blue-500/25 bg-blue-500/10', text: 'text-blue-400', value_cls: 'text-blue-300' },
    { label: 'Pending', value: pending, icon: Clock, box: 'border-amber-500/25 bg-amber-500/10', text: 'text-amber-400', value_cls: 'text-amber-300' },
    { label: 'Failed', value: failed, icon: XCircle, box: 'border-rose-500/25 bg-rose-500/10', text: 'text-rose-400', value_cls: 'text-rose-300' },
  ];

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return safePayrolls.filter((p) => {
      const matchesSearch =
        (p.employee?.name || '').toLowerCase().includes(term) ||
        (p.employee?.department || '').toLowerCase().includes(term) ||
        (p.month || '').toLowerCase().includes(term) ||
        String(p.year || '').includes(term);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesMonth = !monthFilter || p.month === monthFilter;
      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [safePayrolls, search, statusFilter, monthFilter]);

  return (
    <div className="p-4 sm:p-6 mt-4 lg:p-10">
      {/* Header */}
      <div className="mb-6">
        <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-red-400">Reports</p>
        <h1 className="text-3xl font-semibold text-neutral-50">Payroll Report</h1>
        <p className="mt-1 text-sm text-neutral-400">Overview of salary and payroll records.</p>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, box, text, value_cls }) => (
          <div key={label} className={`rounded-xl border p-4 ${box}`}>
            <div className="mb-2 flex items-center gap-2">
              <Icon size={16} className={text} />
              <p className={`text-sm font-medium ${text}`}>{label}</p>
            </div>
            <p className={`text-2xl font-bold ${value_cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          className="flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by employee, department, month…"
        />
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded-xl border border-neutral-700 bg-neutral-950/65 px-4 py-2.5 text-sm text-neutral-100 outline-none transition focus:border-red-500/70"
        >
          <option value="">All Months</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-neutral-700 bg-neutral-950/65 px-4 py-2.5 text-sm text-neutral-100 outline-none transition focus:border-red-500/70"
        >
          <option value="all">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-neutral-950/80">
                {['#', 'Employee', 'Department', 'Month', 'Year', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p.id} className="border-t border-neutral-800 transition-colors hover:bg-neutral-800/30">
                  <td className="px-5 py-3 text-sm text-neutral-500">{idx + 1}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-neutral-100">{p.employee?.name || '—'}</td>
                  <td className="px-5 py-3 text-sm text-neutral-300">{p.employee?.department || '—'}</td>
                  <td className="px-5 py-3 text-sm text-neutral-300">{p.month || '—'}</td>
                  <td className="px-5 py-3 text-sm text-neutral-300">{p.year || '—'}</td>
                  <td className="px-5 py-3 text-sm text-neutral-300">₹{Number(p.basic_salary || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-neutral-300">₹{Number(p.allowances || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-neutral-300">₹{Number(p.deductions || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-emerald-400">₹{Number(p.net_salary || 0).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusCls[p.status] || 'bg-neutral-700/60 text-neutral-400'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center text-neutral-500">
                    No payroll records found.
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
