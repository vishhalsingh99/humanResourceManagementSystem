import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createDesignation,
  deleteDesignation,
  updateDesignation,
} from '../../../api/designationApi';
import Button from '../../../components/common/Button';
import EmptyState from '../../../components/common/EmptyState';
import InputField from '../../../components/common/InputField';
import SearchBar from '../../../components/common/SearchBar';
import SelectField from '../../../components/common/SelectField';
import StatusBadge from '../../../components/common/StatusBadge';
import TextareaField from '../../../components/common/TextareaField';
import DeleteConfirmationModal from '../../../components/ui/DeleteConfirmationModal';
import DataTable from '../../../components/table/DataTable';
import Pagination from '../../../components/table/Pagination';
import { useApp } from '../../../context/AppContext';

const emptyDesignation = {
  name: '',
  code: '',
  department_id: '',
  department_name: '',
  status: 'Active',
  description: '',
};

const getDepartmentName = (department) => department.name || department.department_name || '';
const itemsPerPage = 10;

export default function Designations() {
  const {
    departments,
    loadDepartments,
    designations,
    loadDesignations,
    showToast,
  } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState(null);
  const [deleteDesignationId, setDeleteDesignationId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(emptyDesignation);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadDepartments();
    loadDesignations();
  }, [loadDepartments, loadDesignations]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const departmentOptions = useMemo(() => {
    const options = departments
      .filter((department) => department.status !== 'Inactive')
      .map((department) => ({
        label: getDepartmentName(department),
        value: String(department.id),
      }))
      .filter((option) => option.label);

    return [{ label: 'Select Department', value: '' }, ...options];
  }, [departments]);

  const stats = useMemo(() => {
    const activeDesignations = designations.filter((designation) => designation.status === 'Active').length;

    return {
      total: designations.length,
      active: activeDesignations,
      inactive: designations.length - activeDesignations,
    };
  }, [designations]);

  const filteredDesignations = useMemo(() => {
    const query = search.toLowerCase();

    return designations.filter((designation) => {
      const name = designation.name || '';
      const departmentName = designation.department_name || designation.departmentName || '';

      return name.toLowerCase().includes(query) || departmentName.toLowerCase().includes(query);
    });
  }, [designations, search]);
  const totalPages = Math.max(1, Math.ceil(filteredDesignations.length / itemsPerPage));
  const paginatedDesignations = filteredDesignations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function updateField(field, value) {
    setFormData((current) => {
      if (field === 'department_id') {
        const department = departments.find((item) => String(item.id) === String(value));

        return {
          ...current,
          department_id: value,
          department_name: department ? getDepartmentName(department) : '',
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  function openAddDesignation() {
    setEditingDesignation(null);
    setFormData(emptyDesignation);
    setShowForm(true);
  }

  function openEditDesignation(designation) {
    setEditingDesignation(designation);
    setFormData({
      ...emptyDesignation,
      ...designation,
      name: designation.name || '',
      code: designation.code || designation.designation_code || '',
      department_id: designation.department_id ? String(designation.department_id) : '',
      department_name: designation.department_name || designation.departmentName || '',
      status: designation.status || 'Active',
      description: designation.description || '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setEditingDesignation(null);
    setFormData(emptyDesignation);
    setShowForm(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      name: formData.name,
      code: formData.code,
      department_id: formData.department_id,
      department_name: formData.department_name,
      description: formData.description,
      status: formData.status,
    };

    try {
      if (editingDesignation?.id) {
        await updateDesignation(editingDesignation.id, payload);
        showToast('Designation updated');
      } else {
        await createDesignation(payload);
        showToast('Designation added');
      }

      await loadDesignations();
      closeForm();
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to save designation', 'error');
    }
  }

  async function confirmDeleteDesignation() {
    if (!deleteDesignationId) return;

    try {
      await deleteDesignation(deleteDesignationId);
      await loadDesignations();
      showToast('Designation deleted', 'error');
      setDeleteDesignationId(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to delete designation', 'error');
    }
  }

  if (showForm) {
    return (
      <div className="p-4 sm:p-6 mt-18 lg:p-10">
        <form onSubmit={handleSubmit} className="rounded-none bg-white p-5 shadow-[0_16px_28px_rgba(15,23,42,0.32)] sm:p-7">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <Button type="button" onClick={closeForm} variant="primary" icon={ArrowLeft} className="self-start">
              <span>Back</span>
            </Button>

            <div className="text-left lg:text-right">
              <h2 className="m-0 text-3xl font-semibold text-slate-900">
                {editingDesignation ? 'Update Designation' : 'Add Designation'}
              </h2>
              <p className="mt-2 text-sm text-slate-500">Connect each designation with its department.</p>
            </div>
          </div>

          <div className="pt-8">
            <h3 className="m-0 text-2xl font-semibold text-slate-900">Designation Details</h3>
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <SelectField
                label="Department"
                value={formData.department_id}
                onChange={(event) => updateField('department_id', event.target.value)}
                options={departmentOptions}
                required
                inputClassName="rounded-lg"
              />
              <InputField
                label="Designation Name"
                value={formData.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
                inputClassName="rounded-lg"
              />
              <InputField
                label="Designation Code"
                value={formData.code}
                onChange={(event) => updateField('code', event.target.value)}
                inputClassName="rounded-lg"
              />
              <SelectField
                label="Status"
                value={formData.status}
                onChange={(event) => updateField('status', event.target.value)}
                options={['Active', 'Inactive']}
                inputClassName="rounded-lg"
              />
              <TextareaField
                className="md:col-span-2"
                label="Description"
                value={formData.description}
                onChange={(event) => updateField('description', event.target.value)}
                inputClassName="rounded-lg"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Button type="button" onClick={closeForm} variant="secondary">
              Back
            </Button>
            <Button type="submit" variant="primary">
              {editingDesignation ? 'Update Designation' : 'Save Designation'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mb-6 mt-20 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Designations</h1>
          <p className="mt-1 text-slate-500">Manage designations by department.</p>
        </div>

        <Button icon={Plus} className="mt-4 rounded-xl md:mt-0" onClick={openAddDesignation}>
          Add Designation
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          ['Total Designations', stats.total],
          ['Active Designations', stats.active],
          ['Inactive Designations', stats.inactive],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <p className="text-sm text-slate-500">{label}</p>
            <h2 className="mt-2 text-3xl font-bold">{value}</h2>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-sm bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search Designation or Department..."
          inputClassName="rounded-sm"
        />
      </div>

      <DataTable
        headers={['Designation', 'Department', 'Status', 'Actions']}
        className="rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
        tableClassName="min-w-full border-collapse"
        headerCellClassName="px-5 py-4 text-left text-sm font-semibold text-slate-800"
      >
        {paginatedDesignations.map((designation) => (
          <tr key={designation.id} className="border-b border-slate-100 transition hover:bg-slate-50">
            <td className="p-4">
              <h3 className="font-semibold text-slate-800">{designation.name}</h3>
              <p className="text-sm text-slate-500">{designation.description}</p>
            </td>
            <td className="p-4 text-sm text-slate-700">
              {designation.department_name || designation.departmentName || '-'}
            </td>
            <td className="p-4">
              <StatusBadge tone={designation.status === 'Active' ? 'green' : 'red'}>{designation.status}</StatusBadge>
            </td>
            <td className="p-4">
              <div className="flex items-center justify-center gap-3">
                <Button size="icon" variant="ghost" className="text-blue-600" title="View designation">
                  <Eye size={18} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-yellow-600"
                  title="Edit designation"
                  onClick={() => openEditDesignation(designation)}
                >
                  <Pencil size={18} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-600"
                  title="Delete designation"
                  onClick={() => setDeleteDesignationId(designation.id)}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </td>
          </tr>
        ))}
        {filteredDesignations.length === 0 && <EmptyState colSpan={4} message="No Designation Found" />}
      </DataTable>
      <Pagination
        currentPage={currentPage}
        totalItems={filteredDesignations.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {deleteDesignationId && (
        <DeleteConfirmationModal
          title="Delete Designation"
          message="Are you sure you want to delete this designation? This action cannot be undone."
          onCancel={() => setDeleteDesignationId(null)}
          onConfirm={confirmDeleteDesignation}
        />
      )}
    </div>
  );
}
