import { db } from '../config/db.js';
import AppError from '../utils/appError.js';


// Enroll a student in a published course
export const enrollInCourse = async (studentId, courseId) => {
    const course = await db.course.findUnique({
        where: { id: parseInt(courseId) },
    });

    if (!course) {
        throw new AppError('Course not found.', 404);
    }

    if (!course.isPublished) {
        throw new AppError('Access denied. You cannot enroll in a draft course.', 403);
    }

    const existingEnrollment = await db.enrollment.findUnique({
        where: {
            studentId_courseId: {
                studentId,
                courseId: course.id,
            },
        },
    });

    if (existingEnrollment) {
        throw new AppError('You are already enrolled in this course.', 400);
    }

    // Create the enrollment
    return await db.enrollment.create({
        data: {
            studentId,
            courseId: course.id,
        },
    });
};

/**
 * Marks a lesson as complete for an enrolled student.
 * Enforces Sequential Locking: Students cannot skip ahead.
 */
export const completeLesson = async (studentId, lessonId) => {
    // Fetch the target lesson, its module ID, orderIndex, and parent course ID
    const lesson = await db.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        include: {
            module: {
                select: { 
                    id: true,
                    courseId: true 
                },
            },
        },
    });

    if (!lesson) {
        throw new AppError('Lesson not found.', 404);
    }

    const courseId = lesson.module.courseId;

    // Verify active enrollment
    const enrollment = await db.enrollment.findUnique({
        where: {
            studentId_courseId: {
                studentId,
                courseId,
            },
        },
    });

    if (!enrollment) {
        throw new AppError(
            'Access denied. You must be enrolled in this course to complete its lessons.',
            403
        );
    }

    // Sequential Locking Check
    // If this is NOT the first lesson of the module (orderIndex > 1),
    // they must complete the previous lesson first.
    if (lesson.orderIndex > 1) {
        // Query the database to find the lesson immediately preceding this one
        const previousLesson = await db.lesson.findFirst({
            where: {
                moduleId: lesson.moduleId,
                orderIndex: lesson.orderIndex - 1,
            },
        });

        // If a preceding lesson exists, verify that the student has completed it
        if (previousLesson) {
            const previousProgress = await db.lessonProgress.findUnique({
                where: {
                    enrollmentId_lessonId: {
                        enrollmentId: enrollment.id,
                        lessonId: previousLesson.id,
                    },
                },
            });

            // If no completion record is found, block the transaction
            if (!previousProgress) {
                throw new AppError(
                    `Access denied. You must complete the previous lesson "${previousLesson.title}" before starting this one.`,
                    400
                );
            }
        }
    }

    // Check if this lesson has already been completed (prevent duplicate database logs)
    const existingProgress = await db.lessonProgress.findUnique({
        where: {
            enrollmentId_lessonId: {
                enrollmentId: enrollment.id,
                lessonId: lesson.id,
            },
        },
    });

    if (existingProgress) {
        return existingProgress; // Return existing record
    }

    // Create the lesson progress record
    return await db.lessonProgress.create({
        data: {
            enrollmentId: enrollment.id,
            lessonId: lesson.id,
            isCompleted: true,
        },
    });
};

// Calculate and retrieve the student's dynamic progress metadata for a course
export const getCourseProgress = async (studentId, courseId) => {
    // Verify active enrollment
    const enrollment = await db.enrollment.findUnique({
        where: {
            studentId_courseId: {
                studentId: parseInt(studentId),
                courseId: parseInt(courseId),
            },
        },
    });

    if (!enrollment) {
        throw new AppError('Access denied. You are not enrolled in this course.', 403);
    }

    // Execute parallel queries for aggregate calculations (Performance Optimization)
    const [totalLessons, completedRecords] = await Promise.all([
        // Count total lessons in this course
        db.lesson.count({
            where: {
                module: {
                    courseId: enrollment.courseId,
                },
            },
        }),
        // Fetch all completed lessons for this enrollment
        db.lessonProgress.findMany({
            where: {
                enrollmentId: enrollment.id,
                isCompleted: true,
            },
            select: {
                lessonId: true,
            },
        }),
    ]);

    const completedLessonsCount = completedRecords.length;
    const completedLessonIds = completedRecords.map((record) => record.lessonId);

    // Mathematically compute progress (protect against division-by-zero if course has no lessons yet)
    let progressPercentage = 0.0;
    if (totalLessons > 0) {
        const rawPercentage = (completedLessonsCount / totalLessons) * 100;
        progressPercentage = Math.round(rawPercentage * 100) / 100; // Round up to 2 decimal places
    }

    return {
        progressPercentage,
        totalLessons,
        completedLessonsCount,
        completedLessonIds,
    };
};
