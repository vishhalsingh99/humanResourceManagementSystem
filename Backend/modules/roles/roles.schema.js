import { z } from 'zod';

const SUPER_ADMIN_NAME_PATTERN = /super\s*_?\s*admin/i;

export const roleSchema = z.object({
  name: z.string().trim().optional(),
  description: z.string().trim().optional(),
  permissions: z.array(z.any()).optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.name?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'Role name is required', path: ['name'] });
    return;
  }
  if (SUPER_ADMIN_NAME_PATTERN.test(data.name)) {
    ctx.addIssue({ code: 'custom', message: 'Company admins cannot create Super Admin roles', path: ['name'] });
  }
});

export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.any()).optional(),
}).passthrough();
