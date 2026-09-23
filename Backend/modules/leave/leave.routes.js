import { Router } from 'express';
import {
  getLeaves,
  getLeaveBalance,
  getCarryForwardHistory,
  saveCarryForward,
  getLeavesByEmployee,
  createLeave,
  updateLeave,
  deleteLeave,
} from './leave.controller.js';
import { requirePermission, requireAnyPermission } from '../../middlewares/requirePermission.js';

const router = Router();

router.get('/', requireAnyPermission(['leave.view', 'leave.view_all']), getLeaves);
router.get('/balance/:employee_id', requireAnyPermission(['leave.view', 'leave.view_all']), getLeaveBalance);
router.get('/carry-forward/:employee_id', requireAnyPermission(['leave.view', 'leave.view_all']), getCarryForwardHistory);
router.put('/carry-forward/:employee_id', requirePermission('settings.edit'), saveCarryForward);
router.get('/employee/:employee_id', requireAnyPermission(['leave.view', 'leave.view_all']), getLeavesByEmployee);
router.post('/', requirePermission('leave.apply'), createLeave);
router.put('/:id', updateLeave);
router.delete('/:id', requirePermission('leave.delete'), deleteLeave);

export default router;
