import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { db } from "../config/db.js";


// Helper function to sign a secure JWT
const generateToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET || 'gibberish_secret_key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
};

// Handle user registration business logic
export const registerUser = async (name, email, password, role) => {
    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error("An account with this email already exists.");
    }

    // Hash password using standard 12 salt rounds
    const passwordHash = await becrypt.hash(password, 12);

    // Save new user record
    const newUser = await db.user.create({
        data: {
            name,
            email,
            passwordHash,
            role,
        },
    });

    // Generate a session token & exclude passwordHash from the returned user object
    const token = generateToken(newUser.id, newUser.role);
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return { user: userWithoutPassword, token };
};

// Handle user login and credential verification logic
export const loginUser = async (email, password) => {
    // Find the user via email
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error("Invalid email or password.");
    }

    // Verify password against the stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new Error("Invalid email or password.");
    }

    const token = generateToken(user.id, user.role);
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
};
