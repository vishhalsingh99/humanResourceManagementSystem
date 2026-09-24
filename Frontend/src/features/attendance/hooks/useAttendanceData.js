import { useCallback, useEffect, useMemo, useState } from 'react';
import { createAttendance, getEmployeeAttendance, getEmployeesForAttendanceDate, removeAttendance, updateAttendance } from '../services/attendance.service';
import { createEmptyCriteria, createEmptyForm } from '../utils/constants';
import { getAttendancePayload, normalizeText, toDateInputValue } from '../utils/attendanceHelpers';

export default function useAttendanceData({ attendance, employees, departments, designations, loadAttendance, showToast }) {
    const [mode, setMode] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form, setForm] = useState(createEmptyForm);
    const [criteria, setCriteria] = useState(createEmptyCriteria);
    const [showBulkRows, setShowBulkRows] = useState(false);
    const [bulkRows, setBulkRows] = useState({});
    const [isSavingBulk, setIsSavingBulk] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteAttendanceId, setDeleteAttendanceId] = useState(null);
    const [calendar, setCalendar] = useState({ employee: null, records: [] });
    const [dateFilteredEmployees, setDateFilteredEmployees] = useState([]);

    const departmentOptions = useMemo(() =>
        [{ label: 'All Departments', value: '' }, ...departments.filter((item) =>
            item.status !== 'Inactive').map((item) => item.name || item.department_name).filter(Boolean).map((name) => ({ label: name, value: name }))],
        [departments]);
    const designationOptions = useMemo(() =>
        [{ label: 'All Designations', value: '' }, ...designations.filter((item) =>
            item.status !== 'Inactive' && (!criteria.department || !item.department_name || normalizeText(item.department_name || item.departmentName || item.department) === normalizeText(criteria.department))).map((item) =>
                item.name).filter(Boolean).map((name) =>
                    ({ label: name, value: name }))],
        [criteria.department, designations]);
    const criteriaEmployees = useMemo(() =>
        dateFilteredEmployees.filter((employee) =>
            (!criteria.department || normalizeText(employee.department) === normalizeText(criteria.department)) && (!criteria.designation || normalizeText(employee.designation) === normalizeText(criteria.designation))), [criteria, dateFilteredEmployees]);
    const savedByEmployee = useMemo(() =>
        new Map(attendance.filter((record) => toDateInputValue(record.date) === criteria.date).map((record) =>
            [String(record.employee_id || record.employeeId), record])), [attendance, criteria.date]);
    const stats = useMemo(() =>
        attendance.reduce((total, record) =>
            ({ ...total, present: total.present + Number(record.status === 'Present'), absent: total.absent + Number(record.status === 'Absent'), late: total.late + Number(record.status === 'Late'), halfDay: total.halfDay + Number(record.status === 'Half Day') }), { present: 0, absent: 0, late: 0, halfDay: 0 }), [attendance]);

    useEffect(() => () => {
        /* prevents callers from updating UI after unmount via local cancellation flags */
    }, []);

    const closeForm = useCallback(() => { setMode(null); setEditingRecord(null); setForm(createEmptyForm()); setBulkRows({}); setShowBulkRows(false); }, []);
    const openAdd = useCallback(() => { setEditingRecord(null); setBulkRows({}); setShowBulkRows(false); setMode('bulk'); }, []);
    const openEdit = useCallback((record) => { setEditingRecord(record); setForm({ employee_id: record.employee_id || '', date: toDateInputValue(record.date), check_in: record.check_in || '', check_out: record.check_out || '', status: record.status || 'Present', overtime: record.overtime || '', notes: record.notes || '' }); setMode('edit'); }, []);
    const updateForm = useCallback((field, value) => setForm((current) => ({ ...current, [field]: value })), []);
    const updateCriteria = useCallback((field, value) => { setCriteria((current) => ({ ...current, [field]: value, ...(field === 'department' ? { designation: '' } : {}) })); setShowBulkRows(false); setBulkRows({}); }, []);
    const updateBulkRow = useCallback((employeeId, field, value) => setBulkRows((current) => ({
        ...current, [employeeId]: { ...current[employeeId], [field]: value }
    })),
        []);
    const getBulkRow = useCallback((employee) => {
        const id = String(employee.id);
        const saved = savedByEmployee.get(id);
        const draft = bulkRows[id];
        return { status: draft?.status || saved?.status || 'Present', check_in: draft?.check_in ?? saved?.check_in ?? '', check_out: draft?.check_out ?? saved?.check_out ?? '', notes: draft?.notes ?? saved?.notes ?? '' };

    }, [bulkRows, savedByEmployee]);
    const setAllAttendanceStatus = useCallback((status) => setBulkRows(Object.fromEntries(criteriaEmployees.map((employee) => [employee.id, { ...getBulkRow(employee), status }]))),
        [criteriaEmployees, getBulkRow]);
    const handleCriteriaSearch = useCallback(async (event) => {
        event.preventDefault();
        try {
            if (!criteria.date) {
                return showToast('Attendance date is required', 'error');
            }
            
            // Fetch employees filtered by attendance date and DOJ from backend
            const { data } = await getEmployeesForAttendanceDate(
                criteria.date,
                criteria.department || '',
                criteria.designation || ''
            );
            
            setDateFilteredEmployees(data);
            setShowBulkRows(true);
        }
        catch (error) {
            showToast(error.response?.data?.error || 'Unable to search attendance', 'error');
            setDateFilteredEmployees([]);
            setShowBulkRows(false);
        }
    },
        [criteria, showToast]);

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        if (isSaving) return;
        setIsSaving(true);
        try {
            const payload = getAttendancePayload(form);
            if (editingRecord?.id) {
                await updateAttendance(editingRecord.id, payload);
                showToast('Attendance updated');
            }
            else {
                await createAttendance(payload); showToast('Attendance marked');
            }
            await loadAttendance();
            closeForm();
        }
        catch
        (error) {
            showToast(error.response?.data?.error || 'Unable to save attendance', 'error');
        } finally {
            setIsSaving(false);
        }
    },
        [closeForm, editingRecord, form, isSaving, loadAttendance, showToast]);
    const handleBulkSave = useCallback(async () => {
        if (!criteria.date) return showToast('Attendance date is required', 'error');
        if (!criteriaEmployees.length) return showToast('No employees found for selected criteria', 'error');
        setIsSavingBulk(true);
        try {
            await Promise.all(criteriaEmployees.map((employee) => {
                const saved = savedByEmployee.get(String(employee.id));
                const payload = getAttendancePayload({
                    employee_id: employee.id, date: criteria.date, ...getBulkRow(employee)

                });
                return saved?.id ? updateAttendance(saved.id, payload) : createAttendance(payload);
            }));
            await loadAttendance();

            // Move to next day
            const nextDate = new Date(criteria.date);
            nextDate.setDate(nextDate.getDate() + 1);

            const formattedDate = nextDate.toISOString().split("T")[0];

            setCriteria((prev) => ({
                ...prev,
                date: formattedDate
            }));

            // Clear previous attendance selection
            setBulkRows({});
            setShowBulkRows(true);

            showToast('Attendance saved');
        }
        catch (error) {
            showToast(error.response?.data?.error || 'Unable to save attendance', 'error');

        }
        finally {
            setIsSavingBulk(false);

        }
    },
        [criteria.date, criteriaEmployees, getBulkRow, loadAttendance, savedByEmployee, showToast]);
    const confirmDelete = useCallback(async () => {
        if (!deleteAttendanceId)
            return;
        try {
            await removeAttendance(deleteAttendanceId);
            showToast('Attendance deleted', 'error');
            await loadAttendance();
        }
        catch (error) {
            showToast(error.response?.data?.error || 'Unable to delete attendance', 'error');
        }
        finally {
            setDeleteAttendanceId(null);

        }
    },
        [deleteAttendanceId, loadAttendance, showToast]);
    const openCalendar = useCallback(async (record) => {
        try {
            const now = new Date();
            const { data } = await getEmployeeAttendance(record.employee_id, { month: now.getMonth() + 1, year: now.getFullYear() }); setCalendar({ employee: record, records: data });
        } catch (error) { showToast('Unable to load attendance calendar', 'error'); }
    },
        [showToast]);


    return { mode, form, criteria, showBulkRows, isSaving, isSavingBulk, departmentOptions, designationOptions, criteriaEmployees, stats, deleteAttendanceId, setDeleteAttendanceId, calendar, setCalendar, openAdd, openEdit, closeForm, updateForm, updateCriteria, updateBulkRow, getBulkRow, setAllAttendanceStatus, handleCriteriaSearch, handleSubmit, handleBulkSave, confirmDelete, openCalendar };
}