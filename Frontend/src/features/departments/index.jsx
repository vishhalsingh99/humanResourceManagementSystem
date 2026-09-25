import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import InputField from '../../components/common/InputField';
import SearchBar from '../../components/common/SearchBar';
import SelectField from '../../components/common/SelectField';
import StatusBadge from '../../components/common/StatusBadge';
import TextareaField from '../../components/common/TextareaField';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import DataTable from '../../components/table/DataTable';
import Pagination from '../../components/table/Pagination';
import { departmentFormFields } from './config/departmentForm.config';
import { departmentStatCards } from './constants/department.constants';
import { useDepartmentsFeature } from './hooks/useDepartmentsFeature';

const itemsPerPage = 10;

export default function Departments() {
  const {
    editingDepartment,
    filteredDepartments,
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
  } = useDepartmentsFeature();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / itemsPerPage));
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const renderDepartmentField = (field) => {
    if (field.type === 'select') {
      return (
        <SelectField
          key={field.name}
          label={field.label}
          value={formData[field.name]}
          onChange={(e) => updateField(field.name, e.target.value)}
          options={field.options}
          inputClassName="rounded-lg"
        />
      );
    }

    if (field.type === 'textarea') {
      return (
        <TextareaField
          key={field.name}
          className={field.className}
          label={field.label}
          value={formData[field.name]}
          onChange={(e) => updateField(field.name, e.target.value)}
          inputClassName="rounded-lg"
        />
      );
    }

    return (
      <InputField
        key={field.name}
        type={field.type}
        label={field.label}
        value={formData[field.name]}
        onChange={(e) => updateField(field.name, e.target.value)}
        required={field.required}
        inputClassName="rounded-lg"
      />
    );
  };

  if (showForm) {
    return (
      <div className="mt-4 p-4 sm:p-6 lg:p-10">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border t-border bg-[var(--bg-surface)] p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md sm:p-7"
        >
          <div className="flex flex-col gap-4 border-b t-divider pb-6 lg:flex-row lg:items-center lg:justify-between">
            <Button
              type="button"
              onClick={closeForm}
              variant="primary"
              icon={ArrowLeft}
              className="self-start"
              disabled={isSaving}
            >
              <span>Back</span>
            </Button>

            <div className="text-left lg:text-right">
              <h2 className="m-0 text-3xl font-semibold t-text-heading">
                {editingDepartment ? 'Update Department' : 'Add Department'}
              </h2>
              <p className="mt-2 text-sm t-text-muted">Fill in the details below to manage a department.</p>
            </div>
          </div>

          <div className="pt-8">
            <h3 className="m-0 text-2xl font-semibold t-text-heading">Department Details</h3>
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {departmentFormFields.map(renderDepartmentField)}
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t t-divider pt-6 sm:flex-row sm:justify-end">
            <Button type="button" onClick={closeForm} variant="secondary" disabled={isSaving}>
              Back
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {isSaving
                ? editingDepartment
                  ? 'Updating...'
                  : 'Saving...'
                : editingDepartment
                  ? 'Update Department'
                  : 'Save Department'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 mt-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold t-text-heading">Departments</h1>
          <p className="mt-1 t-text-muted">Manage your departments.</p>
        </div>

        <Button icon={Plus} className="mt-4 md:mt-0" onClick={openAddDepartment}>
          Add Department
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {departmentStatCards.map(({ label, key, icon: Icon, tone }) => (
          <div
            key={key}
            className="rounded-2xl border t-border bg-[var(--bg-surface)] p-5 shadow-[0_0_24px_rgba(239,68,68,0.06)] backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm t-text-muted">{label}</p>
                <h2 className="mt-2 text-3xl font-bold t-text-heading">{stats[key]}</h2>
              </div>
              {Icon && (
                <div className={`rounded-xl p-3 ${tone === 'green' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  <Icon />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border t-border bg-[var(--bg-surface)] p-4 backdrop-blur-md">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Department..."
        />
      </div>

      <DataTable
        headers={['Department',  'Status', 'Actions']}
        className="rounded-2xl"
        tableClassName="min-w-full border-collapse"
        headerCellClassName="px-5 py-4 text-left text-sm font-semibold t-text-muted"
      >
        {paginatedDepartments.map((dept) => (
          <tr key={dept.id} className="border-b t-border t-row-hover transition">
            <td className="p-4">
              <h3 className="font-semibold t-text-primary">{dept.name || dept.department_name}</h3>
              <p className="text-sm t-text-subtle">{dept.description}</p>
            </td>
          
            <td className="p-4">
              <StatusBadge tone={dept.status === 'Active' ? 'green' : 'red'}>{dept.status}</StatusBadge>
            </td>
            <td className="p-4">
              <div className="flex items-center justify-center gap-3">
                <Button size="icon" variant="ghost" className="text-red-300" title="View department">
                  <Eye size={18} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-amber-400"
                  title="Edit department"
                  onClick={() => openEditDepartment(dept)}
                >
                  <Pencil size={18} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-rose-400"
                  title="Delete department"
                  onClick={() => requestDeleteDepartment(dept.id)}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </td>
          </tr>
        ))}
        {filteredDepartments.length === 0 && <EmptyState colSpan={7} message="No Department Found" />}
      </DataTable>
      <Pagination
        currentPage={currentPage}
        totalItems={filteredDepartments.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {deleteDepartmentId && (
        <DeleteConfirmationModal
          title="Delete Department"
          message="Are you sure you want to delete this department? This action cannot be undone."
          onCancel={closeDeleteConfirmation}
          onConfirm={confirmDeleteDepartment}
        />
      )}
    </div>
  );
}
