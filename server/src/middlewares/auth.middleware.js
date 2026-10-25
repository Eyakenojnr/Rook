import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import AppError from '../utils/appError.js';


/**
 * Authentication Guard Middleware
 * Inspect, extract, and verify JWT tokens from Authorization header
 */
export const protect = async (req, res, next) => {
    let token;

    try {
        // Check if Authorization header is present & formatted as "Bearer <token>"
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Fail early
        if (!token) {
            throw new AppError('Not authorized. No session token provided.', 401);
        }

        // Verify token signature
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const currentUser = await db.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        if (!currentUser) {
            throw new AppError('The user belonging to this token no longer exists.', 401);
        }

        req.user = currentUser;
        next();
    } catch (error) {
        // Handling of specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Your session has expired. Please log in again.', 401));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid session token. Authentication failed.', 401));
        }

        next(error);
    }
};
