import Role from '../../repositories/role.repository.js';
import User from '../../repositories/user.repository.js';
import Employee from '../../repositories/employee.repository.js';
import { clearPermissionCache } from '../../middlewares/requirePermission.js';
import { ApiError } from '../../utils/ApiError.js';

const isCompanyAdmin = (authUser) => authUser?.role === 'admin';

const normalizePermissions = (permissions = []) => (
  Array.isArray(permissions)
    ? permissions.map((permission) => String(permission || '').trim()).filter(Boolean)
    : []
);

export const getRolesService = () => Role.findAll();

export const getRoleService = async (id) => {
  const role = await Role.findById(id);
  if (!role) throw new ApiError(404, 'Role not found');
  return role;
};

export const createRoleService = async (authUser, body) => {
  if (!isCompanyAdmin(authUser)) {
    throw new ApiError(403, 'Only company admins can create roles');
  }

  const role = await Role.create({
    name: body.name.trim(),
    description: String(body.description || '').trim(),
    permissions: normalizePermissions(body.permissions),
    createdBy: authUser.id,
  });
  clearPermissionCache();
  return role;
};

export const updateRoleService = async (authUser, id, body) => {
  if (!isCompanyAdmin(authUser)) {
    throw new ApiError(403, 'Only company admins can update roles');
  }

  const role = await Role.update(id, {
    name: body.name.trim(),
    description: String(body.description || '').trim(),
    permissions: normalizePermissions(body.permissions),
  });
  clearPermissionCache();
  return role;
};

export const deleteRoleService = async (authUser, id) => {
  if (!isCompanyAdmin(authUser)) {
    throw new ApiError(403, 'Only company admins can delete roles');
  }

  await Role.delete(id);
  clearPermissionCache();
  return { message: 'Role deleted' };
};

export const getRolePermissionsService = async (id) => {
  const role = await Role.findById(id);
  if (!role) throw new ApiError(404, 'Role not found');
  return Role.getPermissionDetails(id);
};

export const updateRolePermissionsService = async (authUser, id, body) => {
  if (!isCompanyAdmin(authUser)) {
    throw new ApiError(403, 'Only company admins can update role permissions');
  }

  const role = await Role.findById(id);
  if (!role) throw new ApiError(404, 'Role not found');
  if (role.isSystem) throw new ApiError(403, 'Protected system roles cannot be modified');

  await Role.update(id, {
    name: role.name,
    description: role.description,
    permissions: normalizePermissions(body.permissions),
  });
  clearPermissionCache();
  return Role.findById(id);
};

export const assignEmployeeRoleService = async (authUser, employeeId, body) => {
  if (!isCompanyAdmin(authUser)) {
    throw new ApiError(403, 'Only company admins can assign roles');
  }

  const tenantId = authUser?.tenantId || authUser?.tenant_id;
  const roleId = Number(body?.roleId || body?.role_id);
  if (!tenantId) throw new ApiError(428, 'Company onboarding is required before assigning roles');
  if (!Number.isFinite(roleId) || roleId <= 0) throw new ApiError(400, 'Valid roleId is required');

  const employee = await Employee.findById(employeeId);
  if (!employee) throw new ApiError(404, 'Employee not found');

  const role = await Role.findById(roleId);
  if (!role) throw new ApiError(404, 'Role not found');

  const updated = await User.assignRoleToEmployee(employeeId, tenantId, roleId);
  if (!updated) throw new ApiError(404, 'Employee login account not found');

  clearPermissionCache();
  return { message: 'Employee role assigned', employeeId: Number(employeeId), role };
};
