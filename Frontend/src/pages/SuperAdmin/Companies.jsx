import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, LogIn, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import {
  deleteCompany,
  getCompanies,
  impersonateCompanyAdmin,
  updateCompanyStatus
} from '../../api/superAdminApi';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../constants/routes.constants';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import { buildUploadedFileUrl } from '../../utils';

const pageSize = 10;

export default function SuperAdminCompanies() {
  const { showToast, startImpersonation } = useApp();
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [loading, setLoading] = useState(false);

  const loadCompanies = useCallback((page = pagination.page) => {
    setLoading(true);
    getCompanies({ page, limit: pageSize, search, status, plan, sort, order })
      .then((response) => {
        setCompanies(response.data.data || []);
        setPagination(response.data.pagination || { page, totalPages: 1, total: 0 });
      })
      .finally(() => setLoading(false));
  }, [pagination.page, search, status, plan, sort, order]);

  useEffect(() => {
    loadCompanies(1);
  }, [loadCompanies]);

  const plans = useMemo(() => Array.from(new Set(companies.map((company) => company.plan).filter(Boolean))), [companies]);

  const handleStatus = async (company, nextStatus) => {
    await updateCompanyStatus(company.id, nextStatus);
    showToast('Company status updated', 'success');
    loadCompanies();
  };

  const handleDelete = async (company) => {
    await deleteCompany(company.id);
    showToast('Company deactivated', 'success');
    loadCompanies();
  };

  const handleImpersonate = async (company) => {
    const response = await impersonateCompanyAdmin(company.id);
    await startImpersonation(response.data.user, response.data.token);
  };

  return (
    <div className="p-10 mt-18">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="m-0 text-2xl font-semibold text-slate-900">Company Management</h2>
          <p className="mt-1 text-sm text-slate-500">Manage tenants, subscriptions, and admin access.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search companies" className="lg:col-span-2" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="border border-slate-300 bg-white px-3 py-3 text-sm">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <select value={plan} onChange={(event) => setPlan(event.target.value)} className="border border-slate-300 bg-white px-3 py-3 text-sm">
            <option value="">All Plans</option>
            {plans.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={`${sort}:${order}`} onChange={(event) => {
            const [nextSort, nextOrder] = event.target.value.split(':');
            setSort(nextSort);
            setOrder(nextOrder);
          }} className="border border-slate-300 bg-white px-3 py-3 text-sm">
            <option value="created_at:desc">Newest</option>
            <option value="created_at:asc">Oldest</option>
            <option value="company_name:asc">Name A-Z</option>
            <option value="company_name:desc">Name Z-A</option>
          </select>
        </div>
      </div>

      <DataTable headers={['Logo', 'Company Name', 'Company Admin', 'Email', 'Plan', 'Employees', 'Database Name', 'Status', 'Created Date', 'Actions']}>
        {companies.map((company) => (
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
            <td className="px-5 py-4 text-sm text-slate-700">{company.databaseName}</td>
            <td className="px-5 py-4">
              <StatusBadge tone={company.status === 'active' ? 'green' : 'red'}>{company.status}</StatusBadge>
            </td>
            <td className="px-5 py-4 text-sm text-slate-700">{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : '-'}</td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <Link title="View" to={ROUTES.SUPER_ADMIN_COMPANY_DETAILS.replace(':id', company.id)} className="text-blue-600 hover:text-blue-800">
                  <Eye size={18} />
                </Link>
                <button title="Login as Admin" type="button" onClick={() => handleImpersonate(company)} className="text-slate-700 hover:text-blue-700">
                  <LogIn size={18} />
                </button>
                {company.status === 'active' ? (
                  <button title="Suspend" type="button" onClick={() => handleStatus(company, 'suspended')} className="text-yellow-700 hover:text-yellow-900">
                    <PauseCircle size={18} />
                  </button>
                ) : (
                  <button title="Activate" type="button" onClick={() => handleStatus(company, 'active')} className="text-green-700 hover:text-green-900">
                    <PlayCircle size={18} />
                  </button>
                )}
                <button title="Delete" type="button" onClick={() => handleDelete(company)} className="text-red-600 hover:text-red-800">
                  <Trash2 size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
        {!companies.length && (
          <tr>
            <td colSpan="10" className="px-5 py-8 text-center text-sm text-slate-500">
              {loading ? 'Loading companies...' : 'No companies found'}
            </td>
          </tr>
        )}
      </DataTable>

      <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
        <span>Total companies: {pagination.total || 0}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => loadCompanies(pagination.page - 1)}
            className="border border-slate-300 bg-white px-3 py-2 disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadCompanies(pagination.page + 1)}
            className="border border-slate-300 bg-white px-3 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
