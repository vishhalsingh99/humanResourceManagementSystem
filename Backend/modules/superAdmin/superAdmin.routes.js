import { Router } from 'express';
import superAdminAuth from '../../middlewares/superAdminAuth.js';
import {
  getDashboard,
  getCompanies,
  getCompany,
  updateCompanyStatus,
  deleteCompany,
  impersonateCompanyAdmin,
  updateSubscription,
  getAuditLogs,
  getGlobalSettings,
  updateGlobalSettings,
} from './superAdmin.controller.js';
import { validate } from '../../middlewares/validate.js';
import { updateCompanyStatusSchema, updateSubscriptionSchema } from './superAdmin.schema.js';

const router = Router();

router.use(superAdminAuth);

router.get('/dashboard', getDashboard);
router.get('/companies', getCompanies);
router.get('/companies/:id', getCompany);
router.patch('/companies/:id/status', validate(updateCompanyStatusSchema), updateCompanyStatus);
router.delete('/companies/:id', deleteCompany);
router.post('/companies/:id/impersonate', impersonateCompanyAdmin);
router.put('/companies/:id/subscription', validate(updateSubscriptionSchema), updateSubscription);
router.get('/audit-logs', getAuditLogs);
router.get('/settings', getGlobalSettings);
router.put('/settings', updateGlobalSettings);

export default router;
