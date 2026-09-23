import { z } from 'zod';
import api from '../../../services/api';

/**
 * Repository layer (Layer 4): owns the HTTP call, the wire-shape validation,
 * and the DTO transform. Nothing above this layer should know that the
 * backend sends `employee_id` in snake_case, or that `status` might be
 * missing on legacy records — that translation happens exactly once, here.
 */

// What the API can actually send us. Deliberately loose (`.nullish()`,
// `.passthrough()`) because the backend model has many optional/legacy
// fields we don't care about for a directory list.
const RawEmployeeSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    name: z.string().nullish(),
    employeeId: z.union([z.string(), z.number()]).nullish(),
    employee_id: z.union([z.string(), z.number()]).nullish(),
    email: z.string().nullish(),
    phone: z.string().nullish(),
    department: z.string().nullish(),
    designation: z.string().nullish(),
    join_date: z.string().nullish(),
    joinDate: z.string().nullish(),
    status: z.string().nullish(),
    roleName: z.string().nullish(),
  })
  .passthrough();

// The shape every consumer above this layer actually works with.
const EmployeeListItemSchema = RawEmployeeSchema.transform((raw) => ({
  id: Number(raw.id),
  employeeCode: String(raw.employeeId ?? raw.employee_id ?? '—'),
  name: raw.name?.trim() || 'Unnamed employee',
  email: raw.email ?? null,
  phone: raw.phone ?? null,
  department: raw.department ?? '—',
  designation: raw.designation ?? '—',
  joinDate: raw.join_date ?? raw.joinDate ?? null,
  status: raw.status === 'inactive' ? 'inactive' : 'active',
  roleName: raw.roleName ?? null,
  initials: (raw.name?.trim() || '?').slice(0, 1).toUpperCase(),
}));

const EmployeeListSchema = z.array(EmployeeListItemSchema);

/**
 * @typedef {z.infer<typeof EmployeeListItemSchema>} EmployeeListItem
 */

/**
 * @param {{ status?: 'active' | 'inactive' | 'all' }} [params]
 * @returns {Promise<EmployeeListItem[]>}
 */
export async function fetchEmployeeList({ status = 'all' } = {}) {
  const response = await api.get('/api/employees', { params: { status } });
  return EmployeeListSchema.parse(response.data);
}
