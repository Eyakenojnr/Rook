import { Router } from 'express';
import * as courseController from '../controllers/course.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';


const router = Router();

/**
 * @route  GET  /api/v1/courses
 * @desc  Get a paginated, filtered list of published courses
 * @access  Public
 */
router.get('/', courseController.getCourses);

/**
 * @route  GET  /api/v1/courses/:id
 * @desc  Get course syllabuls (hides lesson videos if not enrolled or not the instructor)
 * @access  Public (uses soft authentication inside the controller)
 */
router.get('/:id', courseController.getCourseById);

/**
 * @route  POST /api/v1/courses
 * @desc  Create a new course draft
 * @access  Private (Instructors only)
 */
router.post('/', protect, restrictTo('INSTRUCTOR'),
courseController.createCourse);

/**
 * @route  PUT /api/v1/courses/:id
 * @desc  Update course metadata
 * @access  Private (Instructor who owns this course only)
 */
router.put('/:id', protect, restrictTo('INSTRUCTOR'),
courseController.updateCourse);

/**
 * @route   PATCH /api/v1/courses/:id/publish
 * @desc    Toggle course between Draft and Published
 * @access  Private (Course owner Instructor only)
 */
router.patch(
    '/:id/publish',
    protect,
    restrictTo('INSTRUCTOR'),
    courseController.togglePublishedCourse
);

export default router;
