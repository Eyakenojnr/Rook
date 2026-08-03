import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';


const router = Router();

/**
 * @route POST  /api/v1/auth/register
 * @desc  Register a new student or instructor
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route  POST /api/v1/auth/login
 * @desc  Authenticate user and get JWT token
 * @access  Public
 */
router.post('/login', authController.login);

export default router;
