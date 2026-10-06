import * as authService from '../services/auth.service.js';
import AppError from '../utils/appError.js';


// Handle HTTP requests for user registration.
export const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            throw new AppError('All fields (name, email, password, role) are required.', 422);
        }

        if (password.length < 8) {
            throw new AppError('Password must be at least 8 characters long.', 422);
        }

        const normalizedRole = role.toUpperCase();
        if (normalizedRole !== 'STUDENT' && normalizedRole !== 'INSTRUCTOR') {
            throw new AppError('Role must be either STUDENT or INSTRUCTOR', 422);
        }

        const result = await authService.registerUser(name, email, password, normalizedRole);
        res.status(201).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// Handle HTTP requests for user login
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new AppError('Email and password are required.', 400);
        }

        const result = await authService.loginUser(email, password);

        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
