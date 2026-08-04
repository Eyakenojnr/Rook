import { Router } from 'express';
import * as curriculumController from '../controllers/curriculum.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';

const router = Router();

/**
 * @route   POST /api/v1/courses/:courseId/modules
 * @desc    Create a new module inside a course
 * @access  Private (Instructor who owns this course only)
 */
router.post(
    '/courses/:courseId/modules',
    protect,
    restrictTo('INSTRUCTOR'),
    curriculumController.createModule
);

/**
 * @route   POST /api/v1/modules/:moduleId/lessons
 * @desc    Create a new lesson inside a module
 * @access  Private (Instructor who owns the parent course only)
 */
router.post(
    '/modules/:moduleId/lessons',
    protect,
    restrictTo('INSTRUCTOR'),
    curriculumController.createLesson
);

export default router;
