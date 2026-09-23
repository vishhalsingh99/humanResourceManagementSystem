import { Router } from 'express';
import {
  getPayrolls,
  createPayroll,
  updatePayroll,
  deletePayroll,
} from './payroll.controller.js';
import { authMiddleware } from '../../middlewares/authe.js';
import { requirePermission } from '../../middlewares/requirePermission.js';
import { validate } from '../../middlewares/validate.js';
import { createPayrollSchema } from './payroll.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('payroll.view_all'), getPayrolls);
router.post('/', requirePermission('payroll.generate'), validate(createPayrollSchema), createPayroll);
router.put('/:id', requirePermission('payroll.edit'), updatePayroll);
router.delete('/:id', requirePermission('payroll.delete'), deletePayroll);

export default router;
