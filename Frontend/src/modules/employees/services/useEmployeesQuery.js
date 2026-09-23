import { useQuery } from '@tanstack/react-query';
import { fetchEmployeeList } from '../api/employees.repository';

/**
 * Service layer (Layer 3): owns cache identity (query keys) and fetch
 * policy (staleness, retries) for the employees domain. Controllers consume
 * this hook and never talk to the repository or axios directly.
 */
export const employeesQueryKeys = {
  all: ['employees'],
  list: (status) => [...employeesQueryKeys.all, 'list', status],
};

export function useEmployeesQuery(status = 'all') {
  return useQuery({
    queryKey: employeesQueryKeys.list(status),
    queryFn: () => fetchEmployeeList({ status }),
  });
}
