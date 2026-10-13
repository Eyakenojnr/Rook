import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
import { db } from '../src/config/db.js';
import { cleanDatabase } from './setup.js';


describe('Quiz & Assessment Engine Integration Tests', () => {
    let studentToken;
    let instructorToken;
    let courseId;
    let moduleId;
    let lessonId;
    let quizId;
    let questionId;

    beforeAll(async () => {
        await cleanDatabase();

        // Register test Student
        const studentRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Quiz Student',
                email: 'student@example.com',
                password: 'password123',
                role: 'STUDENT',
            });
        studentToken = studentRes.body.data.token;

        // Register test Instructor
        const instructorRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Quiz Instructor',
                email: 'instructor@example.com',
                password: 'password123',
                role: 'INSTRUCTOR',
            });
        instructorToken = instructorRes.body.data.token;

        // Create course, module, and lesson
        const courseRes = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Quiz Assessment Testing Course',
                description: 'Testing option bounds, sanitization, and pass gating.',
                price: 0.0,
            });
        courseId = courseRes.body.data.course.id;

        const moduleRes = await request(app)
            .post(`/api/v1/courses/${courseId}/modules`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Module 1: Assessments',
                orderIndex: 1,
            });
        moduleId = moduleRes.body.data.module.id;

        const lessonRes = await request(app)
            .post(`/api/v1/modules/${moduleId}/lessons`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Lesson 1: Database Normalization',
                content: 'Understanding 1NF, 2NF, and 3NF.',
                orderIndex: 1,
            });
        lessonId = lessonRes.body.data.lesson.id;

        // Publish course and enroll student
        await request(app)
            .patch(`/api/v1/courses/${courseId}/publish`)
            .set('Authorization', `Bearer ${instructorToken}`);

        await request(app)
            .post(`/api/v1/courses/${courseId}/enroll`)
            .set('Authorization', `Bearer ${studentToken}`);
    }, 15000);

    afterAll(async () => {
        await cleanDatabase();
        await db.$disconnect();
    }, 15000);

    describe('POST /api/v1/lessons/:lessonId/quizzes (Quiz Creation)', () => {
        it('should allow an instructor to create a mandatory quiz with custom passing score (201 Created)', async () => {
            const response = await request(app)
                .post(`/api/v1/lessons/${lessonId}/quizzes`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Normalization Knowledge Check',
                    passingScore: 80.0,
                    isRequired: true,
            });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.quiz).toBeDefined();
            expect(response.body.data.quiz.lessonId).toBe(lessonId);
            expect(Number(response.body.data.quiz.passingScore)).toBe(80);
            expect(response.body.data.quiz.isRequired).toBe(true);

            quizId = response.body.data.quiz.id;
        });
    });

    describe('POST /api/v1/quizzes/:quizId/questions (Question Constraints)', () => {
        it('should reject questions with invalid option counts, e.g. 3 options (422 Unprocessable Entity)', async () => {
            const response = await request(app)
                .post(`/api/v1/quizzes/${quizId}/questions`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    questionText: 'Which normal form eliminates partial dependencies?',
                    options: ['1NF', '2NF', '3NF'],
                    correctOptionIndex: 1,
                });

            expect(response.status).toBe(422);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toMatch(/exactly 2.*4.*or 5/i);
        });

        it('should accept a question with exactly 4 options (201 Created)', async () => {
            const response = await request(app)
                .post(`/api/v1/quizzes/${quizId}/questions`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    questionText: 'Which normal form eliminates partial dependencies?',
                    options: ['1NF', '2NF', '3NF', 'BCNF'], // 4 options is valid
                    correctOptionIndex: 1,
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.question).toBeDefined();
            expect(response.body.data.question.correctOptionIndex).toBe(1);

            questionId = response.body.data.question.id;
        });
    });

    describe('GET /api/v1/lessons/:lessonId/quiz (Security Sanitization)', () => {
        it('should strip correctOptionIndex when requested by a STUDENT', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lessonId}/quiz`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.quiz.questions).toBeInstanceOf(Array);
            expect(response.body.data.quiz.questions.length).toBe(1);

            // Security check: correctOptionIndex must be undefined in student response
            const question = response.body.data.quiz.questions[0];
            expect(question.correctOptionIndex).toBeUndefined();
            expect(question.questionText).toBe('Which normal form eliminates partial dependencies?');
        });

        it('should preserve correctOptionIndex when requested by an INSTRUCTOR', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lessonId}/quiz`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.quiz.questions[0].correctOptionIndex).toBe(1);
        });
    });

    describe('Assessment Gating & Quiz Submissions', () => {
        it('should block completing the lesson if mandatory quiz is not yet passed (400 Bad Request)', async () => {
            const response = await request(app)
                .post(`/api/v1/lessons/${lessonId}/complete`)
                .set('Authorization', `Bearer ${studentToken}`)

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toMatch(/must pass the mandatory quiz/i);
        });

        it('should grade answers, fail student if below passingScore, and keep lesson blocked', async () => {
            // Submit wrong answer (index 0 instead of 1) -> Score 0%
            const submitRes = await request(app)
                .post(`/api/v1/quizzes/${quizId}/submit`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    answers: [{ questionId, selectedOptionIndex: 0 }],
                });

            expect(submitRes.status).toBe(200);
            expect(submitRes.body.data.attempt.score).toBe(0);
            expect(submitRes.body.data.attempt.isPassed).toBe(false);

            // Verify lesson completion is still blocked
            const completeRes = await request(app)
                .post(`/api/v1/lessons/${lessonId}/complete`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(completeRes.status).toBe(400);
            expect(completeRes.body.status).toBe('fail');
        });

        it('should grade correct answer, record passing attempt, and unblock lesson completion', async () => {
            // Submit correct answer (index 1) -> Score 100% (exceeds 80% passingScore)
            const submitRes = await request(app)
                .post(`/api/v1/quizzes/${quizId}/submit`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    answers: [{ questionId, selectedOptionIndex: 1 }],
                });

            expect(submitRes.status).toBe(200);
            expect(submitRes.body.data.attempt.score).toBe(100);
            expect(submitRes.body.data.attempt.isPassed).toBe(true);

            // Verify lesson completion succeeds
            const completeRes = await request(app)
                .post(`/api/v1/lessons/${lessonId}/complete`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(completeRes.status).toBe(200);
            expect(completeRes.body.status).toBe('success');
            expect(completeRes.body.data.courseCompleted).toBe(true);
        });
    });
});