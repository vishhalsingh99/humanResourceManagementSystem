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
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Today's Attendance</h2>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
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
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Today's Attendance</h2>
        <p className="mt-1 text-sm text-slate-600">Check in and out to mark your attendance</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        </div>
      ) : (
        <>
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">Status</p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {hasCheckedOut ? 'Completed' : hasCheckedIn ? 'Present' : 'Not Marked'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">Check In</p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {hasCheckedIn ? formatTime(attendance.check_in) : '--'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">Check Out</p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {hasCheckedOut ? formatTime(attendance.check_out) : '--'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">Working Hours</p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {hasCheckedOut && attendance.totalWorkHours ? attendance.totalWorkHours : '--'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">Method</p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {attendance?.source === 'wifi' ? 'Wi-Fi' : attendance?.source || 'N/A'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">Network</p>
                <div className="mt-2 flex items-center gap-1">
                  {networkStatus?.connected ? (
                    <>
                      <Wifi size={16} className="text-green-600" />
                      <span className="text-sm font-bold text-green-600">Office Network</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={16} className="text-red-600" />
                      <span className="text-sm font-bold text-red-600">Outside</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {status && (
            <div className="mb-4 rounded-lg bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-700">{status}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {!hasCheckedIn && (
              <button
                onClick={handleCheckIn}
                disabled={isChecking || !networkStatus?.connected}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <LogIn size={18} />
                {isChecking ? 'Checking...' : 'Check In'}
              </button>
            )}

            {hasCheckedIn && !hasCheckedOut && (
              <button
                onClick={handleCheckOut}
                disabled={isChecking || !networkStatus?.connected}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <LogOut size={18} />
                {isChecking ? 'Checking...' : 'Check Out'}
              </button>
            )}

            {hasCheckedOut && (
              <div className="flex-1 rounded-lg bg-green-50 py-3 text-center">
                <p className="text-sm font-semibold text-green-700">✓ Attendance Completed</p>
              </div>
            )}
          </div>

          {!networkStatus?.connected && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-700">
                <span className="font-semibold">⚠ Outside Office Network:</span> You are currently outside the office network. Attendance can only be marked from the approved office IP addresses.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
