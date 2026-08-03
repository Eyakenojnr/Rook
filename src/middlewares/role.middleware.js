/**
 * Role-Based Access Control (RBAC) Guard Middleware
 * Enforces route-specific permission restrictions based on roles
 * @param {...string} allowedRoles - List of roles permitted
 */
export const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(500);  // Internal Server Error
            return next(new Error('Role authorization guard was executed without authentication context.'));
        }

        // Enforce role restriction
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403);  // Forbidden (authenticated but does not have permission)
            return next(
                new Error(`Access denied. Only ${allowedRoles.join(' or ')} can perform this action.`)
            );
        }

        next();
    };
};