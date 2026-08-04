import AppError from '../utils/appError.js';
import { db } from '../config/db.js';


/**
 * Fetches a paginated list of published courses
 * Supports search filtering on course
 */
export const getCourses = async (page=1, limit=10, search='') => {
    const skip = (page - 1) * limit;

    const queryConditions = {
        isPublished: true,  // Only browse publicly published courses
    };

    if (search) {
        queryConditions.title = {
            contains: search,
            mode: 'insensitive',  // Implement PostgreSQL-specific case-insensitive search
        };
    }

    // Run data fetch and the total count concurrently (execute parallel queries for performance)
    const [courses, totalCourses] = await Promise.all([
        db.course.findMany({
            where: queryConditions,
            skip: parseInt(skip),
            take: parseInt(limit),
            select: {
                id: true,
                title: true,
                description: true,
                price: true,
                thumbnailUrl: true,
                instructor: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },  // Newest courses first
        }),
        db.course.count({ where: queryConditions }),
    ]);

    const totalPages = Math.ceil(totalCourses / limit);

    return {
        courses,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalCourses,
            totalPages,
        },
    };
};

// Fetch a single course and its complete, sorted modules and lessons syllabus
export const getCourseById = async (id) => {
    return await db.course.findUnique({
        where: { id: parseInt(id) },
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            isPublished: true,
            instructor: {
                select: {
                    id: true,
                    name: true,
                },
            },
            modules: {
                orderBy: { orderIndex: 'asc' },  // Ensures modules are sorted chronologically
                select: {
                    id: true,
                    title: true,
                    orderIndex: true,
                    lessons: {
                        orderBy: { orderIndex: 'asc' },  // Ensure lessons are sorted chronologically
                        select: {
                            id: true,
                            title: true,
                            orderIndex: true,
                            videoUrl: true,  // Handled/filtered in the controller based on authorization
                        },
                    },
                },
            },
        },
    });
};

// Create a new course draft
export const createCourse = async (instructorId, title, description, price, thumbnailUrl) => {
    return await db.course.create({
        data: {
            instructorId,
            title,
            description,
            price: price ? parseFloat(price): 0.0,
            thumbnailUrl,
        },
    });
};

/**
 * Updates an existing course.
 * Enforces ownership authorization checks before modifying data
 */
export const updateCourse = async (courseId, instructorId, updateData) => {
    const course = await db.course.findUnique({ where: { id: parseInt(courseId) } });

    if (!course) {
        throw new AppError('Course not found.', 404);
    }

    // Strict ownership check: prevents Instructor A from editing Intructor B's course
    if (course.instructorId !== instructorId) {
        throw new AppError('Access denied. You do not own this course.', 403);
    }

    // Format decimal price if present in updates
    const formattedData = { ...updateData };
    if (formattedData.price) {
        formattedData.price = parseFloat(formattedData.price);
    }

    // Update the course metadata
    return await db.course.update({
        where: { id: parseInt(courseId) },
        data: formattedData,
    });
};
