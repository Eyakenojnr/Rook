import { Router } from 'express';
import * as quizController from '../controllers/quiz.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';


const router = Router();

/**
 * @route   POST /api/v1/lessons/:lessonId/quizzes
 * @desc    Create a quiz for a lesson
 * @access  Private (Course Owner Instructor only)
 */
router.post(
    '/lessons/:lessonId/quizzes',
    protect,
    restrictTo('INSTRUCTOR'),
    quizController.createQuiz
);

/**
 * @route   POST /api/v1/quizzes/:quizId/questions
 * @desc    Add a multiple-choice question (2, 4, or 5 options) to a quiz
 * @access  Private (Course Owner Instructor only)
 */
router.post(
    '/quizzes/:quizId/questions',
    protect,
    restrictTo('INSTRUCTOR'),
    quizController.addQuestionToQuiz
);

/**
 * @route   GET /api/v1/lessons/:lessonId/quiz
 * @desc    Retrieve a lesson's quiz (strips answers for students)
 * @access  Private (Enrolled Student or Course Instructor)
 */
router.get(
    '/lessons/:lessonId/quiz',
    protect,
    quizController.getQuizForLesson
);

/**
 * @route   POST /api/v1/quizzes/:quizId/submit
 * @desc    Submit answers for server-side grading and record attempt
 * @access  Private (Enrolled Students only)
 */
router.post(
    '/quizzes/:quizId/submit',
    protect,
    restrictTo('STUDENT'),
    quizController.submitQuiz
);

export default router;