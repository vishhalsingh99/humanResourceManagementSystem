import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './departments.controller.js';
import { validate } from '../../middlewares/validate.js';
import { departmentSchema } from './departments.schema.js';

const router = Router();

router.get('/', getDepartments);
router.post('/', validate(departmentSchema), createDepartment);
router.put('/:id', validate(departmentSchema), updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;
