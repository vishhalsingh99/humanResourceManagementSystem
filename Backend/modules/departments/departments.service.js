import Department from './departments.repository.js';
import { ApiError } from '../../utils/ApiError.js';

export const getDepartmentsService = () => Department.findAll();

export const createDepartmentService = (body) => Department.create(body);

export const updateDepartmentService = async (id, body) => {
  const department = await Department.findById(id);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }
  return Department.update(id, body);
};

export const deleteDepartmentService = async (id) => {
  const department = await Department.findById(id);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }
  await Department.delete(id);
  return { message: 'Department deleted' };
};
