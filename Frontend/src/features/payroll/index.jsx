import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';
import SelectField from '../../components/common/SelectField';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import DataTable from '../../components/table/DataTable';
import Pagination from '../../components/table/Pagination';
const empty = { employee: '', month: '', year: '', basic_salary: '', allowances: '', deductions: '', net_salary: '', status: 'Pending' };
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const itemsPerPage = 10;

const statusCls = {
  Paid: 'bg-emerald-500/15 text-emerald-300',
  Pending: 'bg-amber-500/15 text-amber-300',
  Failed: 'bg-rose-500/15 text-rose-300',
};

export default function Payroll() {
  const { payrolls, loadPayrolls, employees, loadEmployees, showToast, hasPermission } = useApp();
  const canGeneratePayroll = hasPermission('payroll.generate');
  const canDeletePayroll = hasPermission('payroll.delete');

  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [deletePayrollId, setDeletePayrollId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadPayrolls();
    loadEmployees();
  }, [loadPayrolls, loadEmployees]);

  // SAFE ARRAY FIX
  const safePayrolls = Array.isArray(payrolls) ? payrolls : [];
  const totalPages = Math.max(1, Math.ceil(safePayrolls.length / itemsPerPage));
  const paginatedPayrolls = safePayrolls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleEmployeeChange(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    setForm((f) => ({ ...f, employee: employeeId, basic_salary: emp?.salary || '' }));
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    const basic = parseFloat(form.basic_salary) || 0;
    const allowances = parseFloat(form.allowances) || 0;
    const deductions = parseFloat(form.deductions) || 0;
    const net = basic + allowances - deductions;
    setForm((f) => ({ ...f, net_salary: net.toFixed(2) }));
  }, [form.basic_salary, form.allowances, form.deductions]);

  function openAddPayroll() {
    if (!canGeneratePayroll) return;
    setForm(empty);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(empty);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await axios.post('/api/payroll', form);
      showToast('Payroll recorded');
      closeForm();
      loadPayrolls();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error', 'error');
    }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`/api/payroll/${id}`);
      showToast('Payroll deleted', 'error');
      loadPayrolls();
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to delete payroll', 'error');
    }
  }

  async function confirmDeletePayroll() {
    if (!deletePayrollId) return;

    await handleDelete(deletePayrollId);
    setDeletePayrollId(null);
  }

  const totalPayroll = safePayrolls
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + Number(p.net_salary || 0), 0);

  if (showForm) {
    return (
      <div className="p-4 mt-18 md:p-10">
        <form onSubmit={handleSubmit} className="rounded-2xl border t-border bg-[var(--bg-surface)] p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md sm:p-7">
          <div className="flex flex-col gap-4 border-b t-divider pb-6 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={closeForm}
              className="flex items-center gap-2 self-start rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400 cursor-pointer"
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>

            <div className="text-left lg:text-right">
              <h2 className="m-0 text-3xl font-semibold t-text-heading">Record Salary</h2>
              <p className="mt-2 text-sm t-text-muted">Use the form below to record payroll details.</p>
            </div>
          </div>

          <div className="pt-8">
            <h3 className="m-0 text-2xl font-semibold t-text-heading">Payroll Details</h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              <SelectField label="Employee" value={form.employee} onChange={(e) => handleEmployeeChange(e.target.value)} required inputClassName="rounded-xl px-3 py-2">
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} - {e.department}
                    </option>
                  ))}
              </SelectField>

              <SelectField label="Month" value={form.month} onChange={(e) => updateField('month', e.target.value)} required inputClassName="rounded-xl px-3 py-2">
                  <option value="">Select month</option>
                  {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
              </SelectField>

              <InputField type="number" label="Year" value={form.year} onChange={(e) => updateField('year', e.target.value)} placeholder="Enter year" required inputClassName="rounded-xl px-3 py-2" />
              <InputField type="number" step="0.01" label="Basic Salary" value={form.basic_salary} onChange={(e) => updateField('basic_salary', e.target.value)} placeholder="Enter basic salary" required inputClassName="rounded-xl px-3 py-2" />
              <InputField type="number" step="0.01" label="Allowances" value={form.allowances} onChange={(e) => updateField('allowances', e.target.value)} placeholder="Enter allowances" inputClassName="rounded-xl px-3 py-2" />
              <InputField type="number" step="0.01" label="Deductions" value={form.deductions} onChange={(e) => updateField('deductions', e.target.value)} placeholder="Enter deductions" inputClassName="rounded-xl px-3 py-2" />
              <InputField type="number" step="0.01" label="Net Salary" value={form.net_salary} placeholder="Calculated automatically" readOnly disabled inputClassName="rounded-xl px-3 py-2" />
              <SelectField label="Status" value={form.status} onChange={(e) => updateField('status', e.target.value)} options={['Pending', 'Paid', 'Failed']} required inputClassName="rounded-xl px-3 py-2" />
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t t-divider pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={closeForm}
              variant="secondary"
            >
              Back
            </Button>
            <Button
              type="submit"
            >
              Record Salary
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 mt-18 md:p-10">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h2 className="text-3xl font-semibold t-text-heading m-0">Payroll</h2>
          <p className="t-text-muted text-sm mt-1">
            Total Payroll:
            <span className="font-bold text-emerald-400"> Rs {totalPayroll.toLocaleString()}</span>
          </p>
        </div>

        {canGeneratePayroll && (
          <Button
            onClick={openAddPayroll}
            icon={Plus}
            className="self-start rounded-xl bg-red-500 px-5 py-2 shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:bg-red-400 sm:self-auto"
          >
            Record Salary
          </Button>
        )}
      </div>

      <DataTable
        headers={['Employee', 'Department', 'Month',  'Year', 'Basic Salary', 'Allowances', 'Present Days',  'Absent Days', 'Leave Days', 'Deductions', 'Net Salary', 'Payment Date', 'Status', 'Actions']}
        className="rounded-2xl border t-border bg-[var(--bg-surface)] shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md"
        tableClassName="w-full border-collapse min-w-3xl"
        headClassName=""
        headerCellClassName="t-thead px-2 py-3 text-left text-xs t-text-secondary font-semibold uppercase tracking-wide sm:px-4"
      >
              {paginatedPayrolls.map((p, i) => (
                <tr key={p.id} className={`border-b t-divider ${i % 2 === 0 ? 'bg-[var(--bg-surface)]' : 'bg-[var(--bg-input)]'}`}>
                  <td className="px-2 py-3 text-sm font-medium t-text-heading sm:px-4">{p.employee?.name}</td>
                  <td className="px-2 py-3 text-sm t-text-secondary sm:px-4">{p.employee?.department || '—'}</td>
                  <td className="px-2 py-3 text-sm t-text-secondary sm:px-4">{p.month}</td>
                  <td className="px-2 py-3 text-sm t-text-secondary sm:px-4">{p.year}</td>
                  <td className="px-2 py-3 text-sm t-text-secondary sm:px-4">Rs {Number(p.basic_salary).toLocaleString()}</td>
                  <td className="px-2 py-3 text-sm t-text-secondary sm:px-4">Rs {Number(p.allowances).toLocaleString()}</td>
                  <td className="px-2 py-3 text-sm t-text-secondary sm:px-4">{p.presentDays}</td>
                  <td className="px-2 py-3 text-sm t-text-secondary sm:px-4">{p.absentDays}</td>
                  <td className="px-2 py-3 text-sm t-text-secondary sm:px-4">{p.leaveDays}</td>
                  <td className="px-2 py-3 text-sm t-text-secondary sm:px-4">Rs {Number(p.deductions).toLocaleString()}</td>
                  <td className="px-2 py-3 text-sm font-medium text-emerald-400 sm:px-4">Rs {Number(p.net_salary).toLocaleString()}</td>
                  <td className="px-2 py-3 text-sm t-text-secondary sm:px-4">{p.payment_date ? String(p.payment_date).slice(0, 10).split('-').reverse().join('/') : '—'}</td>
                  <td className="px-2 py-3 sm:px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls[p.status] || ''} sm:px-3`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-2 py-3 sm:px-4">
                    {canDeletePayroll && (
                      <button
                        onClick={() => setDeletePayrollId(p.id)}
                        className="px-2 py-1 rounded-xl border t-border bg-[var(--bg-input)] text-rose-400 text-xs font-semibold hover:border-rose-500/40 hover:bg-rose-500/10 cursor-pointer transition-colors sm:px-3"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {safePayrolls.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-2 py-8 text-center t-text-subtle sm:px-4">
                    No payroll records found.
                  </td>
                </tr>
              )}
      </DataTable>
      <Pagination
        currentPage={currentPage}
        totalItems={safePayrolls.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {deletePayrollId && (
        <DeleteConfirmationModal
          title="Delete Payroll"
          message="Are you sure you want to delete this payroll? This action cannot be undone."
          onCancel={() => setDeletePayrollId(null)}
          onConfirm={confirmDeletePayroll}
        />
      )}
    </div>
  );
}