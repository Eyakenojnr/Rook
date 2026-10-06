import 'dotenv/config';
import { db } from '../src/config/db.js';


/**
 * Targeted Fixture Cleanup
 * Deletes only test accounts created during integration tests.
 * Cascades automatically to enrollments, payments, and progress without locking tables.
 */
export const cleanDatabase = async () => {
    try {
        await db.user.deleteMany({
            where: {
                email: {
                    in: [
                        'student@example.com', 
                        'short@example.com', 
                        'duplicate@example.com',
                        'unregistered@example.com',
                        'instructor@example.com',
                    ],
                },
            },
        });
    } catch (error) {
        console.error('Error during test cleanup:', error.message);
    }
};