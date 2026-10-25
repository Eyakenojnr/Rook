import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';


const router = Router();

// All profile operations require authentication
router.use(protect);

router.get('/me/profile', userController.getProfile);
router.patch('/change-password', userController.changePassword);

export default router;