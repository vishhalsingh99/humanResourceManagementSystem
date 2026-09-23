import { Building2, Users } from 'lucide-react';

export const emptyDepartment = {
  name: '',
  code: '',
  status: 'Active',
  description: '',
};

export const departmentStatCards = [
  { label: 'Total Departments', key: 'total', icon: Building2, tone: 'blue' },
   { label: 'Active Departments', key: 'active', tone: 'slate' },
  { label: 'Inactive Departments', key: 'inactive', tone: 'slate' },
];
