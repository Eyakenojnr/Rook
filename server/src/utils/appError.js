/**
 * Custom Operational Error Class
 * Extends the native JS Error to include HTTP status codes and operational flags.
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;  // Identify this as a trusted, anticipated  operational error

        // Capture the stack trace, excluding this constructor call from the trace
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
