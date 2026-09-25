import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Button from '../../components/common/Button';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import Pagination from '../../components/table/Pagination';
import AttendanceCalendarModal from './components/AttendanceCalendarModal';
import AttendanceFilters from './components/AttendanceFilters';
import AttendanceForm from './components/AttendanceForm';
import AttendanceStats from './components/AttendanceStats';
import AttendanceTable from './components/AttendanceTable';
import BulkAttendance from './components/BulkAttendance';
import useAttendanceData from './hooks/useAttendanceData';
import useAttendanceFilters from './hooks/useAttendanceFilters';
import { createCalendarEvents, getAttendanceEmployeeId } from './utils/attendanceHelpers';
import { getWorkingDays } from './services/attendance.service';

export default function Attendance() {
  const navigate = useNavigate();
  const { attendance, loadAttendance, employees, loadEmployees, departments, loadDepartments, designations, loadDesignations, showToast, user, hasPermission } = useApp();
  const currentEmployeeId = user?.employeeId || user?.employee_id || '';
  const canViewAllAttendance = hasPermission('attendance.view_all');
  const canMarkAttendance = hasPermission('attendance.mark');
  const canEditAttendance = hasPermission('attendance.edit');
  const canDeleteAttendance = hasPermission('attendance.delete');
  const [totalWorkingDays, setTotalWorkingDays] = useState(0);
  const data = useAttendanceData({ attendance, employees, departments, designations, loadAttendance, showToast });
  const filters = useAttendanceFilters(attendance, employees, canViewAllAttendance ? '' : currentEmployeeId);

  useEffect(() => {
    let active = true;
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
    getWorkingDays({
      startDate: filters.date || monthStart,
      endDate: filters.date || monthEnd,
      employeeId: currentEmployeeId || undefined,
    }).then(({ data: response }) => {
      if (active) setTotalWorkingDays(Number(response.workingDays) || 0);
    }).catch(() => {
      if (active) setTotalWorkingDays(0);
    });
    return () => { active = false; };
  }, [attendance, currentEmployeeId, filters.date]);

  const handleViewSummary = (record) => {
    const employeeId = getAttendanceEmployeeId(record);
    if (!employeeId) {
      showToast('Employee information is missing for this attendance record.', 'error');
      return;
    }
    navigate(`/attendance/employee/${employeeId}/summary`);
  };

  useEffect(() => {
    loadAttendance();
    if (canMarkAttendance || canEditAttendance || canDeleteAttendance) {
      loadEmployees();
      loadDepartments();
      loadDesignations();
    }
  }, [canMarkAttendance, canEditAttendance, canDeleteAttendance, loadAttendance, loadDepartments, loadDesignations, loadEmployees]);

  if (data.mode === 'bulk') return <BulkAttendance criteria={data.criteria} departmentOptions={data.departmentOptions} designationOptions={data.designationOptions} employees={data.criteriaEmployees} isSaving={data.isSavingBulk} showRows={data.showBulkRows} onCriteriaChange={data.updateCriteria} onSearch={data.handleCriteriaSearch} onClose={data.closeForm} onSave={data.handleBulkSave} onSetAllStatus={data.setAllAttendanceStatus} getRow={data.getBulkRow} onRowChange={data.updateBulkRow} />;
  if (data.mode === 'edit') return <AttendanceForm form={data.form} employees={employees} onChange={data.updateForm} onSubmit={data.handleSubmit} onClose={data.closeForm} isSaving={data.isSaving} />;

  return (
    <div className="p-4 sm:p-6 mt-4 lg:p-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold t-text-heading">Attendance Management</h1>
          <p className="t-text-muted">Track employee attendance records</p>
        </div>
        {canMarkAttendance && <Button onClick={data.openAdd} icon={Plus} variant="primary" className="px-4 py-2">Mark Attendance</Button>}
      </div>
      <AttendanceStats stats={{ ...data.stats, totalWorkingDays }} />
      <AttendanceFilters search={filters.search} status={filters.status} date={filters.date} onSearchChange={filters.setSearch} onStatusChange={filters.setStatus} onDateChange={filters.setDate} />
      <AttendanceTable records={filters.paginatedRecords} employeeById={filters.employeeById} canEdit={canEditAttendance} canDelete={canDeleteAttendance} onEdit={data.openEdit} onDelete={data.setDeleteAttendanceId} onOpenCalendar={data.openCalendar} onViewSummary={handleViewSummary} />
      <Pagination currentPage={filters.currentPage} totalItems={filters.filteredRecords.length} itemsPerPage={10} onPageChange={filters.setCurrentPage} />
      {data.calendar.employee && <AttendanceCalendarModal employee={data.calendar.employee} events={createCalendarEvents(data.calendar.records)} onClose={() => data.setCalendar({ employee: null, records: [] })} />}
      {data.deleteAttendanceId && <DeleteConfirmationModal title="Delete Employee Attendance" message="Are you sure you want to delete this employee attendance? This action cannot be undone." onCancel={() => data.setDeleteAttendanceId(null)} onConfirm={data.confirmDelete} />}

    </div>
  )
}
