import * as authService from '../services/auth.service.js';
import AppError from '../utils/appError.js';


//Regex: allow letters, apostrophes, & hyphens only. Rejects numbers, commas, and symbols
const NAME_REGEX = /^[a-zA-Z'-]+$/;
const FULL_NAME_REGEX = /^[a-zA-Z\s'-]+$/;

// Handle HTTP requests for user registration.
export const register = async (req, res, next) => {
    try {
        const { name, firstName, lastName, otherName, email, password, role } = req.body;

        let sanitizedName = '';

        // Case A: 3-Field registration (frontend signup)
        if (firstName || lastName) {
            if (!firstName || !lastName) {
                throw new AppError('First name and last name are both required.', 422);
            }

            const trimmedFirst = firstName.trim();
            const trimmedLast = lastName.trim();
            const trimmedOther = otherName ? otherName.trim() : '';

            if (!NAME_REGEX.test(trimmedFirst)) {
                throw new AppError('First name must contain only letters, hyphens, or apostrophes (no symbols).', 422);
            }

            if (!NAME_REGEX.test(trimmedLast)) {
                throw new AppError('Last name must contain only letters, hyphens, or apostrophes (no symbols).', 422);
            }

            if (trimmedOther && !NAME_REGEX.test(trimmedOther)) {
                throw new AppError('Other name must contain only letters, hyphens, or apostrophes (no symbols).', 422);
            }

            // Store in database in lowercase
            sanitizedName = trimmedOther
                ? `${trimmedFirst} ${trimmedOther} ${trimmedLast}`.toLowerCase()
                :`${trimmedFirst} ${trimmedLast}`.toLowerCase();
        }
        // Case B: Single Name field (Backward compatible with test suites)
        else if (name) {
            const trimmedName = name.trim();
            if (!FULL_NAME_REGEX.test(trimmedName)) {
                throw new AppError('Name must contain only letters, spaces, hyphens, or apostrophes (no symbols).', 422);
            }
            sanitizedName = trimmedName.toLowerCase();
        } else {
            throw new AppError('Name fields are required.', 422);
        }

        if (!email || !password || !role) {
            throw new AppError('All fields (email, password, role) are required.', 422);
        }

        if (password.length < 8) {
            throw new AppError('Password must be at least 8 characters long.', 422);
        }

        const normalizedRole = role.toUpperCase();
        if (normalizedRole !== 'STUDENT' && normalizedRole !== 'INSTRUCTOR') {
            throw new AppError('Role must be either STUDENT or INSTRUCTOR', 422);
        }

        const result = await authService.registerUser(
            sanitizedName, 
            email.toLowerCase().trim(), 
            password, 
            normalizedRole
        );
        
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

/**
 * Handles user logout.
 * Stateless convention: Confirms session termination for API clients.
 */
export const logout = async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully.',
    });
};