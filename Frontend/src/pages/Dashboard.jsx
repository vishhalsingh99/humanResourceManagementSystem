import { useApp } from '../context/AppContext';
import { Users, CalendarDays, IndianRupee, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes.constants';

const cards = (stats) => [
  { label: 'Total Employees', value: stats.employees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-600', to: ROUTES.EMPLOYEES },
  { label: 'Meetings', value: stats.meetings, icon: CalendarDays, color: 'text-violet-600', bg: 'bg-violet-50', bar: 'bg-violet-600', to: ROUTES.MEETINGS },
  { label: 'Departments', value: stats.department, icon: Building2, color: 'text-cyan-600', bg: 'bg-cyan-50', bar: 'bg-cyan-600', to: ROUTES.DEPARTMENTS },
  { label: 'Total Payroll', value: 'Rs ' + stats.payroll.toLocaleString(), icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-600', to: ROUTES.PAYROLL },
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
    <div className="p-6 pt-28 sm:p-8 sm:pt-28 lg:p-10 lg:pt-28">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Workspace overview</p>
        <h2 className="m-0 text-3xl font-semibold tracking-tight text-slate-950">Dashboard</h2>
        <p className="mt-2 text-sm text-slate-500">A clear view of your company operations.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {cards(stats).map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => navigate(c.to)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-6 pb-6 pt-6 text-left shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.10)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${c.bg}`}>
              <c.icon size={24} className={c.color} />
            </div>
            <div className="text-4xl font-semibold leading-none tracking-tight text-slate-950">{c.value}</div>
            <div className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{c.label}</div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl ${c.bar}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
