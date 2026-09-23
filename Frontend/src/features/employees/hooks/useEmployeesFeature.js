import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { createDepartment } from '../../../api/departmentApi';
import { createDesignation } from '../../../api/designationApi';
import { emptyEmployeeForm } from '../constants/employee.constants';
import { createEmployee, deleteEmployee, updateEmployee, updateEmployeeStatus } from '../services/employees.api';
import { openEmployeePrintPage, openEmployeesListPrintPage } from '../services/employeesPdf.service';
import { filterEmployees, normalizeEmployeeForEdit } from '../utils/employee.utils';
import { getEmployeeLimitMessage, getSubscriptionPlan } from '../../../constants/subscription.constants';
import { validatePhoneNumber } from '../../../utils/phoneValidation';
import { validateAadhaarNumber, validatePanNumber, validatePositiveNumber } from '../../../utils/formValidation';
import { getRoles } from '../../../api/rolesApi';
// import { validateBankAccountNumber,validateIFSCCode, validateAccountHolderName} from '../../../utils/formValidation';

const emptyOptionForm = {
  name: '',
  code: '',
  description: '',
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

export function useEmployeesFeature() {
  const {
    employees,
    loadEmployees,
    departments,
    loadDepartments,
    designations,
    loadDesignations,
    showToast,
    onboarding,
    user,
    refreshUserProfile,
  } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(emptyEmployeeForm);
  const [optionModalType, setOptionModalType] = useState(null);
  const [optionForm, setOptionForm] = useState(emptyOptionForm);
  const [isSavingOption, setIsSavingOption] = useState(false);
  const [roles, setRoles] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  // Mirrors the shared `employees` list locally so a status toggle can update a single
  // row immediately without refetching or affecting other pages that rely on `employees`
  // being filtered to active-only (attendance/leave/payroll employee pickers).
  const [localEmployees, setLocalEmployees] = useState(employees);

  useEffect(() => {
    setLocalEmployees(employees);
  }, [employees]);

  useEffect(() => {
    // The employee management page needs every employee (not just active ones) so the
    // Active/Inactive toggle and filter tabs work for the whole list.
    loadEmployees('all');
    loadDepartments();
    loadDesignations();
  }, [loadEmployees, loadDepartments, loadDesignations]);

  useEffect(() => {
    let active = true;
    getRoles()
      .then((response) => {
        if (active) setRoles(response.data || []);
      })
      .catch((error) => {
        showToast(error.response?.data?.error || 'Unable to load roles', 'error');
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const departmentOptions = useMemo(() => {
    const activeDepartments = departments
      .filter((department) => department.status !== 'Inactive')
      .map((department) => department.name || department.department_name);

    return ['', ...activeDepartments];
  }, [departments]);

  const designationOptions = useMemo(() => {
    const activeDesignations = designations
      .filter((designation) => {
        if (designation.status === 'Inactive') return false;
        const designationDepartment = designation.department_name || designation.departmentName || designation.department;
        return !form.department || !designationDepartment || normalizeText(designationDepartment) === normalizeText(form.department);
      })
      .map((designation) => designation.name);

    return ['', ...activeDesignations];
  }, [designations, form.department]);

  const filteredEmployees = useMemo(
    () => filterEmployees(localEmployees, search, statusFilter),
    [localEmployees, search, statusFilter]
  );
  const currentPlan = useMemo(
    () => getSubscriptionPlan(onboarding.subscription),
    [onboarding.subscription]
  );

  function openAddEmployee() {
    setViewingEmployee(null);
    setEditingEmployee(null);
    setForm(emptyEmployeeForm);
    setShowForm(true);
  }

  function openEditEmployee(employee) {
    setViewingEmployee(null);
    setEditingEmployee(employee);
    setForm(normalizeEmployeeForEdit(employee, emptyEmployeeForm));
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingEmployee(null);
    setForm(emptyEmployeeForm);
  }

  function openViewEmployee(employee) {
    setShowForm(false);
    setEditingEmployee(null);
    setViewingEmployee(employee);
  }

  function closeViewEmployee() {
    setViewingEmployee(null);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'department' ? { designation: '' } : {}),
      ...(field === 'maritalStatus' && value !== 'Married' ? { spouseName: '' } : {}),
    }));
  }

  function handleAddOption(field) {
    if (field !== 'department' && field !== 'designation') return;

    if (field === 'designation' && !form.department) {
      showToast('Please select department before adding designation', 'error');
      return;
    }

    setOptionModalType(field);
    setOptionForm(emptyOptionForm);
  }

  function closeOptionModal() {
    if (isSavingOption) return;

    setOptionModalType(null);
    setOptionForm(emptyOptionForm);
  }

  function updateOptionForm(field, value) {
    setOptionForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleOptionFormSubmit(event) {
    event.preventDefault();

    const label = optionModalType === 'department' ? 'department' : 'designation';
    const trimmedName = optionForm.name.trim();

    if (!trimmedName) {
      showToast(`${label[0].toUpperCase()}${label.slice(1)} name is required`, 'error');
      return;
    }

    const payload = {
      name: trimmedName,
      code: optionForm.code.trim(),
      description: optionForm.description.trim(),
    };

    if (optionModalType === 'designation') {
      payload.department = form.department;
      payload.department_name = form.department;
    }

    setIsSavingOption(true);

    try {
      if (optionModalType === 'department') {
        await createDepartment(payload);
        await loadDepartments();
      } else {
        await createDesignation(payload);
        await loadDesignations();
      }

      updateField(optionModalType, trimmedName);
      setOptionModalType(null);
      setOptionForm(emptyOptionForm);
      showToast(`${label[0].toUpperCase()}${label.slice(1)} added`);
    } catch (err) {
      showToast(err.response?.data?.error || `Unable to add ${label}`, 'error');
    } finally {
      setIsSavingOption(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Validate phone numbers
    if (form.phone && !validatePhoneNumber(form.phone)) {
      showToast('Contact Number must be at least 10 digits and start with 6, 7, 8, or 9', 'error');
      return;
    }

    if (form.emergencyContact && !validatePhoneNumber(form.emergencyContact)) {
      showToast('Emergency Contact Number must be at least 10 digits and start with 6, 7, 8, or 9', 'error');
      return;
    }

    if (!validatePositiveNumber(form.salary)) {
      showToast('Salary must be a positive number', 'error');
      return;
    }
    // if (!validateBankAccountNumber(form.accountNumber)) {
    //   showToast('Bank Account Number must be between 9 and 18 digits', 'error');
    //   return;
    // }

    

    // if (!validateAccountHolderName(form.accountHolderName)) {
    //   showToast('Invalid Account Holder Name', 'error');
    //   return;
    // }

    if (form.aadhaarNumber && !validateAadhaarNumber(form.aadhaarNumber)) {
      showToast('Aadhaar number must be exactly 12 digits', 'error');
      return;
    }

    if (form.panNumber && !validatePanNumber(form.panNumber)) {
      showToast('PAN number must use the format ABCDE1234F', 'error');
      return;
    }

    if (form.maritalStatus === 'Married' && !String(form.spouseName || '').trim()) {
      showToast('Spouse Name is required when marital status is Married', 'error');
      return;
    }
    // DOB validation (18+)
if (form.dob) {
  const birthDate = new Date(form.dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  if (age < 18) {
    showToast('Employee must be 18 years or older', 'error');
    return;
  }
}

    try {
      if (editingEmployee?.id) {
        await updateEmployee(editingEmployee.id, form);
        const isCurrentEmployeeSession =
          String(editingEmployee.id) === String(user?.employeeId || '') ||
          String(form.email || '').toLowerCase() === String(user?.email || '').toLowerCase();
        if (isCurrentEmployeeSession) {
          await refreshUserProfile();
        }
        showToast('Employee updated');
      } else {
        if (currentPlan.employeeLimit && localEmployees.length >= currentPlan.employeeLimit) {
          showToast(getEmployeeLimitMessage(currentPlan), 'error');
          return;
        }

        await createEmployee({
          ...form,
          subscriptionPlan: currentPlan.id,
        });
        showToast('Employee added');
      }

      await loadEmployees('all');
      closeForm();
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to save employee', 'error');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEmployee(id);
      showToast('Employee deleted', 'error');
      loadEmployees('all');
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to delete employee', 'error');
    }
  }

  async function handleToggleStatus(employee, nextStatus) {
    if (statusUpdatingId) return;

    setStatusUpdatingId(employee.id);
    try {
      await updateEmployeeStatus(employee.id, nextStatus);
      setLocalEmployees((current) =>
        current.map((item) => (item.id === employee.id ? { ...item, status: nextStatus } : item))
      );
      showToast(nextStatus === 'active' ? 'Employee activated' : 'Employee deactivated');
    } catch (err) {
      // Do not change localEmployees on failure so the toggle visually stays at its previous state.
      showToast(err.response?.data?.error || 'Unable to update employee status', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleDownloadEmployeePdf(employee) {
    try {
      await openEmployeePrintPage(employee);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Unable to open print page', 'error');
    }
  }

  async function handleDownloadEmployeesListPdf() {
    try {
      await openEmployeesListPrintPage(filteredEmployees);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Unable to open print page', 'error');
    }
  }

  return {
    employees: localEmployees,
    filteredEmployees,
    statusFilter,
    setStatusFilter,
    statusUpdatingId,
    handleToggleStatus,
    search,
    setSearch,
    showForm,
    viewingEmployee,
    editingEmployee,
    form,
    roles,
    departmentOptions,
    designationOptions,
    openAddEmployee,
    openEditEmployee,
    closeForm,
    openViewEmployee,
    closeViewEmployee,
    updateField,
    handleAddOption,
    optionModalType,
    optionForm,
    isSavingOption,
    updateOptionForm,
    handleOptionFormSubmit,
    closeOptionModal,
    handleSubmit,
    handleDelete,
    handleDownloadEmployeePdf,
    handleDownloadEmployeesListPdf,
  };
}
