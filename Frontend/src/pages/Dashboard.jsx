import { useApp } from '../context/AppContext';
import { Users, CalendarDays, IndianRupee, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes.constants';

const cards = (stats) => [
  { label: 'Total Employees', value: stats.employees, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', bar: 'bg-blue-500', to: ROUTES.EMPLOYEES },
  { label: 'Meetings', value: stats.meetings, icon: CalendarDays, color: 'text-indigo-500', bg: 'bg-indigo-50', bar: 'bg-indigo-500', to: ROUTES.MEETINGS },
  { label: 'Departments', value: stats.department, icon: Building2, color: 'text-sky-500', bg: 'bg-sky-50', bar: 'bg-sky-500', to: ROUTES.DEPARTMENTS },
  { label: 'Total Payroll', value: 'Rs ' + stats.payroll.toLocaleString(), icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-50', bar: 'bg-emerald-500', to: ROUTES.PAYROLL },
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
    <div className="p-10 mt-18">
      <div className="mb-7">
        <h2 className="text-2xl font-semibold text-slate-900 m-0">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">Welcome back — here's your HRMS overview</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {cards(stats).map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => navigate(c.to)}
            className="group cursor-pointer rounded-2xl bg-white px-6 pt-7 pb-5 text-left shadow-sm  transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 relative overflow-hidden"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${c.bg}`}>
              <c.icon size={24} className={c.color} />
            </div>
            <div className="text-4xl font-semibold text-slate-900 leading-none">{c.value}</div>
            <div className="text-slate-500 text-xs mt-2 font-medium">{c.label}</div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl ${c.bar}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
