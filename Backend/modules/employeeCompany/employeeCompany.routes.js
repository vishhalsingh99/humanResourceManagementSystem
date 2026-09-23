import { Router } from 'express';
import { authorizeRoles } from '../../middlewares/authe.js';
import { getCompanyInformation } from './employeeCompany.controller.js';

const router = Router();

router.get('/company-information', authorizeRoles('employee'), getCompanyInformation);

export default router;
