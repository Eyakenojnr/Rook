import 'dotenv/config';
import { db } from '../src/config/db.js';


const TEST_EMAILS = [
    'student@example.com',
    'short@example.com',
    'duplicate@example.com',
    'unregistered@example.com',
    'instructor@example.com',
    'progress_student@example.com',
    'progress_instructor@example.com',
    'payment_student@example.com',
    'payment_instructor@example.com',
    'profile_student@example.com',
    'profile_instructor@example.com',
];

/**
 * Targeted Fixture Cleanup
 * Deletes only test accounts created during integration tests.
 */
export const cleanDatabase = async () => {
    try {
        // Delete test enrollments (removes FK lock on courses)
        await db.enrollment.deleteMany({
            where: {
                student: { email: { in: TEST_EMAILS } },
            },
        });

        // Delete test payments and certificates
        await db.payment.deleteMany({
            where: {
                student: { email: { in: TEST_EMAILS } },
            },
        });

        await db.certificate.deleteMany({
            where: {
                enrollment: {
                    student: { email: { in: TEST_EMAILS } }
                },
            },
        });

        // Delete test courses (no enrollments or payments reference them)
        await db.course.deleteMany({
            where: {
                instructor: {
                    email: { in: TEST_EMAILS },
                },
            },
        });

        // Delete test users
        await db.user.deleteMany({
            where: {
                email: { in: TEST_EMAILS },
            },
        });
    } catch (error) {
        console.error('Error during test cleanup:', error.message);
    }
};