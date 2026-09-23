export const hasPermission = (user, permissionKey) => {
  if (!user || !permissionKey) return false;
  if (user.role === 'SUPER_ADMIN' || user.role === 'admin') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permissionKey);
};

export const hasAnyPermission = (user, permissionKeys = []) =>
  permissionKeys.some((permissionKey) => hasPermission(user, permissionKey));
