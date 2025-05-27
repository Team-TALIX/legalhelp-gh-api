import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Assuming User model might be needed
import { JWT_SECRET } from '../utils/config.js'; // Assuming JWT_SECRET is in config

// Middleware to authenticate a token
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // If no token, treat as anonymous or deny access depending on route requirements
    // For now, let's assume some routes might allow anonymous access if optionalAuth is not used
    // If strict authentication is required, send 401 or 403
    // return res.status(401).json({ message: 'Access token is missing or invalid.' });
    req.user = null; // Or some indicator of anonymous user
    return next(); // Proceed, route handler will decide if user is required
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach user to request object. You might want to fetch full user details
    // req.user = await User.findById(decoded.id).select('-password'); // Example if ID is in token
    req.user = decoded; // Or just attach the decoded payload

    if (!req.user) {
      // This case might happen if token is valid but user doesn't exist (e.g. deleted)
      // return res.status(401).json({ message: 'User not found.' });
      req.user = null; // Treat as anonymous or invalid
    }
    next();
  } catch (error) {
    // console.error('JWT Error:', error.message);
    if (error.name === 'TokenExpiredError') {
      // return res.status(401).json({ message: 'Token expired.' });
    }
    // return res.status(403).json({ message: 'Token is not valid.' });
    req.user = null; // Invalid token, treat as anonymous
    next(); // Allow processing to continue; specific routes can check req.user
  }
};

// Middleware for optional authentication
// If token exists and is valid, req.user is populated. Otherwise, req.user is null.
// This allows routes to behave differently for authenticated vs. anonymous users.
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null; // No token, definitely anonymous
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // req.user = await User.findById(decoded.id).select('-password'); // Example
    req.user = decoded; // Attach decoded payload

    if (!req.user) {
      req.user = null; // User not found for token
    }
  } catch (error) {
    // console.error('Optional Auth JWT Error:', error.message);
    req.user = null; // Token invalid or expired, treat as anonymous
  }
  next();
};

// Placeholder for role-based access control if needed later
// export const authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!req.user || !roles.includes(req.user.role)) {
//       return res.status(403).json({ message: 'Forbidden: You do not have the right role.' });
//     }
//     next();
//   };
// };
