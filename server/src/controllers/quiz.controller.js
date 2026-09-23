import * as quizService from '../services/quiz.service.js';


/**
 * Handles HTTP requests to create quiz for a lesson.
 * Access: Private (Instructor who owns the course only).
 */
export const createQuiz = async (req, res, next) => {
    try {
        const { lessonId } = req.params;
        const { title, passingScore, isRequired } = req.body;
        const instructorId = req.user.id;  // populated by auth middleware

        // Fail-early validation
        if (!title || title.trim() === '') {
            res.status(422);
            throw new Error('Quiz title is required.');
        }

        // Delegate to service layer
        const quiz = await quizService.createQuiz(
            lessonId,
            instructorId,
            title.trim(),
            passingScore,
            isRequired
        );
        
        res.status(201).json({
            status: 'success',
            data: { quiz },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles HTTP requests to add a question to a quiz.
 * Access: Private (Instructor who owns the course only).
 */
export const addQuestionToQuiz = async (req, res, next) => {
    try {
        const { quizId } = req.params;
        const { questionText, options, correctOptionIndex } = req.body;
        const instructorId = req.user.id;

        if (!questionText || questionText.trim() === '') {
            res.status(422);
            throw new Error('questionText is required.');
        }

        if (!options || correctOptionIndex === undefined) {
            res.status(422);
            throw new Error('Both options array and correctOptionIndex are required.');
        }

        const question = await quizService.addQuestionToQuiz(quizId, instructorId, {
            questionText: questionText.trim(),
            options,
            correctOptionIndex,
        });

        res.status(201).json({
            status: 'success',
            data: { question },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles HTTP requests to retrieve a quiz for a lesson.
 * Access: Private (Enrolled Student or Course Instructor)
 */
export const getQuizForLesson = async (req, res, next) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const quiz = await quizService.getQuizForLesson(lessonId, userId, userRole);

        res.status(200).json({
            status: 'success',
            data: { quiz },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles HTTP requests to submit quiz answers for server-side grading.
 * Access: Private (Enrolled Student only)
 */
export const submitQuiz = async (req, res, next) => {
    try {
        const { quizId } = req.params;
        const { answers } = req.body;
        const studentId = req.user.id;

        if (!answers || !Array.isArray(answers)) {
            res.status(422);
            throw new Error('answers must be provided as an array.');
        }

        const attempt = await quizService.submitQuiz(quizId, studentId, answers);

        res.status(200).json({
            status: 'success',
            data: { attempt },
        });
    } catch (error) {
        next(error);
    }
};