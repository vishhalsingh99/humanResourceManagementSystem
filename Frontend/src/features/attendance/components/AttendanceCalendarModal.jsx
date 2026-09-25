import { memo } from 'react';
import { CalendarDays, X } from 'lucide-react';
import AttendanceCalendar from '../../../components/table/AttendanceCalendar';
import { CALENDAR_STATUS_COLORS } from '../utils/constants';

function AttendanceCalendarModal({ employee, events, onClose }) {
  const employeeName = employee?.employeeName || employee?.employee_name || 'Employee';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl mt-22 flex-col overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-900 shadow-[0_0_40px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <CalendarDays size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-neutral-50">{employeeName}</h2>
              <p className="text-sm text-neutral-400">Monthly Attendance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5">
          <AttendanceCalendar events={events} />

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-neutral-800 pt-4">
            {Object.entries(CALENDAR_STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2 text-sm text-neutral-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                {status}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default memo(AttendanceCalendarModal);
