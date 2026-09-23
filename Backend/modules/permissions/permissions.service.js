import Permission from './permissions.repository.js';
import Role from '../../repositories/role.repository.js';

export const getPermissionsService = async () => {
  await Role.ensureDefaults();
  return Permission.findAll();
};
