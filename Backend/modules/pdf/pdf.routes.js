import { Router } from 'express';
import { employeeFormPage, employeesListPage, payslipPage } from './pdf.controller.js';
import { authMiddleware } from '../../middlewares/authe.js';
import tenantContext from '../../middlewares/tenantContext.js';
import { requirePermission, requireAnyPermission } from '../../middlewares/requirePermission.js';

const router = Router();

router.post('/employee-form', authMiddleware, tenantContext, requirePermission('employee.view'), employeeFormPage);
router.post('/employees-list', authMiddleware, tenantContext, requirePermission('employee.view'), employeesListPage);
router.get('/payslip/:employeeId', authMiddleware, tenantContext, requireAnyPermission(['payroll.view', 'payroll.view_all']), payslipPage);

export default router;
