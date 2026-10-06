import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
import { db } from '../src/config/db.js';
import { cleanDatabase } from './setup.js';


describe('Auth Integration Tests (POST /api/v1/auth)', () => {
    // Clean DB before starting and after finishing
    beforeAll(async () => {
        await cleanDatabase();
    }, 15000);  // 15s window for initial initial TCP handshake

    afterAll(async () => {
        await cleanDatabase();
        // Disconnect Prisma after tests complete
        await db.$disconnect();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should successfully register a new student and return a JWT token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test Student',
                    email: 'student@example.com',
                    password: 'securepassword123',
                    role: 'STUDENT',
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe('student@example.com');
            expect(response.body.data.user.role).toBe('STUDENT');
            expect(response.body.data.user.passwordHash).toBeUndefined();  // hash stripped for security
            expect(response.body.data.token).toBeDefined();
        });

        it('should reject registration if email is already registered (400 Bad Request)', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Duplicate Student',
                    email: 'student@example.com',  // duplicate email
                    password: 'securepassword123',
                    role: 'STUDENT',
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toMatch(/already exists/i);
        });

        it('should reject registration if password is under 8 characters (422 Unprocessible Entity)', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Short Password',
                    email: 'short@example.com',
                    password: '123',
                    role: 'STUDENT',
                });

            expect(response.status).toBe(422);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toMatch(/at least 8 characters/i);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should authenticate a registered user and return a token (200 OK)', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'student@example.com',
                    password:'securepassword123',
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.email).toBe('student@example.com');
        });

        it('should reject login with an invalid password (400 Bad Request)', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'student@example.com',
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toMatch(/invalid email or password/i);
        });

        it('should reject login if email is not registered (400 Bad Request)', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'unregistered@example.com',
                    password: 'securepassword123',
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toMatch(/invalid email or password/i);
        });
    });
});