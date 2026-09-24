import { useEffect, useMemo, useState } from 'react';
import {
  Banknote, CalendarDays, CalendarOff, CheckCircle2, Clock3, Download, FileText, Gauge, PieChart, RotateCcw,
  RefreshCw, ShieldCheck, TrendingUp, Users, WalletCards,
} from 'lucide-react';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';
import SelectField from '../../components/common/SelectField';
import { useApp } from '../../context/AppContext';
import {
  downloadPayslip, generateMonthlyPayroll, getEmployeeSalaryDashboard, getMonthlySalaryReport, getMySalaryDashboard,
} from '../../api/salaryDashboardApi';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/table/Pagination';


const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const formatCurrency = (value) =>
  `Rs ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const statTone = {
  present: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  absent: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  half: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
  late: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  overtime: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
  deduction: 'border-red-500/20 bg-red-500/10 text-red-300',
  bonus: 'border-teal-500/20 bg-teal-500/10 text-teal-300',
  leaveBalance: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
  salary: 'border-red-500/25 bg-red-500/10 text-red-300',
};

function StatCard({ icon: Icon, label, value, helper, tone }) {
  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-semibold uppercase text-neutral-400">{label}</p>
          <p className="m-0 mt-2 text-2xl font-bold text-neutral-50">{value}</p>
          {helper && <p className="m-0 mt-1 text-xs text-neutral-500">{helper}</p>}
        </div>
        <Icon size={22} className="shrink-0" />
      </div>
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const width = max > 0 ? Math.min(100, Math.round((Number(value || 0) / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-neutral-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-800">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function DetailRow({ label, value, currency = false, emphasized = false }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-800 py-2 last:border-b-0">
      <span className={emphasized ? 'font-semibold text-neutral-50' : 'text-neutral-400'}>{label}</span>
      <span className={emphasized ? 'font-bold text-neutral-50' : 'font-semibold text-neutral-200'}>
        {currency ? formatCurrency(value) : value ?? 0}
      </span>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <section className="border-b border-neutral-800 pb-4 last:border-b-0 last:pb-0">
      <h4 className="m-0 mb-2 text-sm font-bold uppercase tracking-wide text-red-400">{title}</h4>
      {children}
    </section>
  );
}

function SalaryDetailsModal({ dashboard, month, year, onClose }) {
  if (!dashboard) {
    return (
      <Modal title="Salary Details" onClose={onClose}>
        <p className="m-0 text-sm text-neutral-400">Salary details are not available yet. Refresh the dashboard and try again.</p>
      </Modal>
    );
  }

  const attendance = dashboard.attendance || {};
  const leave = dashboard.leave || {};
  const salary = dashboard.salary || {};
  const payroll = dashboard.payroll || {};
  const totalDeductions = salary.totalDeductions ?? salary.salaryDeductions;
  const totalBonus = salary.totalBonus ?? salary.bonus;

  return (
    <Modal title="Salary Details" onClose={onClose}>
      <div className="mb-5 rounded-xl border border-neutral-800 bg-neutral-950/40 p-3 text-sm">
        <DetailRow label="Employee" value={`${dashboard.employee?.name || '-'} - ${dashboard.employee?.employeeId || dashboard.employee?.id || '-'}`} />
        <DetailRow label="Month" value={dashboard.month || month} />
        <DetailRow label="Year" value={dashboard.year || year} />
      </div>

      <div className="space-y-5 text-sm">
        <DetailSection title="Salary Details">
          <DetailRow label="Monthly Salary" value={salary.monthlySalary} currency />
          <DetailRow label="Daily Salary" value={salary.dailySalary ?? salary.perDaySalary} currency />
          <DetailRow label="Total Days" value={dashboard.period?.daysInMonth ?? 0} />
          <DetailRow label="Eligible Days" value={dashboard.period?.eligibleDays ?? 0} />
          <DetailRow label="Payable Days" value={salary.payableDays} />
        </DetailSection>

        <DetailSection title="Attendance">
          <DetailRow label="Present Days" value={attendance.presentDays} />
          <DetailRow label="Absent Days" value={attendance.absentDays} />
          <DetailRow label="Half Days" value={attendance.halfDays} />
          <DetailRow label="Unpaid Half Days" value={leave.unpaidHalfDays} />
          <DetailRow label="Late Count" value={attendance.lateCount} />
          <DetailRow label="Overtime Hours" value={attendance.overtimeHours} />
        </DetailSection>

        <DetailSection title="Paid Leave Breakdown">
          <DetailRow label="Paid Leave Balance" value={leave.totalAvailableLeave ?? leave.paidLeaveBalance ?? salary.paidLeaveBalance} />
          <DetailRow label="Monthly Paid Leave Credit" value={leave.monthlyLeaveCredit ?? salary.monthlyLeaveCredit} />
          <DetailRow label="Paid Leave Used" value={leave.paidLeaveUsed ?? salary.paidLeaveUsed} />
          <DetailRow label="Approved Leave" value={leave.paidLeaveUsedForApprovedLeave ?? salary.paidLeaveUsedForApprovedLeave} />
          <DetailRow label="Absent Covered By Paid Leave" value={leave.paidLeaveUsedForAbsent ?? salary.paidLeaveUsedForAbsent} />
          <DetailRow label="Half Days Covered By Paid Leave" value={leave.paidLeaveUsedForHalfDays ?? salary.paidLeaveUsedForHalfDays} />
          <DetailRow label="Remaining Paid Leave" value={leave.remainingPaidLeave ?? salary.remainingPaidLeave} />
          <DetailRow label="Unpaid Half Days" value={leave.unpaidHalfDays ?? salary.unpaidHalfDays} />
          <DetailRow label="Unpaid Leave" value={leave.unpaidLeaveDays ?? salary.unpaidLeaveDays} />
          <DetailRow label="Unpaid Absent" value={leave.unpaidAbsentDays} />
        </DetailSection>

        <DetailSection title="Deductions">
          <DetailRow label="Absent Deduction" value={salary.absentDeduction} currency />
          <DetailRow label="Unpaid Leave Deduction" value={salary.leaveDeduction} currency />
          <DetailRow label="Half Day Deduction" value={salary.halfDayDeduction} currency />
          <DetailRow label="Late Deduction" value={salary.lateDeduction} currency />
          <DetailRow label="Other Deductions" value={salary.otherDeductions} currency />
          <DetailRow label="Total Deductions" value={totalDeductions} currency emphasized />
        </DetailSection>

        <DetailSection title="Bonus">
          <DetailRow label="Overtime Bonus" value={salary.overtimeBonus ?? salary.bonus} currency />
          <DetailRow label="Other Bonus" value={salary.otherBonus} currency />
        </DetailSection>

        <DetailSection title="Final Salary">
          <DetailRow label="Monthly Salary" value={salary.monthlySalary} currency />
          <DetailRow label="Total Deductions" value={totalDeductions} currency />
          <DetailRow label="Total Bonus" value={totalBonus} currency />
          <DetailRow label="Final Salary" value={salary.finalEstimatedSalary ?? salary.netSalary} currency emphasized />
        </DetailSection>

        <DetailSection title="Payroll Status">
          <DetailRow label="Status" value={dashboard.payrollStatus || 'Not Generated'} />
          <DetailRow label="Generated At" value={payroll.created_at || '-'} />
          <DetailRow label="Updated At" value={payroll.updated_at || '-'} />
        </DetailSection>
      </div>
    </Modal>
  );
}

export default function SalaryDashboard() {
  const { employees, loadEmployees, user, showToast, hasPermission, hasAnyPermission } = useApp();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [dashboard, setDashboard] = useState(null);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payrollSaving, setPayrollSaving] = useState(false);
  const [showSalaryDetails, setShowSalaryDetails] = useState(false);

  const isEmployee = user?.role === 'employee';
  const canGeneratePayroll = hasPermission('payroll.generate');
  const canViewSalary = hasAnyPermission(['payroll.view', 'payroll.view_all']);
  const canViewAllPayroll = hasPermission('payroll.view_all');
  const canViewReports = hasPermission('reports.view');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  useEffect(() => {
    if (canViewAllPayroll) {
      loadEmployees();
    }
  }, [canViewAllPayroll, loadEmployees]);

  const activeEmployeeId = selectedEmployeeId || (canViewAllPayroll ? String(employees[0]?.id || '') : '');
  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee.id) === String(activeEmployeeId)),
    [activeEmployeeId, employees]
  );

  async function loadDashboard() {
    const params = { month, year };
    setLoading(true);

    try {
      const dashboardRequest = !canViewAllPayroll
        ? getMySalaryDashboard(params)
        : getEmployeeSalaryDashboard(activeEmployeeId, params);

      const reportRequest = canViewReports && canViewAllPayroll
        ? getMonthlySalaryReport(params)
        : Promise.resolve({ data: { reports: [] } });

      const [dashboardResponse, reportResponse] = await Promise.all([dashboardRequest, reportRequest]);
      setDashboard(dashboardResponse.data);
      setReport(reportResponse.data.reports || []);
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to load salary dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canViewAllPayroll || activeEmployeeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAllPayroll, activeEmployeeId, month, year]);

  async function handleGeneratePayroll() {
    if (!canGeneratePayroll) return;
    if (!dashboard?.employee?.id) return;
    setPayrollSaving(true);

    try {
      const response = await generateMonthlyPayroll({
        employeeId: dashboard.employee.id,
        month,
        year,
        status: 'PAID',
      });
      setDashboard(response.data);
      showToast('Monthly payroll generated');
      if (canViewReports && canViewAllPayroll) {
        const reportResponse = await getMonthlySalaryReport({ month, year });
        setReport(reportResponse.data.reports || []);
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to generate payroll', 'error');
    } finally {
      setPayrollSaving(false);
    }
  }

  async function handleDownloadPayslip() {
    if (!dashboard?.employee?.id) return;

    try {
      const response = await downloadPayslip(dashboard.employee.id, { month, year });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
      window.open(url, '_blank');
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to open payslip print page', 'error');
    }
  }

  const attendance = dashboard?.attendance || {};
  const leave = dashboard?.leave || {};
  const salary = dashboard?.salary || {};
  const period = dashboard?.period || {};
  const maxAttendance = Math.max(period.totalDays || period.daysInMonth || 0, attendance.presentDays || 0, 1);
  const sortedReportRows = [...report].sort(
    (a, b) =>
      Number(b.salary?.finalEstimatedSalary || 0) -
      Number(a.salary?.finalEstimatedSalary || 0)
  );

  const paginatedReportRows = sortedReportRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="mt-18 p-4 sm:p-6 lg:p-10">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="m-0 text-sm font-semibold uppercase text-red-400">Employee Salary Dashboard</p>
          <h1 className="m-0 mt-1 text-3xl font-bold text-neutral-50">Live Salary Calculation</h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-400">
            Attendance, deductions, bonus, payroll status, and payslip download for the selected month.
          </p>
        </div>

        <div className="grid gap-3 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4">
          {canViewAllPayroll && (
            <SelectField label="Employee" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} inputClassName="rounded-lg">
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.employeeId || employee.employee_id || employee.id}
                </option>
              ))}
            </SelectField>
          )}
          <SelectField label="Month" value={month} onChange={(e) => setMonth(e.target.value)} options={months} inputClassName="rounded-lg" />
          <InputField label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} inputClassName="rounded-lg" />
          <div className="flex items-end gap-2">
            <Button type="button" icon={RefreshCw} onClick={loadDashboard} disabled={loading} className="h-10 rounded-xl px-3">
              {loading ? 'Loading' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="m-0 text-xl font-bold text-neutral-50">{dashboard?.employee?.name || selectedEmployee?.name || 'Salary Overview'}</h2>
              <p className="m-0 mt-1 text-sm text-neutral-400">
                {dashboard?.employee?.department || selectedEmployee?.department || '-'} - {dashboard?.employee?.designation || selectedEmployee?.designation || '-'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canGeneratePayroll && (
                <Button type="button" icon={ShieldCheck} onClick={handleGeneratePayroll} disabled={payrollSaving || !dashboard} className="rounded-xl">
                  {payrollSaving ? 'Generating' : 'Generate Payroll'}
                </Button>
              )}
              {canViewSalary && (
                <Button type="button" icon={FileText} variant="secondary" onClick={() => setShowSalaryDetails(true)} disabled={loading || !dashboard} className="rounded-xl">
                  View Salary Details
                </Button>
              )}
              <Button type="button" icon={Download} variant="secondary" onClick={handleDownloadPayslip} disabled={!dashboard} className="rounded-xl">
                Print Payslip
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StatCard icon={Banknote} label="Monthly Salary" value={formatCurrency(salary.monthlySalary)} tone={statTone.salary} />
            <StatCard icon={Banknote} label="Payable Salary" value={formatCurrency(salary.payableSalary)} helper={`${period.eligibleDays || 0} eligible days, ${salary.payableDays || 0} payable days`} tone={statTone.salary} />
            <StatCard icon={WalletCards} label="Net Salary" value={formatCurrency(salary.netSalary ?? dashboard?.netSalary ?? salary.finalEstimatedSalary)} helper={`Payroll: ${dashboard?.payrollStatus || '-'}`} tone={statTone.bonus} />
            <StatCard icon={Gauge} label="Salary Progress" value={`${salary.salaryProgress || 0}%`} helper={`${salary.payableDays || 0} payable days`} tone={statTone.overtime} />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm font-semibold text-neutral-300">
              <span>Salary progress</span>
              <span>{salary.salaryProgress || 0}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-neutral-800">
              <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${salary.salaryProgress || 0}%` }} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-lg font-bold text-neutral-50">Payroll Status</h2>
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">
              {dashboard?.payrollStatus || 'Not Generated'}
            </span>
          </div>
          <div className="mt-5 grid gap-4">
            <MiniBar label="Present" value={attendance.presentDays || 0} max={maxAttendance} color="bg-emerald-500" />
            <MiniBar label="Absent" value={attendance.absentDays || 0} max={maxAttendance} color="bg-rose-500" />
            <MiniBar label="Half Day" value={attendance.halfDays || 0} max={maxAttendance} color="bg-sky-500" />
            <MiniBar label="Late Count" value={attendance.lateCount || 0} max={maxAttendance} color="bg-amber-500" />
          </div>
        </section>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={CheckCircle2} label="Present Days" value={attendance.presentDays || 0} tone={statTone.present} />
        <StatCard icon={CalendarDays} label="Absent Days" value={attendance.absentDays || 0} tone={statTone.absent} />
        <StatCard icon={PieChart} label="Half Days" value={attendance.halfDays || 0} tone={statTone.half} />
        <StatCard icon={Clock3} label="Late Count" value={attendance.lateCount || 0} tone={statTone.late} />
        <StatCard icon={TrendingUp} label="Overtime Hours" value={attendance.overtimeHours || 0} tone={statTone.overtime} />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={WalletCards} label="Paid Leave Balance" value={leave.paidLeaveBalance ?? salary.paidLeaveBalance ?? 0} helper={`Monthly credit: ${leave.monthlyLeaveCredit ?? salary.monthlyLeaveCredit ?? 0}`} tone={statTone.leaveBalance} />
        <StatCard icon={CheckCircle2} label="Paid Leave Used" value={leave.paidLeaveUsed ?? salary.paidLeaveUsed ?? 0} helper="Applied from accumulated balance" tone={statTone.present} />
        <StatCard icon={CalendarDays} label="Paid Leave Used For Absent" value={leave.paidLeaveUsedForAbsent ?? salary.paidLeaveUsedForAbsent ?? 0} tone={statTone.present} />
        <StatCard icon={PieChart} label="Paid Leave Used For Half Days" value={leave.paidLeaveUsedForHalfDays ?? salary.paidLeaveUsedForHalfDays ?? 0} tone={statTone.present} />
        <StatCard icon={CalendarOff} label="Unpaid Leave" value={leave.unpaidLeaveDays ?? salary.unpaidLeaveDays ?? 0} helper="Salary deduction applies" tone={statTone.absent} />
        <StatCard icon={PieChart} label="Unpaid Half Days" value={leave.unpaidHalfDays ?? salary.unpaidHalfDays ?? 0} tone={statTone.absent} />
        <StatCard icon={RotateCcw} label="Carry Forward Leave" value={leave.carryForwardBalance ?? salary.carryForwardBalance ?? 0} helper="Current month opening" tone={statTone.leaveBalance} />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarOff} label="Leave Days" value={leave.totalLeaveDays ?? dashboard?.leaveDays ?? 0} helper={`${leave.leaveDays || 0} approved, ${leave.sandwichLeaveDays || 0} sandwich`} tone={statTone.absent} />
        <StatCard icon={CalendarDays} label="Sandwich Leave" value={leave.sandwichLeaveDays ?? dashboard?.sandwichLeaveDays ?? 0} helper={leave.sandwichLeaveEnabled ? 'Policy enabled' : 'Policy disabled'} tone={statTone.late} />
        <StatCard icon={FileText} label="Salary Deductions" value={formatCurrency(salary.salaryDeductions)} helper="Late penalties only; leave days are shown separately" tone={statTone.deduction} />
        <StatCard icon={FileText} label="Half Day Deduction" value={formatCurrency(salary.halfDayDeduction)} tone={statTone.deduction} />
        <StatCard icon={FileText} label="Absent Deduction" value={formatCurrency(salary.absentDeduction)} tone={statTone.deduction} />
        <StatCard icon={FileText} label="Leave Deduction" value={formatCurrency(salary.leaveDeduction)} tone={statTone.deduction} />
        <StatCard icon={Clock3} label="Late Deduction" value={formatCurrency(salary.lateDeduction)} tone={statTone.deduction} />
        <StatCard icon={Banknote} label="Bonus" value={formatCurrency(salary.bonus)} helper="Overtime-based earning" tone={statTone.bonus} />
        <StatCard icon={Banknote} label="Final Salary" value={formatCurrency(salary.finalEstimatedSalary)} tone={statTone.salary} />
      </div>

      {canViewReports && canViewAllPayroll && (
        <section className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
            <div>
              <h2 className="m-0 text-lg font-bold text-neutral-50">
                Monthly Salary Report
              </h2>
              <p className="m-0 mt-1 text-sm text-neutral-400">
                {month} {year}
              </p>
            </div>
            <Users size={22} className="text-neutral-500" />
          </div>

          {/* Table Wrapper */}
          <div className="overflow-x-auto">
            <table className="min-w-450 w-full border-collapse">
              <thead className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-900/95">
                <tr className="bg-neutral-950/60 text-left text-xs font-semibold uppercase text-neutral-400">
                  <th className="px-4 py-3 whitespace-nowrap min-w-45">Employee</th>
                  <th className="px-4 py-3 whitespace-nowrap min-w-30">Eligible Days</th>
                  <th className="px-4 py-3 whitespace-nowrap min-w-30">Payable Days</th>
                  <th className="px-4 py-3 whitespace-nowrap min-w-22.5">Present</th>
                  <th className="px-4 py-3 whitespace-nowrap min-w-22.5">Absent</th>
                  <th className="px-4 py-3 whitespace-nowrap min-w-22.5">Leave</th>
                  <th className="px-4 py-3 whitespace-nowrap min-w-25">Sandwich</th>
                  <th className="px-4 py-3 whitespace-nowrap min-w-20">Half</th>
                  <th className="px-4 py-3 whitespace-nowrap min-w-20">Late</th>
                  <th className="px-4 py-3 whitespace-nowrap min-w-30">Deductions</th>
                  <th className="px-4 py-3 whitespace-nowrap min-w-25">Bonus</th>
                  <th className="px-4 py-3 whitespace-nowrap min-w-35">Final Salary</th>
                  <th className="px-4 py-3 whitespace-nowrap min-w-25">Status</th>
                </tr>
              </thead>

              <tbody>
                {paginatedReportRows.map((row) => (
                  <tr key={row.employee.id} className="border-t border-neutral-800 bg-neutral-950/65">
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-50">
                      {row.employee.name}
                      <span className="block text-xs font-normal text-neutral-500">
                        {row.employee.employeeId || row.employee.id}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-neutral-300">{row.period.eligibleDays || 0}</td>
                    <td className="px-4 py-3 text-neutral-300">{row.salary.payableDays || 0}</td>
                    <td className="px-4 py-3 text-neutral-300">{row.attendance.presentDays}</td>
                    <td className="px-4 py-3 text-neutral-300">{row.attendance.absentDays}</td>
                    <td className="px-4 py-3 text-neutral-300">
                      {row.leave?.totalLeaveDays ?? row.leaveDays ?? 0}
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      {row.leave?.sandwichLeaveDays ?? row.sandwichLeaveDays ?? 0}
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{row.attendance.halfDays}</td>
                    <td className="px-4 py-3 text-neutral-300">{row.attendance.lateCount}</td>
                    <td className="px-4 py-3 text-rose-300">
                      {formatCurrency(row.salary.salaryDeductions)}
                    </td>
                    <td className="px-4 py-3 text-teal-300">
                      {formatCurrency(row.salary.bonus)}
                    </td>
                    <td className="px-4 py-3 font-bold text-neutral-50">
                      {formatCurrency(row.salary.finalEstimatedSalary)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-neutral-800 px-2 py-1 text-xs font-bold text-neutral-200">
                        {row.payrollStatus}
                      </span>
                    </td>
                  </tr>
                ))}

                {paginatedReportRows.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-sm text-neutral-500">
                      No report data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-800 px-4 py-3">
            <Pagination
              currentPage={currentPage}
              totalItems={sortedReportRows.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </section>
      )
      }
      {showSalaryDetails && (
        <SalaryDetailsModal
          dashboard={dashboard}
          month={month}
          year={year}
          onClose={() => setShowSalaryDetails(false)}
        />
      )}
    </div >
  );
}