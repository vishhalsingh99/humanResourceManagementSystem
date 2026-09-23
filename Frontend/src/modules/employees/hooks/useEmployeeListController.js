import { useMemo, useState } from 'react';
import { useEmployeesQuery } from '../services/useEmployeesQuery';

const SEARCHABLE_FIELDS = ['name', 'employeeCode', 'department', 'designation', 'email'];

/**
 * Controller layer (Layer 2): UI state (search text, status filter) and the
 * orchestration between that state and the service layer. Components read
 * from this hook and call its handlers — they hold no business logic of
 * their own.
 */
export function useEmployeeListController() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const {
    data: employees = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useEmployeesQuery('all');

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();

    return employees.filter((employee) => {
      if (statusFilter !== 'all' && employee.status !== statusFilter) return false;
      if (!term) return true;

      return SEARCHABLE_FIELDS.some((field) => {
        const value = employee[field];
        return typeof value === 'string' && value.toLowerCase().includes(term);
      });
    });
  }, [employees, search, statusFilter]);

  const counts = useMemo(() => ({
    all: employees.length,
    active: employees.filter((employee) => employee.status === 'active').length,
    inactive: employees.filter((employee) => employee.status === 'inactive').length,
  }), [employees]);

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    employees: filteredEmployees,
    counts,
    isLoading,
    isFetching,
    isError,
    errorMessage: error?.response?.data?.error || error?.message || 'Unable to load employees',
    refetch,
  };
}
