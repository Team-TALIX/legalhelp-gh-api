// middlewares/roleAuth.js

/**
 * Middleware to require certain user roles for access.
 * @param {string[]} allowedRoles - Array of roles that are allowed to access the route.
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      // This should ideally be caught by authenticateToken middleware first
      return res.status(401).json({ message: 'Authentication required. No user session found.' });
    }

    const { role } = req.user;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: `Forbidden. User role '${role}' is not authorized for this resource.` });
    }

    next();
  };
};

// Specific role requirement middlewares for convenience
export const requireAdmin = requireRole(['admin']);
export const requirePaidUser = requireRole(['paid_user', 'admin']); // Admins can do what paid users can
export const requireAnyUser = requireRole(['user', 'paid_user', 'admin']); // Any authenticated user

/**
 * Middleware to check if the authenticated user owns the resource or is an admin.
 * Assumes req.params contains the ID of the resource (e.g., req.params.userId, req.params.storyId)
 * and the resource model has a 'user' or 'userId' field.
 * This is a generic example and might need adjustment based on actual data models.
 */
// export const requireOwnerOrAdmin = (model, idParamName = 'id', userField = 'user') => {
//   return async (req, res, next) => {
//     if (!req.user) {
//       return res.status(401).json({ message: 'Authentication required.' });
//     }

//     try {
//       const resource = await model.findById(req.params[idParamName]);
//       if (!resource) {
//         return res.status(404).json({ message: 'Resource not found.' });
//       }

//       // Check if the user is the owner (assuming userField stores ObjectId)
//       const ownerId = resource[userField]?.toString();
//       const currentUserId = req.user._id?.toString();

//       if (ownerId === currentUserId || req.user.role === 'admin') {
//         return next(); // Allowed
//       }

//       return res.status(403).json({ message: 'Forbidden. You do not own this resource and are not an admin.' });
//     } catch (error) {
//       console.error('Error in requireOwnerOrAdmin middleware:', error);
//       return res.status(500).json({ message: 'Server error during authorization check.' });
//     }
//   };
// };
