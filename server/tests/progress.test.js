import 'dotenv/config';
import request from 'supertest';
import { db } from '../src/config/db.js';
import app from '../src/app.js';
import { cleanDatabase } from './setup.js';


describe('Enrollment & Progress Integration Tests', () => {
    let studentToken;
    let instructorToken;
    let courseId;
    let moduleId;
    let lesson1Id;
    let lesson2Id;

    beforeAll(async () => {
        await cleanDatabase();

        // Create Student
        const studentRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Progress Student',
                email: 'progress_student@example.com',
                password: 'password123',
                role: 'STUDENT',
            });
        studentToken = studentRes.body.data.token;

        // Ceate instructor
        const instructorRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Progress Instructor',
                email: 'progress_instructor@example.com',
                password: 'password123',
                role: 'INSTRUCTOR',
            });
        instructorToken = instructorRes.body.data.token;

        // Instructor creates a course
        const courseRes = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Full Progress Lifecycle Course',
                description: 'Comprehensive course to test enrollment, sequential locking, and certification.',
                price: 0.0,  // free course for testing direct enrollment
            });
        courseId = courseRes.body.data.course.id;

        // Instructor adds a module
        const moduleRes = await request(app)
            .post(`/api/v1/courses/${courseId}/modules`)
            .set('Authorization', `Bearer: ${instructorToken}`)
            .send({
                title: 'Module 1: Foundations',
                orderIndex: 1,
            });
        moduleId = moduleRes.body.data.module.id;

        // Instructor adds Lesson 1
        const lesson1Res = await request(app)
            .post(`/api/v1/modules/${moduleId}/lessons`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Lesson 1: Introduction',
                content: 'Overview of the course.',
                orderIndex: 1,
            });
        lesson1Id = lesson1Res.body.data.lesson.id;

        // Instructor adds Lesson 2
        const lesson2Res = await request(app)
            .post(`/api/v1/modules/${moduleId}/lessons`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Lesson 2: Advanced Topics',
                content: 'Final lesson before completion.',
                orderIndex: 2,
            });
        lesson2Id = lesson2Res.body.data.lesson.id;

        // Publish course
        await request(app)
            .patch(`/api/v1/courses/${courseId}/publish`)
            .set('Authorization', `Bearer ${instructorToken}`);
    }, 15000);

    afterAll(async () => {
        await cleanDatabase();
        await db.$disconnect();
    }, 15000);

    describe('POST /api/v1/courses/:courseId/enroll', () => {
        it('should reject enrollment if the user is an INSTRUCTOR (403 Forbidden)', async () => {
            const response = await request(app)
                .post(`/api/v1/courses/${courseId}/enroll`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(403);
            expect(response.body.status).toBe('fail');
        });

        it('should successfully enroll a STUDENT in a published course (201 Created)', async () => {
            const response = await request(app)
                .post(`/api/v1/courses/${courseId}/enroll`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.enrollment).toBeDefined();
            expect(response.body.data.enrollment.courseId).toBe(courseId);
        });

        it('should reject duplicate enrollment (400 Bad Request)', async () => {
            const response = await request(app)
                .post(`/api/v1/courses/${courseId}/enroll`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toMatch(/already enrolled/i);
        });
    });

    describe('POST /api/v1/lessons/:lessonId/complete (Sequential Locking & Certification)', () => {
        it('should block completing Leson 2 before Lesson 1 is completed (Sequential Locking - 400 Bad Request)', async () => {
            const response = await request(app)
                .post(`/api/v1/lessons/${lesson2Id}/complete`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toMatch(/must complete the previous lesson/i);
        });

        it('should allow completing Lesson 1 and calculate progress at 50% (200 OK)', async () => {
            const response = await request(app)
                .post(`/api/v1/lessons/${lesson1Id}/complete`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.progressPercentage).toBe(50);
            expect(response.body.data.certificate).toBeNull();
        });

        it('should allow completing Lesson 2, hit 100% progress, and issue a certificate', async () => {
            const response = await request(app)
                .post(`/api/v1/lessons/${lesson2Id}/complete`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.progressPercentage).toBe(100);
            expect(response.body.data.courseCompleted).toBe(true);
            expect(response.body.data.certificate).toBeDefined();
            expect(response.body.data.certificate.certificateUrl).toBeDefined();
        });
    });

    describe('GET /api/v1/courses/:courseId/progress', () => {
        it('should return accurate 100% progress metrics for the enrolled student', async () => {
            const response = await request(app)
                .get(`/api/v1/courses/${courseId}/progress`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.progressPercentage).toBe(100);
            expect(response.body.data.totalLessons).toBe(2);
            expect(response.body.data.completedLessonsCount).toBe(2);
            expect(response.body.data.completedLessonIds).toContain(lesson1Id);
            expect(response.body.data.completedLessonIds).toContain(lesson2Id);
        });
    });
});