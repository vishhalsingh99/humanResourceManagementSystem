import { useApp } from '../context/AppContext';
import { Users, CalendarDays, IndianRupee, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes.constants';

const cards = (stats) => [
  {
    label: 'Total Employees',
    value: stats.employees,
    icon: Users,
    color: 'text-red-300',
    bg: 'bg-red-500/15 border border-red-500/25',
    bar: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
    to: ROUTES.EMPLOYEES,
  },
  {
    label: 'Meetings',
    value: stats.meetings,
    icon: CalendarDays,
    color: 't-text-secondary',
    bg: 'bg-neutral-800/80 border t-border',
    bar: 'bg-neutral-400',
    to: ROUTES.MEETINGS,
  },
  {
    label: 'Departments',
    value: stats.department,
    icon: Building2,
    color: 'text-rose-300',
    bg: 'bg-rose-500/10 border border-rose-500/20',
    bar: 'bg-rose-500',
    to: ROUTES.DEPARTMENTS,
  },
  {
    label: 'Total Payroll',
    value: 'Rs ' + stats.payroll.toLocaleString(),
    icon: IndianRupee,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10 border border-emerald-500/20',
    bar: 'bg-emerald-500',
    to: ROUTES.PAYROLL,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { employees, meetings, payrolls, departments } = useApp();

  const payroll = Array.isArray(payrolls)
    ? payrolls
        .filter((p) => p.status === 'Paid')
        .reduce((sum, p) => sum + Number(p.net_salary || 0), 0)
    : 0;

  const stats = {
    employees: employees.length || 0,
    meetings: meetings.length || 0,
    department: departments.length || 0,
    payroll: payroll || 0,
  };

  return (
    <div className="p-6 pt-8 sm:p-8 lg:p-10">
      <div className="mb-8">
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
          Workspace overview
        </p>
        <h2 className="m-0 text-3xl font-semibold tracking-tight t-text-heading">Dashboard</h2>
        <p className="mt-2 text-sm t-text-muted">A clear view of your company operations.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {cards(stats).map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => navigate(c.to)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border t-border bg-[var(--bg-surface)] px-6 pb-6 pt-6 text-left shadow-[0_0_24px_rgba(239,68,68,0.06)] backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:border-red-500/30 hover:shadow-[0_0_28px_rgba(239,68,68,0.15)] focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${c.bg}`}>
              <c.icon size={24} className={c.color} />
            </div>
            <div className="text-4xl font-semibold leading-none tracking-tight t-text-heading">{c.value}</div>
            <div className="mt-3 font-mono text-xs font-medium uppercase tracking-[0.12em] t-text-subtle">
              {c.label}
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl ${c.bar}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
