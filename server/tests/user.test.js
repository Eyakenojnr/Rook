import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
import { db } from '../src/config/db.js';
import { cleanDatabase } from './setup.js';


describe('User Profile & Account Integration Tests (/api/v1/users)', () => {
  	let studentToken;
  	let instructorToken;
  	let courseId;

  	beforeAll(async () => {
    	await cleanDatabase();

    	// Register a test Student
    	const studentRes = await request(app)
      		.post('/api/v1/auth/register')
      		.send({
        		name: 'Profile Student',
				email: 'profile_student@example.com',
				password: 'password123',
				role: 'STUDENT',
      		});
    	studentToken = studentRes.body.data.token;

    	// Register a test Instructor
    	const instructorRes = await request(app)
		.post('/api/v1/auth/register')
		.send({
			name: 'Profile Instructor',
			email: 'profile_instructor@example.com',
			password: 'password123',
			role: 'INSTRUCTOR',
		});
    	instructorToken = instructorRes.body.data.token;

		// Instructor creates and publishes a course
		const courseRes = await request(app)
			.post('/api/v1/courses')
			.set('Authorization', `Bearer ${instructorToken}`)
			.send({
				title: 'Profile Dashboard Test Course',
				description: 'Testing progress metrics on user dashboard.',
				price: 0.0,
		});
		courseId = courseRes.body.data.course.id;

		const modRes = await request(app)
			.post(`/api/v1/courses/${courseId}/modules`)
			.set('Authorization', `Bearer ${instructorToken}`)
			.send({ title: 'Module 1', orderIndex: 1 });

		await request(app)
			.post(`/api/v1/modules/${modRes.body.data.module.id}/lessons`)
			.set('Authorization', `Bearer ${instructorToken}`)
			.send({ title: 'Lesson 1', orderIndex: 1 });

		await request(app)
			.patch(`/api/v1/courses/${courseId}/publish`)
			.set('Authorization', `Bearer ${instructorToken}`);

		// Student enrolls in the course
		await request(app)
			.post(`/api/v1/courses/${courseId}/enroll`)
			.set('Authorization', `Bearer ${studentToken}`);
  	}, 15000);

	afterAll(async () => {
		await cleanDatabase();
		await db.$disconnect();
	}, 15000);

	describe('GET /api/v1/users/me/profile', () => {
		it('should return 401 Unauthorized if no token is provided', async () => {
			const response = await request(app).get('/api/v1/users/me/profile');
			expect(response.status).toBe(401);
			expect(response.body.status).toBe('fail');
		});

		it('should return student profile with enrollment metrics and course categorizations', async () => {
			const response = await request(app)
				.get('/api/v1/users/me/profile')
				.set('Authorization', `Bearer ${studentToken}`);

			expect(response.status).toBe(200);
			expect(response.body.status).toBe('success');
			expect(response.body.data.user.email).toBe('profile_student@example.com');
			expect(response.body.data.stats.totalEnrolled).toBe(1);
			expect(response.body.data.stats.inProgressCount).toBe(1);
			expect(response.body.data.stats.completedCount).toBe(0);
			expect(response.body.data.courses.all).toHaveLength(1);
			expect(response.body.data.courses.inProgress).toHaveLength(1);
			expect(response.body.data.courses.completed).toHaveLength(0);
    	});

		it('should return instructor profile with teaching metrics and created courses', async () => {
			const response = await request(app)
				.get('/api/v1/users/me/profile')
				.set('Authorization', `Bearer ${instructorToken}`);

			expect(response.status).toBe(200);
			expect(response.body.status).toBe('success');
			expect(response.body.data.user.role).toBe('INSTRUCTOR');
			expect(response.body.data.stats.totalCreatedCourses).toBe(1);
			expect(response.body.data.stats.publishedCount).toBe(1);
			expect(response.body.data.stats.totalStudentsEnrolled).toBe(1);
		});
	});

	describe('PATCH /api/v1/users/change-password', () => {
		it('should reject password change if current password is wrong (400 Bad Request)', async () => {
			const response = await request(app)
				.patch('/api/v1/users/change-password')
				.set('Authorization', `Bearer ${studentToken}`)
				.send({
				currentPassword: 'incorrectpassword',
				newPassword: 'newsecurepassword123',
				});

			expect(response.status).toBe(400);
			expect(response.body.status).toBe('fail');
			expect(response.body.message).toMatch(/current password is incorrect/i);
		});

		it('should reject password change if new password is under 8 characters (422 Unprocessable Entity)', async () => {
		const response = await request(app)
			.patch('/api/v1/users/change-password')
			.set('Authorization', `Bearer ${studentToken}`)
			.send({
				currentPassword: 'password123',
				newPassword: 'short',
			});

			expect(response.status).toBe(422);
			expect(response.body.status).toBe('fail');
			expect(response.body.message).toMatch(/at least 8 characters/i);
    	});

		it('should reject password change if new password matches current password (400 Bad Request)', async () => {
			const response = await request(app)
				.patch('/api/v1/users/change-password')
				.set('Authorization', `Bearer ${studentToken}`)
				.send({
					currentPassword: 'password123',
					newPassword: 'password123',
				});

			expect(response.status).toBe(400);
			expect(response.body.status).toBe('fail');
			expect(response.body.message).toMatch(/different from current password/i);
		});

		it('should successfully update password and authenticate with new credentials', async () => {
			// Change password
			const patchRes = await request(app)
				.patch('/api/v1/users/change-password')
				.set('Authorization', `Bearer ${studentToken}`)
				.send({
					currentPassword: 'password123',
					newPassword: 'updatedpassword123',
				});

			expect(patchRes.status).toBe(200);
			expect(patchRes.body.status).toBe('success');

			// Old password should now fails
			const failedLogin = await request(app)
				.post('/api/v1/auth/login')
				.send({
					email: 'profile_student@example.com',
					password: 'password123',
				});
			expect(failedLogin.status).toBe(400);

			// New password must succeed
			const successfulLogin = await request(app)
				.post('/api/v1/auth/login')
				.send({
					email: 'profile_student@example.com',
					password: 'updatedpassword123',
				});
			expect(successfulLogin.status).toBe(200);
			expect(successfulLogin.body.data.token).toBeDefined();
    	});
  	});
});