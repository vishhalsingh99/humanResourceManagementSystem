import { z } from 'zod';

export const updateCompanyStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended'], {
    message: 'Status must be active, inactive, or suspended',
  }),
});

export const updateSubscriptionSchema = z.object({
  planId: z.union([z.string(), z.number()]).optional(),
  status: z.enum(['active', 'inactive', 'cancelled'], {
    message: 'Subscription status must be active, inactive, or cancelled',
  }).default('active'),
}).superRefine((data, ctx) => {
  if (!data.planId) {
    ctx.addIssue({ code: 'custom', message: 'Subscription plan is required', path: ['planId'] });
  }
});
