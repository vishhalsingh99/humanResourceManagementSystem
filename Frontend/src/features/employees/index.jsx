import { useState } from 'react';
import EmployeeDetailView from './components/EmployeeDetailView';
import EmployeeForm from './components/EmployeeForm';
import EmployeesList from './components/EmployeesList';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import { useEmployeesFeature } from './hooks/useEmployeesFeature';
import { useApp } from '../../context/AppContext';

export default function Employees() {
  const { hasPermission } = useApp();
  const [deleteEmployeeId, setDeleteEmployeeId] = useState(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState(null); // { employee, nextStatus }
  const {
    employees,
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
    isSaving,
    updateOptionForm,
    handleOptionFormSubmit,
    closeOptionModal,
    handleSubmit,
    handleDelete,
    handleDownloadEmployeePdf,
    handleDownloadEmployeesListPdf,
  } = useEmployeesFeature();

  async function confirmDeleteEmployee() {
    if (!deleteEmployeeId) return;

    await handleDelete(deleteEmployeeId);
    setDeleteEmployeeId(null);
  }

  function requestStatusChange(employee) {
    const nextStatus = employee.status === 'inactive' ? 'active' : 'inactive';
    setStatusChangeTarget({ employee, nextStatus });
  }

  async function confirmStatusChange() {
    if (!statusChangeTarget) return;

    const { employee, nextStatus } = statusChangeTarget;
    setStatusChangeTarget(null);
    await handleToggleStatus(employee, nextStatus);
  }

  if (viewingEmployee) {
    return (
      <EmployeeDetailView
        employee={viewingEmployee}
        onBack={closeViewEmployee}
        onEdit={openEditEmployee}
        canEdit={hasPermission('employee.edit')}
        onDownloadPdf={handleDownloadEmployeePdf}
      />
    );
  }

  if (showForm) {
    return (
      <EmployeeForm
        editingEmployee={editingEmployee}
        form={form}
        onClose={closeForm}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        roles={roles}
        departmentOptions={departmentOptions}
        designationOptions={designationOptions}
        onAddOption={handleAddOption}
        optionModalType={optionModalType}
        optionForm={optionForm}
        isSavingOption={isSavingOption}
        onOptionFormChange={updateOptionForm}
        onOptionFormSubmit={handleOptionFormSubmit}
        onCloseOptionModal={closeOptionModal}
      />
    );
  }
  return (
    <>
      <EmployeesList
        employees={employees}
        filteredEmployees={filteredEmployees}
        search={search}
        onAdd={openAddEmployee}
        onDelete={setDeleteEmployeeId}
        canCreate={hasPermission('employee.create')}
        canEdit={hasPermission('employee.edit')}
        canDelete={hasPermission('employee.delete')}
        onDownloadPdf={handleDownloadEmployeesListPdf}
        onEdit={openEditEmployee}
        onSearchChange={setSearch}
        onView={openViewEmployee}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onToggleStatus={requestStatusChange}
        statusUpdatingId={statusUpdatingId}
      />

      {deleteEmployeeId && (
        <DeleteConfirmationModal
          title="Delete Employee"
          message="Are you sure you want to delete this employee? This action cannot be undone."
          onCancel={() => setDeleteEmployeeId(null)}
          onConfirm={confirmDeleteEmployee}
        />
      )}

      {statusChangeTarget && (
        <DeleteConfirmationModal
          title={statusChangeTarget.nextStatus === 'inactive' ? 'Deactivate Employee?' : 'Activate Employee?'}
          message={
            statusChangeTarget.nextStatus === 'inactive'
              ? 'Are you sure you want to deactivate this employee? The employee will no longer be able to access active HRMS functions.'
              : 'Are you sure you want to activate this employee?'
          }
          confirmLabel={statusChangeTarget.nextStatus === 'inactive' ? 'Deactivate' : 'Activate'}
          cancelLabel="Cancel"
          onCancel={() => setStatusChangeTarget(null)}
          onConfirm={confirmStatusChange}
        />
      )}
    </>
  );
}
