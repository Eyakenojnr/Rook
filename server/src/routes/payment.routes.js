import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';


const router = Router();

/**
 * @route   POST /api/v1/courses/:courseId/checkout
 * @desc    Initialize a course purchase session (or free enrollment)
 * @access  Private (Students only)
 */
router.post(
    '/courses/:courseId/checkout',
    protect,
    restrictTo('STUDENT'),
    paymentController.initializeCheckout
);

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Receive and process verified Paystack charge webhooks
 * @access  Public (Signature validated via HMAC SHA512)
 */
router.post('/payments/webhook', paymentController.handleWebhook);

export default router;