import { z } from 'zod';
import { numericId } from '../../utils/zodHelpers.js';

export const getDistrictsSchema = z.object({
  state_id: numericId('Valid state_id is required'),
}).passthrough();
