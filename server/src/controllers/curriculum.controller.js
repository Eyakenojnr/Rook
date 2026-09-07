import * as curriculumService from '../services/curriculum.service.js';


// Handle HTTP requests to create a new module inside a course
export const createModule = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { title, orderIndex } = req.body;
        const instructorId = req.user.id;   // Populated by auth middleware

        if (!title || orderIndex === undefined) {
            res.status(422);  // Unprocessible Entity
            throw new Error('Module title and orderIndex are required.');
        }

        // Ensure orderIndex is a valid positive integer
        const parsedOrderIndex = parseInt(orderIndex);
        if (isNaN(parsedOrderIndex) || parsedOrderIndex < 1) {
            res.status(422);
            throw new Error('orderIndex must be a positive integer starting from 1.');
        }

        const newModule = await curriculumService.createModule(
            courseId,
            instructorId,
            title,
            parsedOrderIndex
        );

        res.status(201).json({
            status: 'success',
            data: { module: newModule },
        });
    } catch (error) {
        next(error);
    }
};

// Handle HTTP requests to create a new lesson inside a module
export const createLesson = async (req, res, next) => {
    try {
        const { moduleId } = req.params;
        const { title, content, videoUrl, orderIndex } = req.body;
        const instructorId = req.user.id;

        if (!title || orderIndex === undefined) {
            res.status(422);
            throw new Error('Lesson title and orderIndex are required.');
        }

        const parsedOrderIndex = parseInt(orderIndex);
        if (isNaN(parsedOrderIndex) || parsedOrderIndex < 1) {
            res.status(422);
            throw new Error('orderIndex must be a postive integer starting from 1.');
        }

        const newLesson = await curriculumService.createLesson(moduleId, instructorId, {
            title,
            content,
            videoUrl,
            orderIndex: parsedOrderIndex,
        });

        res.status(201).json({
            status: 'success',
            data: { lesson: newLesson },
        });
    } catch (error) {
        next(error);
    }
};