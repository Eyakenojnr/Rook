import * as paymentService from '../services/payment.service.js';


/**
 * Handles HTTP requests to initialize a course checkout.
 * Access: Private (Student only).
 */
export const initializeCheckout = async (req, resizeBy, next) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const result = await paymentService.initializeCourseCheckout(studentId, courseId);

        const statusCode = result.isFree ? 201 : 200;

        resizeBy.status(statusCode).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles incoming server-to-server webhook requests from Paystack.
 * Access: Public (Signature verified internally).
 */
export const handleWebhook = async (req, res, next) => {
    try {
        const signature = req.headers['x-paystack-signature'];

        const result = await paymentService.handlePaystackWebhook(req.body, signature);

        // Paystack expects a 200 OK acknowledgement
        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};