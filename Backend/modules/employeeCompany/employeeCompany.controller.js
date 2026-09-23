import { asyncHandler } from '../../utils/asyncHandler.js';
import { getCompanyInformationService } from './employeeCompany.service.js';

export const getCompanyInformation = asyncHandler(async (req, res) => {
  res.status(200).json(await getCompanyInformationService());
});
