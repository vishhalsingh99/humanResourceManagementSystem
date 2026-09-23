import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().trim().optional(),
  department_name: z.string().trim().optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.name?.trim() && !data.department_name?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'Department name is required' });
  }
});
