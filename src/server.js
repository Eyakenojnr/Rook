import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    // Verify DB connection before starting the HTTP sevrer
    await connectDatabase();

    const server = app.listen(PORT, () => {
        console.log(`Server is running in ${process.env.NODE_ENV || 
            'development'} mode on port ${PORT}`);
    });

    // Shutdown handler gracefully. This ensures requests finish before process terminates
    const gracefulShutdown = (signal) => {
        console.log(`Received ${signal}. Starting graceful shutdown...`);
        server.close(async () => {
            console.log('HTTP server closed. Exiting...');
            process.exit(0);
        });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));  // Handled during cloud deployment
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));  // When pressing Ctrl+C

};

startServer();
