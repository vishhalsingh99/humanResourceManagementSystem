import { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { getNetworkInfo, getTodayAttendance, employeeCheckIn, employeeCheckOut } from '../../../api/attendanceApi';
import { Wifi, WifiOff, LogIn, LogOut } from 'lucide-react';

export default function EmployeeAttendanceCard() {
  const { showToast } = useApp();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState('');

  const loadAttendanceAndNetwork = async () => {
    setLoading(true);

    const [networkResult, attendanceResult] = await Promise.allSettled([
      getNetworkInfo(),
      getTodayAttendance(),
    ]);

    if (networkResult.status === 'fulfilled') {
      setNetworkStatus({
        ip: networkResult.value.data.ip,
        connected: true,
      });
    } else {
      setNetworkStatus({ connected: false });
    }

    if (attendanceResult.status === 'fulfilled') {
      setAttendance(attendanceResult.value.data.attendance || null);
    } else {
      console.error('Today attendance error:', attendanceResult.reason);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAttendanceAndNetwork();
  }, []);

  const handleCheckIn = async () => {
    setIsChecking(true);
    setStatus('Verifying office network...');
    try {
      const response = await employeeCheckIn();
      setAttendance(response.data.attendance);
      setStatus('');
      showToast(response.data.message || 'Checked in successfully', 'success');
    } catch (error) {
      setStatus('');
      // If attendance already exists (e.g. marked in another tab), sync the card
      // instead of leaving it stuck on the stale "Not Marked" state.
      if (error.response?.status === 409 && error.response?.data?.attendance) {
        setAttendance(error.response.data.attendance);
      }
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Unable to check in';
      showToast(errorMsg, 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCheckOut = async () => {
    setIsChecking(true);
    setStatus('Verifying office network...');
    try {
      const response = await employeeCheckOut();
      setAttendance(response.data.attendance);
      setStatus('');
      showToast(response.data.message || 'Checked out successfully', 'success');
    } catch (error) {
      setStatus('');
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Unable to check out';
      showToast(errorMsg, 'error');
    } finally {
      setIsChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="ui-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold t-text-heading">Today's Attendance</h2>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-base)] border-t-red-500" />
        </div>
      </div>
    );
  }

  const hasCheckedIn = attendance?.check_in;
  const hasCheckedOut = attendance?.check_out;

  const formatTime = (timeString) => {
    if (!timeString) return '--';
    const [hours, minutes] = timeString.slice(0, 5).split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="ui-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold t-text-heading">Today's Attendance</h2>
        <p className="mt-1 text-sm t-text-muted">Check in and out to mark your attendance</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-base)] border-t-red-500" />
        </div>
      ) : (
        <>
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-[var(--bg-input)] p-3">
                <p className="text-xs font-medium t-text-muted">Status</p>
                <p className="mt-2 text-sm font-bold t-text-heading">
                  {hasCheckedOut ? 'Completed' : hasCheckedIn ? 'Present' : 'Not Marked'}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--bg-input)] p-3">
                <p className="text-xs font-medium t-text-muted">Check In</p>
                <p className="mt-2 text-sm font-bold t-text-heading">
                  {hasCheckedIn ? formatTime(attendance.check_in) : '--'}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--bg-input)] p-3">
                <p className="text-xs font-medium t-text-muted">Check Out</p>
                <p className="mt-2 text-sm font-bold t-text-heading">
                  {hasCheckedOut ? formatTime(attendance.check_out) : '--'}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--bg-input)] p-3">
                <p className="text-xs font-medium t-text-muted">Working Hours</p>
                <p className="mt-2 text-sm font-bold t-text-heading">
                  {hasCheckedOut && attendance.totalWorkHours ? attendance.totalWorkHours : '--'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-[var(--bg-input)] p-3">
                <p className="text-xs font-medium t-text-muted">Method</p>
                <p className="mt-2 text-sm font-bold t-text-heading">
                  {attendance?.source === 'wifi' ? 'Wi-Fi' : attendance?.source || 'N/A'}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--bg-input)] p-3">
                <p className="text-xs font-medium t-text-muted">Network</p>
                <div className="mt-2 flex items-center gap-1">
                  {networkStatus?.connected ? (
                    <>
                      <Wifi size={16} className="text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-500">Office Network</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={16} className="text-red-400" />
                      <span className="text-sm font-bold text-red-400">Outside</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {status && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-3">
              <p className="text-xs font-medium text-red-400">{status}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {!hasCheckedIn && (
              <button
                onClick={handleCheckIn}
                disabled={isChecking || !networkStatus?.connected}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogIn size={18} />
                {isChecking ? 'Checking...' : 'Check In'}
              </button>
            )}

            {hasCheckedIn && !hasCheckedOut && (
              <button
                onClick={handleCheckOut}
                disabled={isChecking || !networkStatus?.connected}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut size={18} />
                {isChecking ? 'Checking...' : 'Check Out'}
              </button>
            )}

            {hasCheckedOut && (
              <div className="flex-1 rounded-lg bg-emerald-500/10 py-3 text-center">
                <p className="text-sm font-semibold text-emerald-500">✓ Attendance Completed</p>
              </div>
            )}
          </div>

          {!networkStatus?.connected && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-xs text-red-400">
                <span className="font-semibold">⚠ Outside Office Network:</span> You are currently outside the office network. Attendance can only be marked from the approved office IP addresses.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
