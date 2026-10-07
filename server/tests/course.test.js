import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
import { db } from '../src/config/db.js';
import { cleanDatabase } from './setup.js';


describe('Course & RBAC Integration Tests (/api/v1/courses)', () => {
    let studentToken;
    let instructorToken;
    let createdCourseId;

    beforeAll(async () => {
        await cleanDatabase();

        // Register a test Student
        const studentRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test Student',
                email: 'student@example.com',
                password: 'password123',
                role: 'STUDENT',
            });
        studentToken = studentRes.body.data.token;

        // Register a test Instructor
        const instructorRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test Instructor',
                email: 'instructor@example.com',
                password: 'password123',
                role: 'INSTRUCTOR',
            });
        instructorToken = instructorRes.body.data.token;
    });

    afterAll(async () => {
        await cleanDatabase();
        await db.$disconnect();
    });

    describe('POST /api/v1/courses (Course Creation & RBAC Guard)', () => {
        it('should reject course creation if the user is STUDENT (403 Forbidden)', async () => {
            const response = await request(app)
                .post('/api/v1/courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    title: 'Unauthorized Student Course',
                    description: 'This course creation attempt should be blocked by RBAC.',
                    price: 19.99,
                });

            expect(response.status).toBe(403);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toMatch(/only instructor can perform this action/i);
        });

        it('should allow an INSTRUCTOR to create a course draft (201 Created)', async () => {
            const response = await request(app)
                .post('/api/v1/courses')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Automated Testing with Jest',
                    description: 'Learn integration testing, assertion patterns, CI/CD pipelines.',
                    price: 49.99,
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.course).toBeDefined();
            expect(response.body.data.course.title).toBe('Automated Testing with Jest');
            expect(response.body.data.course.isPublished).toBe(false);  // Draft by default

            createdCourseId = response.body.data.course.id;
        });
    });

    describe('GET /api/v1/courses (Public Catalog & Drafting Filtering)', () => {
        it('should not include draft courses in public catalog', async () => {
            const response = await request(app).get('/api/v1/courses');

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.courses).toBeInstanceOf(Array);

            // Created draft course should not appear in public list
            const foundDraft = response.body.data.courses.find((c) => c.id === createdCourseId);
            expect(foundDraft).toBeUndefined();
        });
    });
});