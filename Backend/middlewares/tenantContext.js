import User from '../repositories/user.repository.js';
import { withTenantDatabase } from '../config/databases.js';

const tenantContext = async (req, res, next) => {
  try {
    let tenantDatabase = req.user?.tenantDatabase || req.user?.tenant_database;

    if (!tenantDatabase && req.user?.id) {
      const user = await User.findById(req.user.id);
      tenantDatabase = user?.tenantDatabase || user?.tenant_database;
    }

    if (!tenantDatabase) {
      return res.status(428).json({ error: 'Company onboarding is required before using HR modules' });
    }

    return withTenantDatabase(tenantDatabase, () => next());
  } catch (error) {
    return next(error);
  }
};

export default tenantContext;