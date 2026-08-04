import { Router } from 'express';
import * as progressController from '../controllers/progress.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';


const router = Router();

/**
 * @route  POST /api/v1/courses/:courseId/enroll
 * @desc  Enroll a student in a published course
 * @access Private (Students only)
 */
router.post(
    '/courses/:courseId/enroll',
    protect,
    restrictTo('STUDENT'),
    progressController.enrollInCourse
);

/**
 * @route  POST /api/v1/lessons/:lessonId/complete
 * @desc  Mark a specific lesson as complete for an enrolled student
 * @access  Private (Students only)
 */
router.post(
    '/lessons/:lessonId/complete',
    protect,
    restrictTo('STUDENT'),
    progressController.completeLesson
);

/**
 * @route  GET /api/v1/courses/:courseId/progress
 * @desc  Retrieve a student's course completion metrics and completed lesson IDs
 * @access  Private (Students only)
 */
router.get(
    '/courses/:courseId/progress',
    protect,
    restrictTo('STUDENT'),
    progressController.getCourseProgress
);

export default router;
