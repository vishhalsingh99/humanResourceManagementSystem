import { z } from 'zod';

export const designationSchema = z.object({
  name: z.string().trim().optional(),
  designation_name: z.string().trim().optional(),
  department: z.union([z.string(), z.number()]).optional(),
  department_name: z.union([z.string(), z.number()]).optional(),
  departmentName: z.union([z.string(), z.number()]).optional(),
  department_id: z.union([z.string(), z.number()]).optional(),
  departmentId: z.union([z.string(), z.number()]).optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.name?.trim() && !data.designation_name?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'Designation name is required' });
  }
  const department = data.department || data.department_name || data.departmentName || data.department_id || data.departmentId;
  if (!department) {
    ctx.addIssue({ code: 'custom', message: 'Department is required for designation' });
  }
});
