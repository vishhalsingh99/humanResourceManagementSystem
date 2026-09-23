// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.users) {
      return res.status(401).json({ error: 'Authentication required' });
    } 

    if (!roles.includes(req.users.role)) {
      return res.status(403).json({
        error: 'Access denied. You do not have permission to perform this action.'
      });
    }

    next();
  };
};

export { authorize };