import { z } from 'zod';

export const createPayrollSchema = z.object({
  employee: z.union([z.string(), z.number()]).optional(),
  month: z.union([z.string(), z.number()]).optional(),
  year: z.union([z.string(), z.number()]).optional(),
  basic_salary: z.union([z.string(), z.number()]).optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.employee || !data.month || !data.year || !data.basic_salary) {
    ctx.addIssue({ code: 'custom', message: 'Employee, month, year, and basic salary are required' });
  }
});
