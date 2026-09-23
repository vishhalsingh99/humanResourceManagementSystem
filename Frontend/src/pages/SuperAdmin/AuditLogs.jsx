import { useEffect, useState } from 'react';
import { getAuditLogs } from '../../api/superAdminApi';
import DataTable from '../../components/common/DataTable';

export default function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    getAuditLogs().then((response) => setLogs(response.data || []));
  }, []);

  return (
    <div className="p-10 mt-18">
      <div className="mb-7">
        <h2 className="m-0 text-2xl font-semibold text-slate-900">Audit Logs</h2>
        <p className="mt-1 text-sm text-slate-500">Super Admin actions across companies.</p>
      </div>

      <DataTable headers={['Company', 'Super Admin ID', 'Action', 'IP Address', 'Browser', 'Login Time', 'Logout Time']}>
        {logs.map((log) => (
          <tr key={log.id} className="border-t border-slate-100">
            <td className="px-5 py-4 text-sm font-semibold text-slate-900">{log.company_name || '-'}</td>
            <td className="px-5 py-4 text-sm text-slate-700">{log.super_admin_id}</td>
            <td className="px-5 py-4 text-sm text-slate-700">{log.action}</td>
            <td className="px-5 py-4 text-sm text-slate-700">{log.ip_address || '-'}</td>
            <td className="max-w-md truncate px-5 py-4 text-sm text-slate-700">{log.browser || '-'}</td>
            <td className="px-5 py-4 text-sm text-slate-700">{log.login_time ? new Date(log.login_time).toLocaleString() : '-'}</td>
            <td className="px-5 py-4 text-sm text-slate-700">{log.logout_time ? new Date(log.logout_time).toLocaleString() : '-'}</td>
          </tr>
        ))}
        {!logs.length && (
          <tr>
            <td colSpan="7" className="px-5 py-8 text-center text-sm text-slate-500">No audit logs found</td>
          </tr>
        )}
      </DataTable>
    </div>
  );
}
