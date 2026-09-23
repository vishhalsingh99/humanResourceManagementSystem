import { Router } from 'express';
import { getStates, getDistricts } from './location.controller.js';
import { validate } from '../../middlewares/validate.js';
import { getDistrictsSchema } from './location.schema.js';

const router = Router();

router.get('/states', getStates);
router.get('/districts', validate(getDistrictsSchema, 'query'), getDistricts);

export default router;
