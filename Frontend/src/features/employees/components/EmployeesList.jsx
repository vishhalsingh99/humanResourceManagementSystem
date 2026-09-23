import { useEffect, useState } from 'react';
import Pagination from '../../../components/table/Pagination';
import EmployeesTable from './EmployeesTable';
import EmployeesToolbar from './EmployeesToolbar';

const itemsPerPage = 10;

export default function EmployeesList({
  employees,
  filteredEmployees,
  search,
  onAdd,
  onDelete,
  canCreate = false,
  canEdit = false,
  canDelete = false,
  onDownloadPdf,
  onEdit,
  onSearchChange,
  onView,
  statusFilter = 'all',
  onStatusFilterChange,
  onToggleStatus,
  statusUpdatingId = null,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="p-6 mt-16 sm:p-6 text lg:p-10">
      <section className="rounded-none bg-white p-5 shadow-[0_16px_28px_rgba(15,23,42,0.18)] sm:p-7">
        <EmployeesToolbar
          employeeCount={employees.length}
          search={search}
          onAdd={onAdd}
          canCreate={canCreate}
          onDownloadPdf={onDownloadPdf}
          onSearchChange={onSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />

        <EmployeesTable
          employees={paginatedEmployees}
          onDelete={onDelete}
          onEdit={onEdit}
          canEdit={canEdit}
          canDelete={canDelete}
          onView={onView}
          startIndex={startIndex}
          onToggleStatus={onToggleStatus}
          statusUpdatingId={statusUpdatingId}
        />
        <Pagination
          currentPage={currentPage}
          totalItems={filteredEmployees.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  );
}
