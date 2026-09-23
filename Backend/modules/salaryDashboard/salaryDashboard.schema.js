import { z } from 'zod';

export const generateMonthlyPayrollSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  employee_id: z.union([z.string(), z.number()]).optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!(data.employeeId || data.employee_id)) {
    ctx.addIssue({ code: 'custom', message: 'Employee is required' });
  }
});
