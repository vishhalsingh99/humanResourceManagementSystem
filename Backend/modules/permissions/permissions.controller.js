import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPermissionsService } from './permissions.service.js';

export const getPermissions = asyncHandler(async (req, res) => {
  res.json(await getPermissionsService());
});
