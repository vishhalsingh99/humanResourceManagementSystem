import { Router } from 'express';
import {
  getMySalaryDashboard,
  getEmployeeSalaryDashboard,
  getMonthlySalaryReport,
  generateMonthlyPayroll,
} from './salaryDashboard.controller.js';
import { authMiddleware } from '../../middlewares/authe.js';
import { requirePermission, requireAnyPermission } from '../../middlewares/requirePermission.js';
import { validate } from '../../middlewares/validate.js';
import { generateMonthlyPayrollSchema } from './salaryDashboard.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/me', requirePermission('payroll.view'), getMySalaryDashboard);
router.get('/employees/:employeeId', requireAnyPermission(['payroll.view', 'payroll.view_all']), getEmployeeSalaryDashboard);
router.get('/reports/monthly', requirePermission('reports.view'), getMonthlySalaryReport);
router.post('/payroll/generate', requirePermission('payroll.generate'), validate(generateMonthlyPayrollSchema), generateMonthlyPayroll);

export default router;
