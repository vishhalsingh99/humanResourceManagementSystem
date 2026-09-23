import { z } from 'zod';

export const createAttendanceSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  employee_id: z.union([z.string(), z.number()]).optional(),
  date: z.union([z.string(), z.number()]).optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!(data.employeeId || data.employee_id) || !data.date) {
    ctx.addIssue({ code: 'custom', message: 'Employee and date are required' });
  }
});

export const getEmployeesForAttendanceDateSchema = z.object({
  date: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.date) {
    ctx.addIssue({ code: 'custom', message: 'Attendance date is required' });
  }
});
