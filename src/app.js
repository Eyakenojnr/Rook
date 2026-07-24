import express from 'express';
import cors from 'cors';
import morgan from 'morgan';


const app = express();

// Global Middlewares
app.use(cors());
app.use(morgan('dev'));  // HTTP request logger
app.use(express.json());  // Parse incoming JSON request bodies
app.use(express.urlencoded({ extended: true }));  // Parse incoming URL-encoded form data

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'LMS API is running and healthy.',
        timestamp: new Date().toISOString(),
    });
});

// 404 Route handler (runs if no route match the request)
app.use((req, res, next) => {
    const error = new Error(`Route not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// Global Error Handling middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,  // Never leak stack traces to the public in prod.
    });
});

export default app;
