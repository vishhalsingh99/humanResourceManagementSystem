import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getRolesService,
  getRoleService,
  createRoleService,
  updateRoleService,
  deleteRoleService,
  getRolePermissionsService,
  updateRolePermissionsService,
  assignEmployeeRoleService,
} from './roles.service.js';

export const getRoles = asyncHandler(async (req, res) => {
  res.json(await getRolesService());
});

export const getRole = asyncHandler(async (req, res) => {
  res.json(await getRoleService(req.params.id));
});

export const createRole = asyncHandler(async (req, res) => {
  res.status(201).json(await createRoleService(req.user, req.body));
});

export const updateRole = asyncHandler(async (req, res) => {
  res.json(await updateRoleService(req.user, req.params.id, req.body));
});

export const deleteRole = asyncHandler(async (req, res) => {
  res.json(await deleteRoleService(req.user, req.params.id));
});

export const getRolePermissions = asyncHandler(async (req, res) => {
  res.json(await getRolePermissionsService(req.params.id));
});

export const updateRolePermissions = asyncHandler(async (req, res) => {
  res.json(await updateRolePermissionsService(req.user, req.params.id, req.body));
});

export const assignEmployeeRole = asyncHandler(async (req, res) => {
  res.json(await assignEmployeeRoleService(req.user, req.params.id, req.body));
});
