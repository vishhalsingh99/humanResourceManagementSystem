import { Router } from 'express';
import { getPermissions } from './permissions.controller.js';
import { requirePermission } from '../../middlewares/requirePermission.js';

const router = Router();

router.get('/', requirePermission('settings.view'), getPermissions);

export default router;
