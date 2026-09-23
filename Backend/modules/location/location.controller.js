import { asyncHandler } from '../../utils/asyncHandler.js';
import { getStatesService, getDistrictsService } from './location.service.js';

export const getStates = asyncHandler(async (req, res) => {
  res.json(await getStatesService());
});

export const getDistricts = asyncHandler(async (req, res) => {
  res.json(await getDistrictsService(req.query.state_id));
});
