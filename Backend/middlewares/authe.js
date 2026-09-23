// Authentication middleware
import '../config/env.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '92291ecfad41847a32ae1e6b5df07d2fbe19a2857bece68e15f9f770093fff30e1c116384619d9cdf50cf07469c8eff564d24799ee7257ed872073a5e2d429bf';

const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  next();
};

// Generate token
const generateToken = (users) => {
  return jwt.sign(
    { id: users.id, email: users.email, role: users.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export { authMiddleware, authorizeRoles, generateToken, JWT_SECRET };