import { withTenantDatabase } from '../config/databases.js';

const tenantContext = async (req, res, next) => {
  try {
    return withTenantDatabase(null, () => next());
  } catch (error) {
    return next(error);
  }
};

export default tenantContext;