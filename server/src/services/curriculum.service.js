import { db } from '../config/db.js';
import AppError from '../utils/appError.js';


/**
 * Create a new module within a course.
 * Enforces course ownership verification before insertion.
 */
export const createModule = async (courseId, instructorId, title, orderIndex) => {
    // Fetch the target course to verify existence and ownership
    const course = await db.course.findUnique({
        where: { id: parseInt(courseId) },
    });

    if (!course) {
        throw new AppError('Course not found.', 404);
    }

    // Strict ownership check
    if (course.instructorId !== instructorId) {
        throw new AppError('Access denied. You do not own this course.', 403);
    }

    // Create and return the new module
    return await db.module.create({
        data: {
            courseId: parseInt(courseId),
            title,
            orderIndex: parseInt(orderIndex),
        },
    });
};

/**
 * Create a new lesson inside a module.
 * Enforces deep course ownership verification.
 */
export const createLesson = async (moduleId, instructorId, lessonData) => {
    const { title, content, videoUrl, orderIndex } = lessonData;

    // Fetch the module and its parent course's owner ID in a single DB roundtrip
    const targetModule = await db.module.findUnique({
        where: { id: parseInt(moduleId) },
        include: {
            course: {
                select: {
                    instructorId: true,
                },
            },
        },
    });

    if (!targetModule) {
        throw new AppError('Module not found.', 404);
    }

    // Verify that the instructor requesting the write owns the parent course of this module
    if (targetModule.course.instructorId !== instructorId) {
        throw new AppError('Access denied. You do not own the parent course of this module.', 403);
    }

    // Create & return the new lesson
    return await db.lesson.create({
        data: {
            moduleId: parseInt(moduleId),
            title,
            content,
            videoUrl,
            orderIndex: parseInt(orderIndex),
        },
    });
};