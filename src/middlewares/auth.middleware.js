import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';


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

        if (!token) {
            res.status(401);  // Unauthorized
            throw new Error('Not authorized. No session token provided.');
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
            res.status(401);
            throw new Error('The user belonging to this token no longer exists.');
        }

        req.user = currentUser;
        next();
    } catch (error) {
        // Handling of specific JWT errors
        if (error.name === 'TokenExpiredError') {
            res.status(401);
            return next(new Error('Your session has expired. Please log in again.'));
        }
        if (error.name === 'JsonWebTokenError') {
            res.status(401);
            return next(new Error('Invalid session token. Authentication failed.'));
        }

        next(error);
    }
};
