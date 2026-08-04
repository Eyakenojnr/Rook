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

// Mark a lesson as complete for an enrolled student
export const completeLesson = async (studentId, lessonId) => {
    const lesson = await db.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        include: {
            module: {
                select: { courseId: true },
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
        throw new AppError('Access denied. You must be enrolled in this course to complete its lessons.', 403);
    }

    // Check if this lesson has already been completed (avoid duplicate progress records)
    const existingProgress = await db.lessonProgress.findUnique({
        where: {
            enrollmentId_lessonId: {
                enrollmentId: enrollment.id,
                lessonId: lesson.id,
            },
        },
    });

    if (existingProgress) {
        return existingProgress; // Return already completed record
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
