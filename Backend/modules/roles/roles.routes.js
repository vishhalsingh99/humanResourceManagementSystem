import { Router } from 'express';
import {
  getRoles,
  createRole,
  getRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
} from './roles.controller.js';
import { requirePermission } from '../../middlewares/requirePermission.js';
import { validate } from '../../middlewares/validate.js';
import { roleSchema, updateRolePermissionsSchema } from './roles.schema.js';

const router = Router();

router.get('/', requirePermission('settings.view'), getRoles);
router.post('/', requirePermission('settings.edit'), validate(roleSchema), createRole);
router.get('/:id', requirePermission('settings.view'), getRole);
router.put('/:id', requirePermission('settings.edit'), validate(roleSchema), updateRole);
router.delete('/:id', requirePermission('settings.edit'), deleteRole);
router.get('/:id/permissions', requirePermission('settings.view'), getRolePermissions);
router.put('/:id/permissions', requirePermission('settings.edit'), validate(updateRolePermissionsSchema), updateRolePermissions);

export default router;
