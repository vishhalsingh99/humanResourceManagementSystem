import express from 'express';
const router = express.Router();

// Import all route files
import authRoutes from './modules/auth/auth.routes.js';
import employeeRoutes from './modules/employees/employees.routes.js';
import leaveRoutes from './modules/leave/leave.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import meetingRoutes from './modules/meeting/meeting.routes.js';
import payrollRoutes from './modules/payroll/payroll.routes.js';
import salaryDashboardRoutes from './modules/salaryDashboard/salaryDashboard.routes.js';
import departmentRoutes from './modules/departments/departments.routes.js';
import designationRoutes from './modules/designations/designations.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import roleRoutes from './modules/roles/roles.routes.js';
import permissionRoutes from './modules/permissions/permissions.routes.js';
import locationRoutes from './modules/location/location.routes.js';
import superAdminRoutes from './modules/superAdmin/superAdmin.routes.js';
import employeeCompanyRoutes from './modules/employeeCompany/employeeCompany.routes.js';

import { authMiddleware } from './middlewares/authe.js';
import tenantContext from './middlewares/tenantContext.js';

// Use routes
router.use('/auth', authRoutes);
router.use('/super-admin', superAdminRoutes); 
router.use('/', authMiddleware, locationRoutes);
router.use('/employees', authMiddleware, tenantContext, employeeRoutes);
router.use('/leaves', authMiddleware, tenantContext, leaveRoutes);
router.use('/attendance', authMiddleware, tenantContext, attendanceRoutes);
router.use('/meetings', authMiddleware, tenantContext, meetingRoutes);
router.use('/payroll', authMiddleware, tenantContext, payrollRoutes);
router.use('/salary-dashboard', authMiddleware, tenantContext, salaryDashboardRoutes);
router.use('/settings', authMiddleware, tenantContext, settingsRoutes);
router.use('/roles', authMiddleware, tenantContext, roleRoutes);
router.use('/permissions', authMiddleware, tenantContext, permissionRoutes);
router.use('/employee', authMiddleware, tenantContext, employeeCompanyRoutes);
router.use('/departments', authMiddleware, tenantContext, departmentRoutes);
router.use('/designations', authMiddleware, tenantContext, designationRoutes);

export default router;