import { useEffect, useState } from 'react';
import { getCompanies, updateCompanySubscription } from '../../api/superAdminApi';
import { useApp } from '../../context/AppContext';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export default function SuperAdminSubscription() {
  const { showToast } = useApp();
  const [companies, setCompanies] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const loadCompanies = () => {
    getCompanies({ limit: 100 }).then((response) => setCompanies(response.data.data || []));
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleUpdate = async (company, field, value) => {
    setSavingId(company.id);
    await updateCompanySubscription(company.id, {
      planId: field === 'plan' ? value : company.plan,
      status: field === 'status' ? value : company.subscriptionStatus || 'active'
    });
    showToast('Subscription updated', 'success');
    setSavingId(null);
    loadCompanies();
  };

  return (
    <div className="p-10 mt-18">
      <div className="mb-7">
        <h2 className="m-0 text-2xl font-semibold text-slate-900">Subscription Management</h2>
        <p className="mt-1 text-sm text-slate-500">Update company plans and subscription status.</p>
      </div>

      <DataTable headers={['Company', 'Plan', 'Subscription Status', 'Employees', 'Database Name', 'Updated Date']}>
        {companies.map((company) => (
          <tr key={company.id} className="border-t border-slate-100">
            <td className="px-5 py-4 text-sm font-semibold text-slate-900">{company.companyName}</td>
            <td className="px-5 py-4">
              <select
                value={company.plan || 'basic'}
                disabled={savingId === company.id}
                onChange={(event) => handleUpdate(company, 'plan', event.target.value)}
                className="border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="trial">trial</option>
                <option value="basic">basic</option>
                <option value="professional">professional</option>
                <option value="enterprise">enterprise</option>
              </select>
            </td>
            <td className="px-5 py-4">
              <select
                value={company.subscriptionStatus || 'active'}
                disabled={savingId === company.id}
                onChange={(event) => handleUpdate(company, 'status', event.target.value)}
                className="border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="cancelled">cancelled</option>
              </select>
              <span className="ml-2">
                <StatusBadge tone={(company.subscriptionStatus || 'active') === 'active' ? 'green' : 'red'}>
                  {company.subscriptionStatus || 'active'}
                </StatusBadge>
              </span>
            </td>
            <td className="px-5 py-4 text-sm text-slate-700">{company.employees}</td>
            <td className="px-5 py-4 text-sm text-slate-700">{company.databaseName}</td>
            <td className="px-5 py-4 text-sm text-slate-700">{company.updatedAt ? new Date(company.updatedAt).toLocaleDateString() : '-'}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
