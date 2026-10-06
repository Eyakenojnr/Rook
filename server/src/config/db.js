/* Database Connection Module */
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/index.js';


// Auto-switch database target during automated testing
let connectionString = process.env.DATABASE_URL;
if (process.env.NODE_ENV === 'test' && connectionString) {
    connectionString = connectionString.replace(/\/rook_db(\?|$)/, '/rook_test_db$1');
}

const pool = new pg.Pool({
    connectionString,
});

const adapter = new PrismaPg(pool);

export const db = new PrismaClient({ adapter });

/* Verify database connection on server startup. 
   This prevents the server from running with a broken DB link */
export const connectDatabase = async () => {
    try {
        // Run a lightweight test query
        await pool.query("SELECT 1");
        console.log("Database connection established successfully.");
    } catch (error) {
        console.error("Database connection failed: ", error.message);
        process.exit(1);  // Terminate app immediately with a failure code
    }
};
