import 'dotenv/config';
import { db } from '../src/config/db.js';


const TEST_EMAILS = [
    'student@example.com',
    'short@example.com',
    'duplicate@example.com',
    'unregistered@example.com',
    'instructor@example.com',
];

/**
 * Targeted Fixture Cleanup
 * Deletes only test accounts created during integration tests.
 */
export const cleanDatabase = async () => {
    try {
        // Delete test courses first to satisfy onDelete: Restrict
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