import { useMemo, useState } from 'react';
import { ITEMS_PER_PAGE } from '../utils/constants';
import { getRecordEmployee, normalizeText } from '../utils/attendanceHelpers';

export default function useAttendanceFilters(attendance, employees, currentEmployeeId = '') {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [date, setDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const employeeById = useMemo(() => new Map(employees.map((employee) => [Number(employee.id), employee])), [employees]);
  const filteredRecords = useMemo(() => {
    const query = normalizeText(search);
    return attendance.filter((record) => {
      const normalizedEmployeeId = String(record.employee_id ?? record.employeeId ?? '').trim();
      const isOwnRecord = !currentEmployeeId || normalizedEmployeeId === String(currentEmployeeId);
      const employee = getRecordEmployee(record, employeeById);
      const name = record.employeeName || record.employee_name || employee?.name || '';
      const code = record.employeeCode || record.employee_code || employee?.employee_id || '';
      return isOwnRecord
        && (!query || normalizeText(name).includes(query) || normalizeText(code).includes(query) || normalizeText(normalizedEmployeeId).includes(query))
        && (status === 'All' || record.status === status)
        && (!date || String(record.date || '').slice(0, 10) === date);
    });
  }, [attendance, currentEmployeeId, date, employeeById, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => filteredRecords.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE), [filteredRecords, safeCurrentPage]);
  const resetPage = (setter) => (value) => { setter(value); setCurrentPage(1); };

  return { search, setSearch: resetPage(setSearch), status, setStatus: resetPage(setStatus), date, setDate: resetPage(setDate), currentPage: safeCurrentPage, setCurrentPage, filteredRecords, paginatedRecords, employeeById };
}
