import * as progressService from '../services/progress.service.js';


// Handle HTTP requests to enroll a student in a course
export const enrollInCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const newEnrollment = await progressService.enrollInCourse(studentId, courseId);

        res.status(201).json({
            status: 'success',
            data: { enrollment: newEnrollment },
        });
    } catch (error) {
        next(error);
    }
};

// Handle HTTP requests to mark a specific lesson as complete
export const completeLesson = async (req, res, next) => {
    try {
        const { lessonId } = req.params;
        const studentId = req.user.id;

        const progress = await progressService.completeLesson(studentId, lessonId);

        res.status(200).json({
            status: 'success',
            data: { progress },
        });
    } catch (error) {
        next(error);
    }
};

// Handles HTTP requests to retrieve a student's course progress metrics
export const getCourseProgress = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const progressMetrics = await progressService.getCourseProgress(studentId, courseId);

        res.status(200).json({
            status: 'success',
            data: progressMetrics,
        });
    } catch (error) {
        next(error);
    }
};