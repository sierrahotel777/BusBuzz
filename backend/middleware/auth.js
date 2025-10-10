const jwt = require('jsonwebtoken');

/**
 * Express middleware to verify the JWT and enforce role-based access control.
 * It reads the token from the 'Authorization' header.
 * * @param {string[] | string} roles - An array of roles (e.g., ['admin', 'staff']) allowed to access the route.
 * @returns {function} Express middleware function.
 */
const authMiddleware = (roles = []) => {
  // Ensure 'roles' is always an array for easier checking
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // 1. Extract the token from the 'Authorization: Bearer <token>' header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      // If no token is present, access is denied (401 Unauthorized)
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
      // 2. Verify and decode the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach the decoded user payload (userId, role) to the request object
      req.user = decoded; 
      
      // 3. Role-based Authorization check
      if (roles.length && !roles.includes(req.user.role)) {
        // If the user's role is not in the allowed list, access is denied (403 Forbidden)
        return res.status(403).json({ message: 'Access denied. Insufficient privileges.' });
      }

      // If the token is valid and authorized, proceed to the route handler
      next();
    } catch (error) {
      // If verification fails (e.g., token is expired or tampered with)
      res.status(401).json({ message: 'Invalid token.' });
    }
  };
};

module.exports = authMiddleware;