import 'dotenv/config';
import crypto from 'crypto';
import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { db } from '../src/config/db.js';
import { cleanDatabase } from './setup.js';


describe('Payment & Webhook Integration Tests', () => {
    let studentToken;
    let studentId;
    let instructorToken;
    let freeCourseId;
    let paidCourseId;


    beforeAll(async () => {
        await cleanDatabase();

        // Register test Student
        const studentRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Payment Student',
                email: 'payment_student@example.com',
                password: 'password123',
                role: 'STUDENT',
            });
        studentToken = studentRes.body.data.token;
        studentId = studentRes.body.data.user.id;

        // Register test Instructor
        const instructorRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Payment Instructor',
                email: 'payment_instructor@example.com',
                password: 'password123',
                role: 'INSTRUCTOR',
            });

        // If registration fails, log exact validation error message
        if (instructorRes.status !== 201) {
            console.error('Instructor registration failed in beforeAll:', instructorRes.body);
        }
        instructorToken = instructorRes.body.data.token;

        // Create free course
        const freeCourseRes = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Free Intro Course',
                description: 'Testing zero-cost instant enrollment.',
                price: 0.0,
            });
        freeCourseId = freeCourseRes.body.data.course.id;

        // Add module & lesson to be published
        const freeModRes = await request(app)
            .post(`/api/v1/courses/${freeCourseId}/modules`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({ title: 'Module 1', orderIndex: 1 });

        await request(app)
            .post(`/api/v1/modules/${freeModRes.body.data.module.id}/lessons`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({ title: 'Lesson 1', orderIndex: 1 });

        await request(app)
            .patch(`/api/v1/courses/${freeCourseId}/publish`)
            .set('Authorization', `Bearer ${instructorToken}`);

        // Create paid course
        const paidCourseRes = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Paid Premium Course',
                description: 'Testing Paystack checkout initialization.',
                price: 49.99,
            });
        paidCourseId = paidCourseRes.body.data.course.id;

        const paidModRes = await request(app)
            .post(`/api/v1/courses/${paidCourseId}/modules`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({ title: 'Module 1', orderIndex: 1 });

        await request(app)
            .post(`/api/v1/modules/${paidModRes.body.data.module.id}/lessons`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({ title: 'Lesson 1', orderIndex: 1 });

        await request(app)
            .patch(`/api/v1/courses/${paidCourseId}/publish`)
            .set('Authorization', `Bearer ${instructorToken}`);
    }, 15000);

    afterAll(async () => {
        await cleanDatabase();
        await db.$disconnect();
    }, 15000);

    describe('POST /api/v1/courses/:courseId/checkout (Checkout Initialization)', () => {
        it('should immediately enroll a student in a free course (201 Created)', async () => {
            const response = await request(app)
                .post(`/api/v1/courses/${freeCourseId}/checkout`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.isFree).toBe(true);
            expect(response.body.data.enrollment).toBeDefined();
        });

        it('should initialize a Paystack session for a paid course (200 OK)', async () => {
            // Mock external Paystack API boundary
            const mockPaystackResponse = {
                status: true,
                message: 'Authorization URL created',
                data: {
                    authorization_url: 'https://checkout.paystack.com/test_session_123',
                    access_code: 'test_access_code_123',
                    reference: 'ROOK_TEST_REF_123',
                },
            };

            const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
                json: async () => mockPaystackResponse,
            });

            const response = await request(app)
                .post(`/api/v1/courses/${paidCourseId}/checkout`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.isFree).toBe(false);
            expect(response.body.data.authorizationUrl).toBe(mockPaystackResponse.data.authorization_url);
            expect(response.body.data.reference).toBeDefined();

            // Verify a PENDING payment record was persisted in PostgreSQL
            const paymentRecord = await db.payment.findUnique({
                where: { reference: response.body.data.reference },
            });
            expect(paymentRecord).toBeDefined();
            expect(paymentRecord.status).toBe('PENDING');

            fetchSpy.mockRestore();
        });

        it('should reject checkout if student is already enrolled (400 Bad Request)', async () => {
            // Student is already enrolled in freeCourseId from first test
            const response = await request(app)
                .post(`/api/v1/courses/${freeCourseId}/checkout`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toMatch(/already enrolled/i);
        });
    });

    describe('POST /api/v1/payments/webhook (Security & Idempotency)', () => {
        const testReference = `ROOK_HOOK_TEST_${Date.now()}`;

        // Helper to calculate valid HMAC SHA512 signature
        const generateSignature = (payload) => {
            return crypto
                .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                .update(JSON.stringify(payload))
                .digest('hex');
        };

        it('should reject webhook requests with an invalid HMAC signature (401 Unauthorized)', async () => {
            const payload = {
                event: 'charge.success',
                data: { reference: testReference },
            };

            const response = await request(app)
                .post('/api/v1/payments/webhook')
                .set('x-paystack-signature', 'invalid_tampered_signature')
                .send(payload);

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toMatch(/invalid webhook signature/i);
        });

        it('should accept a valid signature, mark payment SUCCESS, and atomically enroll student (200 OK)', async () => {
            // Pre-create a PENDING payment record
            await db.payment.create({
                data: {
                    reference: testReference,
                    amount: 49.99,
                    currency: 'NGN',
                    status: 'PENDING',
                    studentId,
                    courseId: paidCourseId,
                },
            });

            const payload = {
                event: 'charge.success',
                data: {
                    reference: testReference,
                    amount: 499900,  // conerted to kobo
                    currency: 'NGN',
                    metadata: {
                        studentId: studentId.toString(),
                        courseId: paidCourseId.toString(),
                    },
                },
            };

            const validSignature = generateSignature(payload);

            const response = await request(app)
                .post('/api/v1/payments/webhook')
                .set('x-paystack-signature', validSignature)
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.success).toBe(true);

            // Verify payment changed to SUCCESS in DB
            const updatedPayment = await db.payment.findUnique({
                where: { reference: testReference },
            });
            expect(updatedPayment.status).toBe('SUCCESS');

            // Verify student was enrolled in database
            const enrollment = await db.enrollment.findUnique({
                where: {
                    studentId_courseId: { studentId, courseId: paidCourseId },
                },
            });
            expect(enrollment).toBeDefined();
        });

        it('should enforce idempotency when receiving the exact same webhook event again (200 OK)', async () => {
            const payload = {
                event: 'charge.success',
                data: {
                    reference: testReference,
                    amount: 499900,
                    currency: 'NGN',
                    metadata: {
                        studentId: studentId.toString(),
                        courseId: paidCourseId.toString(),
                    },
                },
            };

            const validSignature = generateSignature(payload);

            // Send identical event a second time
            const response = await request(app)
                .post('/api/v1/payments/webhook')
                .set('x-paystack-signature', validSignature)
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.alreadyProcessed).toBe(true);

            // Ensure duplicate enrollment was not created (unique constraint remains intact)
            const enrollmentsCount = await db.enrollment.count({
                where: { studentId, courseId: paidCourseId },
            });
            expect(enrollmentsCount).toBe(1);
        });
    });
});