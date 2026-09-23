import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCompany, impersonateCompanyAdmin, updateCompanyStatus } from '../../api/superAdminApi';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import { buildUploadedFileUrl } from '../../utils';

export default function SuperAdminCompanyDetails() {
  const { id } = useParams();
  const { showToast, startImpersonation } = useApp();
  const [company, setCompany] = useState(null);

  const loadCompany = useCallback(() => {
    getCompany(id).then((response) => setCompany(response.data));
  }, [id]);

  useEffect(() => {
    void loadCompany();
  }, [loadCompany]);

  const handleStatus = async (status) => {
    await updateCompanyStatus(id, status);
    showToast('Company status updated', 'success');
    loadCompany();
  };

  const handleImpersonate = async () => {
    const response = await impersonateCompanyAdmin(id);
    await startImpersonation(response.data.user, response.data.token);
  };

  if (!company) {
    return <div className="p-10 mt-18 text-sm text-slate-500">Loading company...</div>;
  }

  return (
    <div className="p-10 mt-18">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {company.logo ? (
            <img src={buildUploadedFileUrl(company.logo)} alt="" className="h-14 w-14 object-contain" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded bg-blue-50 text-xl font-bold text-blue-600">
              {(company.companyName || 'C').charAt(0)}
            </div>
          )}
          <div>
            <h2 className="m-0 text-2xl font-semibold text-slate-900">{company.companyName}</h2>
            <p className="mt-1 text-sm text-slate-500">{company.databaseName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleImpersonate} className="bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Login as Admin
          </button>
          {company.status === 'active' ? (
            <button type="button" onClick={() => handleStatus('suspended')} className="bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600">
              Suspend
            </button>
          ) : (
            <button type="button" onClick={() => handleStatus('active')} className="bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
              Activate
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {[
          ['Company Admin', company.companyAdmin || '-'],
          ['Email', company.email || '-'],
          ['Plan', company.plan || '-'],
          ['Employees', company.employees],
          ['Subscription Status', company.subscriptionStatus || '-'],
          ['Created Date', company.createdAt ? new Date(company.createdAt).toLocaleString() : '-'],
        ].map(([label, value]) => (
          <div key={label} className="bg-white p-5 shadow-sm">
            <p className="m-0 text-xs font-semibold uppercase text-slate-500">{label}</p>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {label === 'Subscription Status' ? (
                <StatusBadge tone={value === 'active' ? 'green' : 'red'}>{value}</StatusBadge>
              ) : value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
