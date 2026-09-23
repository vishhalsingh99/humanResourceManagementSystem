import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getDepartmentsService,
  createDepartmentService,
  updateDepartmentService,
  deleteDepartmentService,
} from './departments.service.js';

export const getDepartments = asyncHandler(async (req, res) => {
  res.json(await getDepartmentsService());
});

export const createDepartment = asyncHandler(async (req, res) => {
  res.status(201).json(await createDepartmentService(req.body));
});

export const updateDepartment = asyncHandler(async (req, res) => {
  res.json(await updateDepartmentService(req.params.id, req.body));
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  res.json(await deleteDepartmentService(req.params.id));
});
