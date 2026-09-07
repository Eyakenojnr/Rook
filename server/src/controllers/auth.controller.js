import * as authService from '../services/auth.service.js';


// Handle HTTP requests for user registration.
export const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            res.status(422);
            throw new Error('All fields (name, email, password, role) are required.');
        }

        if (password.length < 8) {
            res.status(422);
            throw new Error('Password must be at least 8 characters long.');
        }

        const normalizedRole = role.toUpperCase();
        if (normalizedRole !== 'STUDENT' && normalizedRole !== 'INSTRUCTOR') {
            res.status(422);
            throw new Error('Role must be either STUDENT or INSTRUCTOR');
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
            res.status(400);
            throw new Error('Email and password are required.');
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
