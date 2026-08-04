import jwt from 'jsonwebtoken';
import * as courseService from '../services/course.service.js';
import { db } from '../config/db.js';


// Handle HTTP requests to fetch all published courses (Paginated & Filtered)
export const getCourses = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const result = await courseService.getCourses(page, limit, search);

        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle HTTP requests to fetch a course syllabus.
 * Implements Syllabus Protection to hide lesson video URLs from non-enrolled users.
 */
export const getCourseById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await courseService.getCourseById(id);

        if (!course) {
            res.status(404);
            throw new Error('Course not found.');
        }

        // Soft Authentication & enrollment check
        let isAuthorizedToViewVideos = false;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Check if the user is the Instructor of this course
                if (decoded.id === course.instructor.id) {
                    isAuthorizedToViewVideos = true;
                } else {
                    // Check if the user is a student with an active enrollment in this course
                    const enrollment = await db.enrollment.findUnique({
                        where: {
                            studentId_courseId: {
                                studentId: decoded.id,
                                courseId: course.id,
                            },
                        },
                    });

                    if (enrollment) {
                        isAuthorizedToViewVideos = true;
                    }
                }
            } catch (jwtError) {
                // If the token is expired/corrupt, ignore and treat the user as a public guest
                isAuthorizedToViewVideos = false;
            }
        }

        // Syllabus protection: Strip video URLs if the user is not authorized
        if (!isAuthorizedToViewVideos) {
            course.modules.forEach((module) => {
                module.lessons.forEach((lesson) => {
                    lesson.videoUrl = null;  // Hide the protected lecture video link
                });
            });
        }

        res.status(200).json({
            status: 'success',
            data: { course },
        });
    } catch (error) {
        next(error);
    }
};

// Handle HTTP requests to create a new course draft
export const createCourse = async (req, res, next) => {
    try {
        const { title, description, price, thumbnailUrl } = req.body;

        if (!title || !description) {
            res.status(422);
            throw new Error('Course title and description are required.');
        }

        if (title.length < 5) {
            res.status(422);
            throw new Error('Course title must be at least 5 characters long.');
        }

        // Extract instructor ID & Delegate to service layer
        const instructorId = req.user.id;
        const newCourse = await courseService.createCourse(
            instructorId,
            title,
            description,
            price,
            thumbnailUrl
        );

        res.status(201).json({
            status: 'success',
            data: { course: newCourse },
        });
    } catch (error) {
        next(error);
    }
};

// Handle HTTP request to update an existing course
export const updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;  // Enforced by auth middleware
        const updatedCourse = await courseService.updateCourse(id, instructorId, req.body);

        res.status(200).json({
            status: 'success',
            data: { course: updatedCourse },
        });
    } catch (error) {
        next(error);
    }
};
