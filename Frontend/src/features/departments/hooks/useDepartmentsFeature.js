import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from '../../../api/departmentApi';
import { emptyDepartment } from '../constants/department.constants';

export function useDepartmentsFeature() {
  const { departments, loadDepartments, showToast } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deleteDepartmentId, setDeleteDepartmentId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(emptyDepartment);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // Department Statistics
  const stats = useMemo(() => {
    // const totalEmployees = departments.reduce(
    //   (acc, dept) => acc + Number(dept.employees || dept.employee_capacity || 0),
    //   0
    // );

    const activeDepartments = departments.filter(
      (dept) => dept.status === 'Active'
    ).length;

    return {
      total: departments.length,
       
      active: activeDepartments,
      inactive: departments.length - activeDepartments,
    };
  }, [departments]);

  // Search Filter
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) =>
      (dept.name || dept.department_name || '')
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [departments, search]);

  // Update Form Field
  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // Open Add Form
  function openAddDepartment() {
    setEditingDepartment(null);
    setFormData(emptyDepartment);
    setShowForm(true);
  }

  // Close Form
  function closeForm() {
    setEditingDepartment(null);
    setFormData(emptyDepartment);
    setShowForm(false);
  }

  // Open Edit Form
  function openEditDepartment(department) {
    setEditingDepartment(department);

    setFormData({
      ...emptyDepartment,
      ...department,
      name: department.name || department.department_name || '',
      code: department.code || department.department_code || '',
     
    });

    setShowForm(true);
  }

  // Submit Form
  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
       
        description: formData.description,
        status: formData.status,
      };

      if (editingDepartment?.id) {
        await updateDepartment(editingDepartment.id, payload);
        showToast('Department updated');
      } else {
        await createDepartment(payload);
        showToast('Department added');
      }

      await loadDepartments();
      closeForm();
    } catch (err) {
      showToast(
        err.response?.data?.error || 'Unable to save department',
        'error'
      );
    }
  }

  function requestDeleteDepartment(id) {
    setDeleteDepartmentId(id);
  }

  function closeDeleteConfirmation() {
    setDeleteDepartmentId(null);
  }

  // Delete Department
  async function confirmDeleteDepartment() {
    if (!deleteDepartmentId) return;

    try {
      await deleteDepartment(deleteDepartmentId);

      await loadDepartments();

      showToast('Department deleted', 'error');
      closeDeleteConfirmation();
    } catch (err) {
      showToast(
        err.response?.data?.error || 'Unable to delete department',
        'error'
      );
    }
  }

  return {
    filteredDepartments,
    editingDepartment,
    formData,
    search,
    setSearch,
    deleteDepartmentId,
    showForm,
    stats,
    closeForm,
    closeDeleteConfirmation,
    confirmDeleteDepartment,
    handleSubmit,
    openAddDepartment,
    openEditDepartment,
    requestDeleteDepartment,
    updateField,
  };
}
