import Designation from './designations.repository.js';
import { ApiError } from '../../utils/ApiError.js';

export const getDesignationsService = () => Designation.findAll();

export const createDesignationService = (body) => Designation.create(body);

export const updateDesignationService = async (id, body) => {
  const designation = await Designation.findById(id);
  if (!designation) {
    throw new ApiError(404, 'Designation not found');
  }
  return Designation.update(id, body);
};

export const deleteDesignationService = async (id) => {
  const designation = await Designation.findById(id);
  if (!designation) {
    throw new ApiError(404, 'Designation not found');
  }
  await Designation.delete(id);
  return { message: 'Designation deleted' };
};
