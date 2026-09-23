import { authMiddleware, authorizeRoles } from './authe.js';

export default [
  authMiddleware,
  authorizeRoles('SUPER_ADMIN')
];
