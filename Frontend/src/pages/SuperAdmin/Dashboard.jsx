import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, PauseCircle, Users, CreditCard, IndianRupee, Clock } from 'lucide-react';
import { getSuperAdminDashboard } from '../../api/superAdminApi';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { buildUploadedFileUrl } from '../../utils';

const cards = (stats) => [
  { label: 'Total Companies', value: stats.totalCompanies || 0, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Active Companies', value: stats.activeCompanies || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Inactive Companies', value: stats.inactiveCompanies || 0, icon: PauseCircle, color: 'text-red-600', bg: 'bg-red-50' },
  { label: 'Trial Companies', value: stats.trialCompanies || 0, icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-50' },
  { label: 'Total Employees', value: stats.totalEmployees || 0, icon: Users, color: 'text-blue-900', bg: 'bg-blue-100' },
  { label: 'Active Subscriptions', value: stats.activeSubscriptions || 0, icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Expired Subscriptions', value: stats.expiredSubscriptions || 0, icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50' },
  { label: 'Monthly Revenue', value: 'Rs ' + Number(stats.monthlyRevenue || 0).toLocaleString(), icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
];

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentCompanies, setRecentCompanies] = useState([]);

  useEffect(() => {
    getSuperAdminDashboard()
      .then((response) => {
        setStats(response.data.stats || {});
        setRecentCompanies(response.data.recentCompanies || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-10 mt-18">
      <div className="mb-7">
        <h2 className="text-2xl font-semibold text-slate-900 m-0">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">Welcome back - here's your HRMS overview</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards(stats).map((card) => (
          <div key={card.label} className="relative overflow-hidden rounded-2xl bg-white px-6 pt-7 pb-5 shadow-sm">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}>
              <card.icon size={24} className={card.color} />
            </div>
            <div className="text-4xl font-semibold leading-none text-slate-900">{loading ? '...' : card.value}</div>
            <div className="mt-2 text-xs font-medium text-slate-500">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Recent Company Registrations</h3>
        <DataTable headers={['Logo', 'Company Name', 'Company Admin', 'Email', 'Plan', 'Employees', 'Status', 'Created Date']}>
          {recentCompanies.map((company) => (
            <tr key={company.id} className="border-t border-slate-100">
              <td className="px-5 py-4">
                {company.logo ? (
                  <img src={buildUploadedFileUrl(company.logo)} alt="" className="h-9 w-9 object-contain" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-50 text-sm font-bold text-blue-600">
                    {(company.companyName || 'C').charAt(0)}
                  </div>
                )}
              </td>
              <td className="px-5 py-4 text-sm font-semibold text-slate-900">{company.companyName}</td>
              <td className="px-5 py-4 text-sm text-slate-700">{company.companyAdmin || '-'}</td>
              <td className="px-5 py-4 text-sm text-slate-700">{company.email || '-'}</td>
              <td className="px-5 py-4 text-sm text-slate-700">{company.plan}</td>
              <td className="px-5 py-4 text-sm text-slate-700">{company.employees}</td>
              <td className="px-5 py-4">
                <StatusBadge tone={company.status === 'active' ? 'green' : 'red'}>{company.status}</StatusBadge>
              </td>
              <td className="px-5 py-4 text-sm text-slate-700">{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
