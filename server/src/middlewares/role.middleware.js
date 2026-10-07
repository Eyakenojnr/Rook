import AppError from "../utils/appError.js";


/**
 * Role-Based Access Control (RBAC) Guard Middleware
 * Enforces route-specific permission restrictions based on roles
 * @param {...string} allowedRoles - List of roles permitted
 */
export const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(
                new AppError('Role authorization guard was executed without authentication context.', 500)
            );
        }

        // Enforce role restriction
        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Access denied. Only ${allowedRoles.join(' or ')} can perform this action.`,
                    403
                )
            );
        }

        next();
    };
};