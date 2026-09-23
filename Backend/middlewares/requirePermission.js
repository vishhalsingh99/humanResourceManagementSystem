import Role from '../repositories/role.repository.js';
import { COMPANY_ADMIN_PERMISSIONS } from '../config/rbac.js';

const permissionCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

const getCacheKey = (tenantDatabase, roleId) => `${tenantDatabase || 'master'}:${roleId}`;

const loadPermissions = async (req) => {
  if (req.user?.role === 'SUPER_ADMIN') return COMPANY_ADMIN_PERMISSIONS;
  if (req.user?.role === 'admin') return COMPANY_ADMIN_PERMISSIONS;

  let roleId = req.user?.roleId || req.user?.role_id;
  if (!roleId && req.user?.role === 'employee') {
    const employeeRole = await Role.findEmployeeRole();
    roleId = employeeRole?.id;
  }
  if (!roleId) return [];

  const cacheKey = getCacheKey(req.user?.tenantDatabase || req.user?.tenant_database, roleId);
  const cached = permissionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.permissions;

  const permissions = await Role.getPermissions(roleId);
  permissionCache.set(cacheKey, {
    permissions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return permissions;
};

const clearPermissionCache = () => permissionCache.clear();

const requirePermission = (permissionKey) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const permissions = await loadPermissions(req);
    req.user.permissions = permissions;

    if (!permissions.includes(permissionKey)) {
      return res.status(403).json({
        message: "You don't have permission to perform this action",
        error: "You don't have permission to perform this action",
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAnyPermission = (permissionKeys = []) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const permissions = await loadPermissions(req);
    req.user.permissions = permissions;

    if (!permissionKeys.some((permissionKey) => permissions.includes(permissionKey))) {
      return res.status(403).json({
        message: "You don't have permission to perform this action",
        error: "You don't have permission to perform this action",
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export {
  requirePermission,
  requireAnyPermission,
  loadPermissions,
  clearPermissionCache,
};