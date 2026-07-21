import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Check HTTP-only cookie first
  if (req.cookies && req.cookies.jwtToken) {
    token = req.cookies.jwtToken;
  } 
  // 2. Fallback to Authorization Bearer header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no session token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lcp_secret_key_123456');

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found, authorization denied' });
    }
    
    if (req.user.status === 'Inactive') {
      return res.status(403).json({ message: 'Your account is deactivated. Please contact admin.' });
    }

    next();
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return res.status(401).json({ message: 'Not authorized, session expired or invalid' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user ? req.user.role : 'Guest'}) is not authorized to access this resource` 
      });
    }
    next();
  };
};
