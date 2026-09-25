import { z } from 'zod';

export const meetingSchema = z.object({
  employee: z.union([z.string(), z.number()]).optional(),
  organizer: z.union([z.string(), z.number()]).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled']).optional().default('Scheduled'),
  notes: z.string().optional(),
  title: z.string().trim().optional(),
  location: z.string().trim().optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.employee) {
    ctx.addIssue({ code: 'custom', message: 'Employee is required', path: ['employee'] });
  }
  if (!data.organizer) {
    ctx.addIssue({ code: 'custom', message: 'Organizer is required', path: ['organizer'] });
  }
  if (!data.date) {
    ctx.addIssue({ code: 'custom', message: 'Date is required', path: ['date'] });
  }
  if (!data.time) {
    ctx.addIssue({ code: 'custom', message: 'Time is required', path: ['time'] });
  }
});
