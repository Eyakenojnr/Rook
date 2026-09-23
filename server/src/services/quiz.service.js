import { db } from '../config/db.js';
import AppError from '../utils/appError.js';


const ALLOWED_OPTION_COUNTS = [2, 4, 5];

/**
 * Creates a new quiz attached to a lesson.
 * Supports custom passing scores and optional vs required quiz gating
 */
export const createQuiz = async (
    lessonId, 
    instructorId, 
    title,
    passingScore = 70.0,
    isRequired = true
) => {
    // Validate passing score range
    const parsedPassingScore = parseFloat(passingScore);
    if (isNaN(parsedPassingScore) || parsedPassingScore <= 0 || parsedPassingScore > 100) {
        throw new AppError('parsedPassingScore must be a number between 1 and 100.', 422);
    }

    // Deep query: verify lesson exists and check the course owner
    const lesson = await db.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        include: {
            module: {
                select: {
                    course: {
                        select: { instructorId: true },
                    },
                },
            },
        },
    });

    if (!lesson) {
        throw new AppError("Lesson not found.", 404);
    }

    // Strict ownership check
    if (lesson.module.course.instructorId !== instructorId) {
        throw new AppError('Access denied. You do not own this course.', 403);
    }

    // Create quiz with custom settings
    return await db.quiz.create({
        data: {
            lessonId: parseInt(lessonId),
            title,
            passingScore: parsedPassingScore,
            isRequired: Boolean(isRequired),
        },
    });
};

/**
 * Add multiple-choice question to a quiz.
 * Enforces that each question options must be exactly 2. 4. or 5
 */
export const addQuestionToQuiz = async (quizId, instructorId, questionData) => {
    const { questionText, options, correctOptionIndex } = questionData;

    // Validate option length constraint
    if (!Array.isArray(options) || !ALLOWED_OPTION_COUNTS.includes(options.length)) {
        throw new AppError(
            'A question must contain exactly 2 (True/False), 4, or 5 multiple-choice options.',
            422
        );
    }

    const parseIndex = parseInt(correctOptionIndex);
    if (isNaN(parseIndex) || parseIndex < 0 || parseIndex >= options.length) {
        throw new AppError(
            `correctOptionIndex must be an integer between 0 and ${options.length - 1}.`,
            422
        );
    }

    // Deep query: fetch quiz, lesson, module, and course owner in one roundtrip
    const quiz = await db.quiz.findUnique({
        where: { id: parseInt(quizId) },
        include: {
            lesson: {
                select: {
                    module: {
                        select: {
                            course: {
                                select: { instructorId: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!quiz) {
        throw new AppError('Quiz not found.', 404);
    }

    if (quiz.lesson.module.course.instructorId !== instructorId) {
        throw new AppError('Access denied. You not own this course.', 403);
    }

    // Insert question (options stored natively as JSONB)
    return await db.question.create({
        data: {
            quizId: parseInt(quizId),
            questionText,
            options,
            correctOptionIndex: parseIndex,
        },
    });
};

/**
 * Retrieves a quiz for a lesson.
 * Strips "correctOptionIndex" if the requeter is a STUDENT
 */
export const getQuizForLesson = async (lessonId, userId, userRole) => {
    // Fetch the quiz and its questions
    const quiz = await db.quiz.findFirst({
        where: { lessonId: parseInt(lessonId) },
        include: {
            questions: {
                select: {
                    id: true,
                    questionText: true,
                    options: true,
                    correctOptionIndex: true,  // Selected internally for sanitization
                },
                orderBy: { id: 'asc' },
            },
            lesson: {
                select: {
                    module: {
                        select: { courseId: true },
                    },
                },
            },
        },
    });

    if (!quiz) {
        throw new AppError("No quiz found for this lesson.", 404);
    }

    const courseId = quiz.lesson.module.courseId;

    // Role-based authorization and sanitization
    if (userRole === 'STUDENT') {
        // Verify the student is enrolled in the course
        const enrollment = await db.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: userId,
                    courseId,
                },
            },
        });

        if (!enrollment) {
            throw new AppError("Access denied. You must be enrolled to take this quiz.", 403);
        }

        // Strip out the correct answer before returning to the student
        const sanitizedQuestions = quiz.questions.map(
            ({ correctOptionIndex: _, ...safeQuestion }) => safeQuestion
        );

        // Fetch student's highest score / latest attempt if aailable
        const latestAttempt = await db.quizAttempt.findFirst({
            where: { quizId: quiz.id, studentId: userId },
            orderBy: { attemptedAt: 'desc' },
            select: { score: true, isPassed: true, attemptedAt: true },
        });

        return {
            id: quiz.id,
            title: quiz.title,
            passingScore: Number(quiz.passingScore),
            isRequired: quiz.isRequired,
            questions: sanitizedQuestions,
            latestAttempt: latestAttempt || null,
        };
    }

    // If use is an Instructor, return full quiz with answer keys visible
    return {
        id: quiz.id,
        title: quiz.title,
        passingScore: Number(quiz.passingScore),
        isRequired: quiz.isRequired,
        questions: quiz.questions,
    };
};

/**
 * Grade students submissions and evaluate against the quiz's custom passingScore
 */
export const submitQuiz = async (quizId, studentId, answers) => {
    if (!Array.isArray(answers) || answers.length === 0) {
        throw new AppError('Answers must be provided as a non-empty array.', 422);
    }

    // Fetch quiz with its questions and check enrollment
    const quiz = await db.quiz.findUnique({
        where: { id: parseInt(quizId) },
        include: {
            questions: true,
            lesson: {
                select: {
                    module: {
                        select: { courseId: true },
                    },
                },
            },
        },
    });

    if (!quiz) {
        throw new AppError('Quiz not found.', 404);
    }

    const courseId = quiz.lesson.module.courseId;

    // Verify active student enrollment
    const enrollment = await db.enrollment.findUnique({
        where: {
            studentId_courseId: {
                studentId,
                courseId,
            },
        },
    });

    if (!enrollment) {
        throw new AppError('Access denied. You must be enrolled to submit quiz answers.', 403);
    }

    const totalQuestions = quiz.questions.length;
    if (totalQuestions === 0) {
        throw new AppError('This quiz does not contain any questions yet.', 400);
    }

    // Grade against database answer keys
    const answerKeyMap = new Map(
        quiz.questions.map((q) => [q.id, q.correctOptionIndex])
    );

    let correctCount = 0;
    answers.forEach((ans) => {
        const correctAnswer = answerKeyMap.get(ans.questionId);
        if (correctAnswer !== undefined && correctAnswer === ans.selectedOptionIndex) {
            correctCount++;
        }
    });

    // Calculate percentage score
    const rawScore = (correctCount / totalQuestions) * 100;
    const score = Math.round(rawScore * 100) / 100;  // Round to 2 dp

    // Dynamically evaluate against the Instructor's custom passing score
    const passingThreshold = Number(quiz.passingScore);
    const isPassed = score >= passingThreshold;

    // Persist the attempt in PostgreSQL
    const attempt = await db.quizAttempt.create({
        data: {
            quizId: quiz.id,
            studentId,
            score,
            isPassed,
        },
    });

    return {
        attemptId: attempt.id,
        score: Number(attempt.score),
        isPassed: attempt.isPassed,
        totalQuestions,
        correctCount,
        passingThreshold,
        attemptedAt: attempt.attemptedAt,
    };
};