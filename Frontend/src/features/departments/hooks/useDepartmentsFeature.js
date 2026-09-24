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

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deleteDepartmentId, setDeleteDepartmentId] = useState(null);
  const [formData, setFormData] = useState(emptyDepartment);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const stats = useMemo(() => {
    const activeDepartments = departments.filter(
      (dept) => dept.status === 'Active'
    ).length;

    return {
      total: departments.length,
      active: activeDepartments,
      inactive: departments.length - activeDepartments,
    };
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) =>
      (dept.name || dept.department_name || '')
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [departments, search]);

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openAddDepartment() {
    setEditingDepartment(null);
    setFormData(emptyDepartment);
    setShowForm(true);
  }

  function closeForm() {
    if (isSaving) return;
    setEditingDepartment(null);
    setFormData(emptyDepartment);
    setShowForm(false);
  }

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

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
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
      setIsSaving(false);
      setEditingDepartment(null);
      setFormData(emptyDepartment);
      setShowForm(false);
    } catch (err) {
      showToast(
        err.response?.data?.error || 'Unable to save department',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function requestDeleteDepartment(id) {
    setDeleteDepartmentId(id);
  }

  function closeDeleteConfirmation() {
    setDeleteDepartmentId(null);
  }

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
    isSaving,
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
