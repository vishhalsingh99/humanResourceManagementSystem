import { Router } from 'express';
import {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from './designations.controller.js';
import { validate } from '../../middlewares/validate.js';
import { designationSchema } from './designations.schema.js';

const router = Router();

router.get('/', getDesignations);
router.post('/', validate(designationSchema), createDesignation);
router.put('/:id', validate(designationSchema), updateDesignation);
router.delete('/:id', deleteDesignation);

export default router;
