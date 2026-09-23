import { Router } from 'express';
import {
  getCompanySettings,
  updateCompanySettings,
  listPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  listRules,
  createRule,
  updateRule,
  deleteRule,
} from './settings.controller.js';
import { requirePermission } from '../../middlewares/requirePermission.js';
import { validate } from '../../middlewares/validate.js';
import { companySettingsSchema, policySchema, ruleSchema } from './settings.schema.js';

const router = Router();

router.get('/company', requirePermission('settings.view'), getCompanySettings);
router.put('/company', requirePermission('settings.edit'), validate(companySettingsSchema), updateCompanySettings);
router.get('/policies', requirePermission('settings.view'), listPolicies);
router.post('/policies', requirePermission('settings.edit'), validate(policySchema), createPolicy);
router.put('/policies/:id', requirePermission('settings.edit'), validate(policySchema), updatePolicy);
router.delete('/policies/:id', requirePermission('settings.edit'), deletePolicy);
router.get('/rules', requirePermission('settings.view'), listRules);
router.post('/rules', requirePermission('settings.edit'), validate(ruleSchema), createRule);
router.put('/rules/:id', requirePermission('settings.edit'), validate(ruleSchema), updateRule);
router.delete('/rules/:id', requirePermission('settings.edit'), deleteRule);

export default router;
