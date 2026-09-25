import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import axios from 'axios';
import Button from '../../components/common/Button';
import { useApp } from '../../context/AppContext';

const monthOptions = () => {
  const now = new Date();
  const options = [];
  for (let i = 0; i < 24; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
    options.push({ value, label });
  }
  return options;
};

const isValidEmployeeId = (value) => {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0;
};

const formatHours = (value) => {
  const totalMinutes = Number(value) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (!hours && !minutes) return '0h 0m';
  return `${hours}h ${minutes}m`;
};

export default function EmployeeSummaryPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const inFlightRequestKeyRef = useRef('');

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const formatSummaryHours = (value) => {
    const totalHours = Number(value) || 0;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    if (!hours && !minutes) return '0h 0m';
    return `${hours}h ${minutes}m`;
  };

  const querySummary = async (month = selectedMonth, options = {}) => {
    const { forceRefresh = false } = options;
    const activeMonth = month || selectedMonth || new Date().toISOString().slice(0, 7);

    if (!isValidEmployeeId(employeeId)) {
      showToast('Invalid employee ID.', 'error');
      setSummary(null);
      return null;
    }

    const requestKey = `${employeeId}-${activeMonth}`;
    if (!forceRefresh && inFlightRequestKeyRef.current === requestKey) {
      return null;
    }

    inFlightRequestKeyRef.current = requestKey;
    setLoading(true);

    try {
      const token = localStorage.getItem('hrmsToken');
      const { data } = await axios.get(`/api/attendance/employee/${employeeId}/summary`, {
        params: { month: activeMonth },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSummary(data);
      return data;
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to load summary', 'error');
      setSummary(null);
      return null;
    } finally {
      setLoading(false);
      if (inFlightRequestKeyRef.current === requestKey) {
        inFlightRequestKeyRef.current = '';
      }
    }
  };

  const handleRefreshSummary = async () => {
    const activeMonth = selectedMonth || new Date().toISOString().slice(0, 7);
    await querySummary(activeMonth, { forceRefresh: true });
  };

  const triggerDownload = async (route, filename, type = 'application/pdf') => {
    if (!employeeId) return;

    try {
      const token = localStorage.getItem('hrmsToken');
      const response = await axios.get(`/api/attendance/employee/${employeeId}${route}`, {
        params: { month: selectedMonth },
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error('Failed to generate export');
      }

      const blob = new Blob([response.data], { type });
      downloadBlob(blob, filename);
      return true;
    } catch (error) {
      showToast(error.response?.data?.error || error.message || 'Export failed', 'error');
      return false;
    }
  };

  const exportPdf = async () => {
    if (!employeeId) return;
    setExporting(true);
    try {
      const fileName = `attendance-summary-${summary?.employee?.employeeCode || employeeId}-${selectedMonth}.pdf`;
      await triggerDownload('/summary/pdf', fileName, 'application/pdf');
    } finally {
      setExporting(false);
    }
  };

  const exportExcel = async () => {
    if (!employeeId) return;
    setExporting(true);
    try {
      const fileName = `attendance-summary-${summary?.employee?.employeeCode || employeeId}-${selectedMonth}.csv`;
      await triggerDownload('/summary/export-excel', fileName, 'text/csv;charset=utf-8');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!isValidEmployeeId(employeeId)) {
      showToast('Invalid employee ID.', 'error');
      setSummary(null);
      return;
    }

    querySummary(selectedMonth);
  }, [employeeId, selectedMonth]);

  const cards = useMemo(() => [
    { label: 'Total Calendar Days', value: summary?.summary?.calendarDays ?? 0 },
    { label: 'Working Days', value: summary?.summary?.workingDays ?? 0 },
    { label: 'Present Days', value: summary?.summary?.presentDays ?? 0 },
    { label: 'Half Days', value: summary?.summary?.halfDays ?? 0 },
    { label: 'Absent Days', value: summary?.summary?.absentDays ?? 0 },
    { label: 'Paid Leave', value: summary?.summary?.paidLeaveDays ?? 0 },
    { label: 'Unpaid Leave', value: summary?.summary?.unpaidLeaveDays ?? 0 },
    { label: 'Holidays', value: summary?.summary?.holidays ?? 0 },
    { label: 'Week Off', value: summary?.summary?.weekOffs ?? 0 },
    { label: 'Late Days', value: summary?.summary?.lateDays ?? 0 },
    { label: 'Short Leave', value: summary?.summary?.shortLeaveDays ?? 0 },
    { label: 'Total Working Hours', value: formatSummaryHours(summary?.summary?.totalWorkingHours ?? 0) },
    { label: 'Overtime Hours', value: formatSummaryHours(summary?.summary?.overtimeHours ?? 0) },
  ], [summary]);

  if (!summary && !loading) {
    return <div className="mt-20 p-6 text-neutral-400">No attendance summary available.</div>;
  }

  return (
    <div className="mt-4 p-4 sm:p-6 lg:p-10">
      {/* Header card */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-red-400">Employee Attendance Summary</p>
            <h1 className="mt-1 text-2xl font-bold text-neutral-50">{summary?.employee?.name || 'Loading...'}</h1>
          </div>
          <Button variant="secondary" onClick={() => navigate('/attendance')}>Back</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Employee</p>
            <p className="mt-1 text-base font-semibold text-neutral-100">{summary?.employee?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Employee Code</p>
            <p className="mt-1 text-base font-semibold text-neutral-100">{summary?.employee?.employeeCode || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Date of Joining</p>
            <p className="mt-1 text-base font-semibold text-neutral-100">{summary?.employee?.dateOfJoining || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Month</p>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-700 bg-neutral-950/65 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-red-500/70"
            >
              {monthOptions().map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleRefreshSummary} disabled={loading} title="Refresh Summary" aria-label="Refresh Summary">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button variant="secondary" onClick={exportPdf} disabled={exporting || loading}>{exporting ? 'Preparing...' : 'Export PDF'}</Button>
          <Button variant="secondary" onClick={exportExcel} disabled={exporting || loading}>{exporting ? 'Preparing...' : 'Export Excel'}</Button>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-neutral-100">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Daily attendance table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-neutral-950/80">
                {['Date', 'Day', 'Check In', 'Check Out', 'Working Hours', 'Late By', 'Status', 'Remarks'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(summary?.dailyAttendance || []).map((day) => (
                <tr key={day.date} className="border-t border-neutral-800 transition-colors hover:bg-neutral-800/30">
                  <td className="px-4 py-3 text-sm text-neutral-200">{day.date}</td>
                  <td className="px-4 py-3 text-sm text-neutral-300">{day.day}</td>
                  <td className="px-4 py-3 text-sm text-neutral-300">{day.checkIn === '--' ? '--' : day.checkIn}</td>
                  <td className="px-4 py-3 text-sm text-neutral-300">{day.checkOut === '--' ? '--' : day.checkOut}</td>
                  <td className="px-4 py-3 text-sm text-neutral-300">{day.workingHours}</td>
                  <td className="px-4 py-3 text-sm text-neutral-300">{day.lateBy}</td>
                  <td className="px-4 py-3 text-sm text-neutral-300">{day.status}</td>
                  <td className="px-4 py-3 text-sm text-neutral-300">{day.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
