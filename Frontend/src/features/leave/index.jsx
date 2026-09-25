import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, PencilLine, Trash2, Check, X, ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';
import SearchBar from '../../components/common/SearchBar';
import SelectField from '../../components/common/SelectField';
import StatusBadge from '../../components/common/StatusBadge';
import TextareaField from '../../components/common/TextareaField';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import DataTable from '../../components/table/DataTable';
import Pagination from '../../components/table/Pagination';
import { getCarryForwardHistory, getLeaveBalance, saveCarryForward } from '../../api/leaveApi';

const emptyForm = {
  employee_id: '',
  leave_type: 'Sick Leave',
  start_date: '',
  end_date: '',
  reason: '',
};

const leave_types = [
  'Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave'];
const itemsPerPage = 10;
const monthOptions = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();

export default function Leave() {
  const { leaves, loadLeaves, employees, showToast, user, hasPermission } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState('All');
  const [deleteLeaveId, setDeleteLeaveId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const isEmployee = user?.role === 'employee';
  const canApplyLeave = hasPermission('leave.apply');
  const canViewAllLeave = hasPermission('leave.view_all');
  const canApproveLeave = hasPermission('leave.approve');
  const canRejectLeave = hasPermission('leave.reject');
  const canDeleteByPermission = hasPermission('leave.delete');
  const canEditByPermission = hasPermission('leave.apply');
  const canEditCarryForward = hasPermission('settings.edit');
  const currentEmployeeId = user?.employeeId || user?.employee_id || '';
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [carryForwardEmployeeId, setCarryForwardEmployeeId] = useState('');
  const [carryForwardMonth, setCarryForwardMonth] = useState(currentMonth);
  const [carryForwardYear, setCarryForwardYear] = useState(currentYear);
  const [carryForwardValue, setCarryForwardValue] = useState('');
  const [carryForwardHistory, setCarryForwardHistory] = useState([]);
  const [savingCarryForward, setSavingCarryForward] = useState(false);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  useEffect(() => {
    if (!isEmployee || !currentEmployeeId) return;
    getLeaveBalance(currentEmployeeId)
      .then((response) => setLeaveBalance(response.data))
      .catch(() => setLeaveBalance(null));
  }, [currentEmployeeId, isEmployee]);

  useEffect(() => {
    if (isEmployee || carryForwardEmployeeId || employees.length === 0) return;
    setCarryForwardEmployeeId(String(employees[0].id));
  }, [carryForwardEmployeeId, employees, isEmployee]);

  useEffect(() => {
    if (isEmployee || !carryForwardEmployeeId) return;
    getCarryForwardHistory(carryForwardEmployeeId)
      .then((response) => setCarryForwardHistory(response.data || []))
      .catch(() => setCarryForwardHistory([]));
  }, [carryForwardEmployeeId, isEmployee]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  function openAddLeave() {
    setEditingLeave(null);
    setForm({
      ...emptyForm,
      employee_id: isEmployee ? currentEmployeeId : '',
    });
    setShowForm(true);
  }

  function openEditLeave(leave) {
    setEditingLeave(leave);
    setForm({
      employee_id: leave.employee_id || '',
      leave_type: leave.leave_type || 'Sick Leave',
      start_date: leave.start_date ? String(leave.start_date).slice(0, 10) : '',
      end_date: leave.end_date ? String(leave.end_date).slice(0, 10) : '',
      reason: leave.reason || '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingLeave(null);
    setForm({
      ...emptyForm,
      employee_id: isEmployee ? currentEmployeeId : '',
    });
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (editingLeave?.id) {
        await axios.put(`/api/leaves/${editingLeave.id}`, {
          ...form,
          employee_id: isEmployee ? currentEmployeeId : form.employee_id,
        });
        showToast('Leave updated');
      } else {
        await axios.post('/api/leaves', {
          ...form,
          employee_id: isEmployee ? currentEmployeeId : form.employee_id,
        });
        showToast('Leave request submitted');
      }

      await loadLeaves();
      closeForm();
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to save leave', 'error');
    }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`/api/leaves/${id}`);
      showToast('Leave deleted', 'error');
      loadLeaves();
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to delete leave', 'error');
    }
  }

  async function confirmDeleteLeave() {
    if (!deleteLeaveId) return;

    await handleDelete(deleteLeaveId);
    setDeleteLeaveId(null);
  }

  async function handleStatusUpdate(leave, newStatus) {
    try {
      if (newStatus === 'Approved' && !canApproveLeave) return;
      if (newStatus === 'Rejected' && !canRejectLeave) return;
      await axios.put(`/api/leaves/${leave.id}`, { status: newStatus });
      showToast(`Leave ${newStatus.toLowerCase()}`);
      loadLeaves();
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to update leave status', 'error');
    }
  }

  async function handleCarryForwardSave(e) {
    e.preventDefault();
    if (!carryForwardEmployeeId) {
      showToast('Select an employee first', 'error');
      return;
    }

    setSavingCarryForward(true);
    try {
      await saveCarryForward(carryForwardEmployeeId, {
        month: Number(carryForwardMonth),
        year: Number(carryForwardYear),
        carryForwardBalance: Number(carryForwardValue || 0),
      });
      const response = await getCarryForwardHistory(carryForwardEmployeeId);
      setCarryForwardHistory(response.data || []);
      showToast('Carry-forward leave saved');
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to save carry-forward leave', 'error');
    } finally {
      setSavingCarryForward(false);
    }
  }

  const filtered = leaves.filter((leave) => {
    const employeeName = leave.employeeName || leave.employee_name || leave.employee?.name || '';
    const employeeCode = leave.employeeCode || leave.employee_code || leave.employee?.employee_id || '';
    const matchesEmployee = canViewAllLeave || !currentEmployeeId || String(leave.employee_id || leave.employeeId || '') === String(currentEmployeeId);
    const matchesSearch =
      employeeName.toLowerCase().includes(search.toLowerCase()) ||
      employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      String(leave.employee_id || '').toLowerCase().includes(search.toLowerCase()) ||
      leave.leave_type?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || leave.status === filterStatus;
    return matchesEmployee && matchesSearch && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedLeaves = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const canEditLeave = (leave) => {
    return canEditByPermission && leave.status === 'Pending';
  };
  const canDeleteLeave = () => canDeleteByPermission;

  const getStatusBadge = (status) => {
    const tones = {
      Pending: 'yellow',
      Approved: 'green',
      Rejected: 'red',
    };
    return <StatusBadge tone={tones[status] || 'slate'}>{status}</StatusBadge>;
  };

  if (showForm) {
    return (
      <div className="p-4 sm:p-6 mt-18 lg:p-10">
        <form onSubmit={handleSubmit} className="rounded-2xl border t-border bg-[var(--bg-surface)] p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md sm:p-7">
          <div className="flex flex-col gap-4 border-b t-divider pb-6 lg:flex-row lg:items-center lg:justify-between">
            <Button
              type="button"
              onClick={closeForm}
              variant="primary"
              icon={ArrowLeft}
              className="self-start rounded-xl"
            >
              <span>Back</span>
            </Button>

            <div className="text-left lg:text-right">
              <h2 className="m-0 text-3xl font-semibold t-text-heading">
                {editingLeave ? 'Update Leave Request' : 'New Leave Request'}
              </h2>
              <p className="mt-2 text-sm t-text-muted">Fill in the details below to submit a leave request.</p>
            </div>
          </div>

          <div className="pt-8">
            <h3 className="m-0 text-2xl font-semibold t-text-heading">Leave Details</h3>
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {!isEmployee && (
                <SelectField label="Employee" value={form.employee_id} onChange={(e) => updateField('employee_id', e.target.value)} required inputClassName="rounded-xl">
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_id})
                    </option>
                  ))}
                </SelectField>
              )}

              <SelectField label="Leave Type" value={form.leave_type} onChange={(e) => updateField('leave_type', e.target.value)} options={leave_types} required inputClassName="rounded-xl" />
              <InputField type="date" label="Start Date" value={form.start_date} onChange={(e) => updateField('start_date', e.target.value)} required inputClassName="rounded-xl" />
              <InputField type="date" label="End Date" value={form.end_date} onChange={(e) => updateField('end_date', e.target.value)} required inputClassName="rounded-xl" />
              <TextareaField className="md:col-span-2 xl:col-span-3" label="Reason" value={form.reason} onChange={(e) => updateField('reason', e.target.value)} placeholder="Enter reason for leave..." inputClassName="rounded-xl" />
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t t-divider pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={closeForm}
              variant="secondary"
              className="rounded-xl"
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="rounded-xl"
            >
              {editingLeave ? 'Update Leave Request' : 'Submit Leave Request'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 mt-18 lg:p-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold t-text-heading">Leave Management</h1>
          <p className="mt-2 text-sm t-text-muted">
            {isEmployee ? 'Request leave and track approval status' : 'Manage employee leave requests'}
          </p>
        </div>
        {canApplyLeave && (
          <Button
            onClick={openAddLeave}
            icon={Plus}
            variant="primary"
            className="rounded-xl px-4 py-2"
          >
            New Leave Request
          </Button>
        )}
      </div>

      {isEmployee && leaveBalance && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4"><p className="text-sm text-violet-300">Paid Leave Balance</p><p className="text-2xl font-bold text-violet-200">{leaveBalance.paidLeaveBalance}</p></div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"><p className="text-sm text-emerald-300">Paid Leave Used</p><p className="text-2xl font-bold text-emerald-200">{leaveBalance.paidLeaveUsed}</p></div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4"><p className="text-sm text-rose-300">Unpaid Leave</p><p className="text-2xl font-bold text-rose-200">{leaveBalance.unpaidLeaveDays}</p></div>
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-4"><p className="text-sm text-sky-300">Carry Forward</p><p className="text-2xl font-bold text-sky-200">{leaveBalance.carryForwardBalance}</p></div>
        </div>
      )}

      {canEditCarryForward && (
        <div className="mb-6 rounded-2xl border t-border bg-[var(--bg-surface)] p-4 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold t-text-heading">Carry Forward Leave</h2>
              <p className="text-sm t-text-muted">Enter monthly carry-forward leave through the current month.</p>
            </div>
            <RotateCcw className="hidden t-text-subtle sm:block" size={22} />
          </div>

          <form onSubmit={handleCarryForwardSave} className="grid gap-4 md:grid-cols-5">
            <SelectField label="Employee" value={carryForwardEmployeeId} onChange={(e) => setCarryForwardEmployeeId(e.target.value)} required inputClassName="rounded-xl">
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_id})
                </option>
              ))}
            </SelectField>
            <SelectField label="Month" value={carryForwardMonth} onChange={(e) => setCarryForwardMonth(e.target.value)} required inputClassName="rounded-xl">
              {monthOptions.map((name, index) => (
                <option key={name} value={index + 1}>{name}</option>
              ))}
            </SelectField>
            <InputField type="number" min="2000" max="2100" label="Year" value={carryForwardYear} onChange={(e) => setCarryForwardYear(e.target.value)} required inputClassName="rounded-xl" />
            <InputField type="number" min="0" step="0.5" label="Carry Forward" value={carryForwardValue} onChange={(e) => setCarryForwardValue(e.target.value)} required inputClassName="rounded-xl" />
            <div className="flex items-end">
              <Button type="submit" icon={Save} variant="primary" disabled={savingCarryForward} className="w-full justify-center rounded-xl px-4 py-2.5">
                {savingCarryForward ? 'Saving' : 'Save'}
              </Button>
            </div>
          </form>

          {carryForwardHistory.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="t-thead text-xs uppercase t-text-muted">
                  <tr>
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2">Carry Forward</th>
                    <th className="px-3 py-2">Paid Leave</th>
                    <th className="px-3 py-2">Total Available</th>
                    <th className="px-3 py-2">Used</th>
                    <th className="px-3 py-2">Remaining</th>
                    <th className="px-3 py-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {carryForwardHistory.slice(-6).map((row) => {
                    const date = new Date(`${row.balanceMonth}T00:00:00`);
                    return (
                      <tr key={row.balanceMonth} className="border-t t-divider bg-[var(--bg-input)]">
                        <td className="px-3 py-2 t-text-secondary">{date.toLocaleString(undefined, { month: 'short', year: 'numeric' })}</td>
                        <td className="px-3 py-2 t-text-secondary">{row.carryForwardBalance}</td>
                        <td className="px-3 py-2 t-text-secondary">{row.monthlyLeaveCredit}</td>
                        <td className="px-3 py-2 t-text-secondary">{row.totalAvailableLeave}</td>
                        <td className="px-3 py-2 t-text-secondary">{row.paidLeaveUsed}</td>
                        <td className="px-3 py-2 font-semibold t-text-heading">{row.paidLeaveBalance}</td>
                        <td className="px-3 py-2 t-text-muted">{row.requiresManualCarryForward ? 'Admin pending' : row.source}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <SearchBar className="flex-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by employee name or leave type..." inputClassName="rounded-xl focus:border-red-500/70" />
        <SelectField value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} inputClassName="rounded-xl py-2.5 focus:border-red-500/70">
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </SelectField>
      </div>


      <DataTable
        headers={['Employee', 'Employee ID', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status']}
        actions
        className="rounded-2xl border t-border bg-[var(--bg-surface)] shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md"
        headerCellClassName="t-thead px-4 py-3 text-left text-xs font-semibold uppercase t-text-secondary"
      >
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center t-text-subtle">
                  No leave requests found
                </td>
              </tr>
            ) : (
              paginatedLeaves.map((leave) => (
                <tr key={leave.id} className="border-t t-divider bg-[var(--bg-input)]">
                  <td className="px-4 py-3 text-sm t-text-heading">
                    {leave.employeeName || leave.employee_name || leave.employee?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm t-text-secondary">
                    {leave.employeeCode || leave.employee_code || leave.employee?.employee_id || leave.employee_id || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm t-text-secondary">{leave.leave_type}</td>
                  <td className="px-4 py-3 text-sm t-text-secondary">
                    {leave.start_date ? new Date(leave.start_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm t-text-secondary">
                    {leave.end_date ? new Date(leave.end_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm t-text-secondary">{leave.leaveDays || leave.days || 0}</td>
                  <td className="px-4 py-3 text-sm t-text-secondary">{leave.reason || 'N/A'}</td>
                  <td className="px-4 py-3">{getStatusBadge(leave.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {leave.status === 'Pending' && (canApproveLeave || canRejectLeave) && (
                        <>
                          {canApproveLeave && (
                            <button
                              onClick={() => handleStatusUpdate(leave, 'Approved')}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border t-border bg-[var(--bg-input)] text-emerald-400 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 cursor-pointer"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          {canRejectLeave && (
                            <button
                              onClick={() => handleStatusUpdate(leave, 'Rejected')}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border t-border bg-[var(--bg-input)] text-rose-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 cursor-pointer"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          )}
                        </>
                      )}
                      {canEditLeave(leave) && (
                        <button
                          onClick={() => openEditLeave(leave)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border t-border bg-[var(--bg-input)] text-sky-400 transition hover:border-sky-500/40 hover:bg-sky-500/10 cursor-pointer"
                          title="Edit"
                        >
                          <PencilLine size={18} />
                        </button>
                      )}
                      {canDeleteLeave(leave) && (
                        <button
                          onClick={() => setDeleteLeaveId(leave.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border t-border bg-[var(--bg-input)] text-rose-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
      </DataTable>
      <Pagination
        currentPage={currentPage}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {deleteLeaveId && (
        <DeleteConfirmationModal
          title="Delete Leave"
          message="Are you sure you want to delete this leave? This action cannot be undone."
          onCancel={() => setDeleteLeaveId(null)}
          onConfirm={confirmDeleteLeave}
        />
      )}
    </div>
  );
}