import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Plus, PencilLine, Trash2, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../../components/common/Button';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

const emptyForm = {
  employee: '',
  organizer: '',
  date: '',
  time: '',
  status: 'Scheduled',
  notes: '',
};

const inputClassName = 'w-full rounded-xl border t-border-in bg-[var(--bg-input)] px-4 py-3 text-sm t-text-primary outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]';
const labelClassName = 'mb-2 block text-sm font-semibold t-text-secondary';

function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const toState = (currentValue) => {
    if (!currentValue) return { hour: '09', minute: '00', ampm: 'AM' };
    const [hh, mm] = currentValue.split(':');
    let hour = parseInt(hh, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return { hour: String(hour).padStart(2, '0'), minute: mm, ampm };
  };

  const [pick, setPick] = useState(() => toState(value));

  useEffect(() => {
    setPick(toState(value));
  }, [value]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function confirmTime() {
    let hour = parseInt(pick.hour, 10);
    if (pick.ampm === 'AM' && hour === 12) hour = 0;
    else if (pick.ampm === 'PM' && hour !== 12) hour += 12;
    onChange(`${String(hour).padStart(2, '0')}:${pick.minute}`);
    setOpen(false);
  }

  const hours = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
  const display = value
    ? (() => {
        const state = toState(value);
        return `${state.hour}:${state.minute} ${state.ampm}`;
      })()
    : 'Select time';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border t-border bg-[var(--bg-input)] px-4 py-3 text-sm t-text-heading cursor-pointer"
      >
        <span>{display}</span>
        <span className="text-xs text-slate-400">▼</span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-60 border t-divider bg-[var(--bg-input)] p-3 shadow-[0_12px_22px_rgba(15,23,42,0.18)]">
          <div className="flex gap-2">
            {[{ label: 'Hour', items: hours, key: 'hour' }, { label: 'Min', items: minutes, key: 'minute' }].map(({ label, items, key }) => (
              <div key={key} className="flex-1">
                <div className="mb-1 text-center text-xs font-medium uppercase text-slate-400">{label}</div>
                <div className="flex max-h-36 flex-col gap-0.5 overflow-y-auto">
                  {items.map((item) => (
                    <button 
                      key={item}
                      type="button"
                      onClick={() => setPick((current) => ({ ...current, [key]: item }))}
                      className={`px-2 py-1.5 text-center text-sm cursor-pointer ${
                        pick[key] === item ? 'bg-red-500/20 font-semibold text-red-300' : 't-text-secondary hover:bg-neutral-800'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex-1">
              <div className="mb-1 text-center text-xs font-medium uppercase text-slate-400">AM/PM</div>
              <div className="flex flex-col gap-1.5 pt-1">
                {['AM', 'PM'].map((ampm) => (
                  <button
                    key={ampm}
                    type="button"
                    onClick={() => setPick((current) => ({ ...current, ampm }))}
                    className={`px-2 py-1.5 text-center text-sm cursor-pointer ${
                      pick.ampm === ampm ? 'bg-red-500/20 font-semibold text-red-300' : 't-text-secondary hover:bg-neutral-800'
                    }`}
                  >
                    {ampm}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={confirmTime}
            className="mt-3 w-full rounded-xl bg-red-500 py-2 text-sm font-semibold text-white transition hover:bg-red-400 cursor-pointer"
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
}

const statusClassNames = {
  Scheduled: 'bg-red-500/15 text-red-300',
  Completed: 'bg-emerald-500/15 text-emerald-300',
  Cancelled: 'bg-rose-500/15 text-rose-300',
};

export default function Meetings() {
  const { meetings, loadMeetings, employees, loadEmployees, showToast, hasPermission } = useApp();
  const canCreateMeeting = hasPermission('meeting.create');
  const canEditMeeting = hasPermission('meeting.edit');
  const canDeleteMeeting = hasPermission('meeting.delete');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteMeetingId, setDeleteMeetingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadMeetings();
    loadEmployees();
  }, [loadMeetings, loadEmployees]);

  function openAddMeeting() {
    if (!canCreateMeeting) return;
    setEditingMeeting(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditMeeting(meeting) {
    if (!canEditMeeting) return;
    setEditingMeeting(meeting);
    setForm({
      employee: meeting.employee?._id || meeting.employee || '',
      organizer: meeting.organizer?._id || meeting.organizer || '',
      date: meeting.date || '',
      time: meeting.time || '',
      status: meeting.status || 'Scheduled',
      notes: meeting.notes || '',
    });
    setShowForm(true);
  }

  function closeForm() {
    if (isSaving) return;
    setShowForm(false);
    setEditingMeeting(null);
    setForm(emptyForm);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      if (editingMeeting?._id) {
        await axios.put(`/api/meetings/${editingMeeting._id}`, form);
        showToast('Meeting updated');
      } else {
        await axios.post('/api/meetings', form);
        showToast('Meeting added');
      }

      await loadMeetings();
      setIsSaving(false);
      setShowForm(false);
      setEditingMeeting(null);
      setForm(emptyForm);
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to save meeting', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`/api/meetings/${id}`);
      showToast('Meeting deleted', 'error');
      loadMeetings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to delete meeting', 'error');
    }
  }

  async function confirmDeleteMeeting() {
    if (!deleteMeetingId) return;

    await handleDelete(deleteMeetingId);
    setDeleteMeetingId(null);
  }

 const filtered = Array.isArray(meetings)
  ? meetings.filter((meeting) => {
      const employeeName =
        meeting.employee?.name?.toLowerCase() || '';

      const organizerName =
        meeting.organizer?.name?.toLowerCase() || '';

      const department =
        meeting.organizer?.department?.toLowerCase() || '';

      const query = search.toLowerCase();

      return (
        employeeName.includes(query) ||
        organizerName.includes(query) ||
        department.includes(query) ||
        (meeting.date || '').includes(search) ||
        (meeting.time || '').toLowerCase().includes(query)
      );
    })
  : [];

  if (showForm) {
    return (
      <div className="p-4 sm:p-6 mt-18 lg:p-10">
        <form onSubmit={handleSubmit} className="rounded-2xl border t-border bg-[var(--bg-surface)] p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md sm:p-7">
          <div className="flex flex-col gap-4 border-b t-divider pb-6 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={closeForm}
              className="flex items-center gap-2 self-start rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400 cursor-pointer disabled:opacity-60"
              disabled={isSaving}
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>

            <div className="text-left lg:text-right">
              <h2 className="m-0 text-3xl font-semibold t-text-heading">
                {editingMeeting ? 'Update Meeting' : 'Add New Meeting'}
              </h2>
              <p className="mt-2 text-sm t-text-muted">Use the form below to save meeting details in the HRMS system.</p>
            </div>
          </div>

          <div className="pt-8">
            <h3 className="m-0 text-2xl font-semibold t-text-heading">Meeting Details</h3>
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className={labelClassName}>Employee</label>
                <select value={form.employee} onChange={(e) => updateField('employee', e.target.value)} className={inputClassName} required>
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
  <label className={labelClassName}>
    Organizer
  </label>

  <select
    value={form.organizer}
    onChange={(e) =>
      updateField('organizer', e.target.value)
    }
    className={inputClassName}
    required
  >
    <option value="">Select organizer</option>

    {Array.isArray(employees) &&
      employees.map((employee) => (
        <option
          key={employee._id || employee.id}
          value={employee._id || employee.id}
        >
          {employee.name} - {employee.department || '-'}
        </option>
      ))}
  </select>
</div>

              <div>
                <label className={labelClassName}>Date</label>
                <input type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} className={inputClassName} required />
              </div>

              <div>
                <label className={labelClassName}>Time</label>
                <TimePicker value={form.time} onChange={(time) => updateField('time', time)} />
              </div>

              <div>
                <label className={labelClassName}>Status</label>
                <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className={inputClassName}>
                  {['Scheduled', 'Completed', 'Cancelled'].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 xl:col-span-3">
                <label className={labelClassName}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={4}
                  placeholder="Enter notes"
                  className={`${inputClassName} resize-none`}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t t-divider pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              disabled={isSaving}
              className="rounded-xl border t-border px-5 py-3 text-sm font-semibold t-text-secondary transition hover:bg-neutral-800 cursor-pointer disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:bg-red-400 cursor-pointer disabled:opacity-70"
            >
              {isSaving ? (editingMeeting ? 'Updating...' : 'Saving...') : (editingMeeting ? 'Update Meeting' : 'Save Meeting')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 mt-18 lg:p-10">
      <section className="rounded-2xl border t-border bg-[var(--bg-surface)] p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="m-0 text-3xl font-semibold t-text-heading">Meeting Master</h2>
            <p className="mt-2 text-sm t-text-muted">
              {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} available in the HRMS system
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search meeting"
                className="w-full rounded-xl border t-border bg-[var(--bg-input)] py-3 pl-11 pr-4 text-sm t-text-heading outline-none transition focus:border-blue-500 sm:w-96"
              />
            </div>
            {canCreateMeeting && (
              <button
                onClick={openAddMeeting}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition  cursor-pointer"
              >
                <Plus size={18} />
                <span>Add Meeting</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border t-divider">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="t-thead text-left">
                  {['S.No.', 'Employee', 'Organizer', 'Department', 'Date', 'Time', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="px-5 py-4 text-xs font-semibold uppercase tracking-wide t-text-muted">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((meeting, index) => (
                  <tr key={meeting._id} className="border-t t-divider bg-[var(--bg-input)]">
                    <td className="px-5 py-4 text-sm t-text-subtle">{index + 1}</td>
                    <td className="px-5 py-4 text-sm font-semibold t-text-heading">{meeting.employee?.name}</td>
                    <td className="px-5 py-4 text-sm t-text-secondary">{meeting.organizer?.name}</td>
                    <td className="px-5 py-4 text-sm t-text-secondary">{meeting.organizer?.department || '-'}</td>
                    <td className="px-5 py-4 text-sm t-text-secondary">{meeting.date}</td>
                    <td className="px-5 py-4 text-sm t-text-secondary">{meeting.time}</td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold ${statusClassNames[meeting.status] || ''}`}>
                        {meeting.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {canEditMeeting && (
                          <button
                            onClick={() => openEditMeeting(meeting)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border t-border bg-[var(--bg-input)] text-emerald-400 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 cursor-pointer"
                            title="Edit meeting"
                          >
                            <PencilLine size={16} />
                          </button>
                        )}
                        {canDeleteMeeting && (
                          <button
                            onClick={() => setDeleteMeetingId(meeting._id)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border t-border bg-[var(--bg-input)] text-rose-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete meeting"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-slate-400">
                      No meetings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {deleteMeetingId && (
        <DeleteConfirmationModal
          title="Delete Meeting"
          message="Are you sure you want to delete this meeting? This action cannot be undone."
          onCancel={() => setDeleteMeetingId(null)}
          onConfirm={confirmDeleteMeeting}
        />
      )}
    </div>
  );
}
