import crypto from 'crypto';
import { db } from '../config/db.js';
import AppError from '../utils/appError.js';
import * as progressService from './progress.service.js';


/**
 * Initializes a course checkout session.
 * If the course is free, enrolls the student immediately.
 * If paid, calls Paystack API and generates an authorization checkout URL.
 */
export const initializeCourseCheckout = async (studentId, courseId) => {
    // Fetch course details
    const course = await db.course.findUnique({
        where: { id: parseInt(courseId) },
        select: {
            id: true,
            title: true,
            price: true,
            isPublished: true,
        },
    });

    if (!course) {
        throw new AppError('Course not found.', 404);
    }

    if (!course.isPublished) {
        throw new AppError('Access denied. You cannot purchase an unpublished course.', 403);
    }

    // Fetch student details
    const student = await db.user.findUnique({
        where: { id: studentId },
        select: { id: true, email: true, name: true },
    });

    if (!student) {
        throw new AppError('Student profile not found.', 404);
    }

    // Verify the student is not already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
        where: {
            studentId_courseId: {
                studentId,
                courseId: course.id,
            },
        },
    });

    if (existingEnrollment) {
        throw new AppError('You are already enrolled in this course.', 400);
    }

    const numericPrice = Number(course.price);

    // Handle free courses (price <= 0): Enroll immediately
    if (numericPrice <= 0) {
        const enrollment = await progressService.enrollInCourse(studentId, course.id);
        return {
            isFree: true,
            message: 'Enrolled successfully in free course.',
            enrollment,
        };
    }

    // Handle paid courses: Paystack expects amount in Kobo
    const amountInKobo = Math.round(numericPrice * 100);

    // Generate unique traceable merchant refrence code
    const reference = `ROOK_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Call Paystack transaction initiialization API
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: student.email,
            amount: amountInKobo,
            reference,
            currency: 'NGN',
            callback_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/courses/${course.id}?payment=completed`,
            metadata: {
                studentId: student.id,
                courseId: course.id,
                courseTitle: course.title,
            },
        }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
        throw new AppError(`Paystack initialization failed: ${paystackData.message}`, 502);
    }

    // Record a PENDING payment for financial audit and tracking
    await db.payment.create({
        data: {
            reference,
            amount: course.price,
            currency: 'NGN',
            status: 'PENDING',
            studentId,
            courseId: course.id,
        },
    });

    return {
        isFree: false,
        authorizationUrl: paystackData.data.authorization_url,
        reference,
        accessCode: paystackData.data.access_code,
        amount: course.price,
        currency: 'NGN',
    };
};

/**
 * Handles incoming Paystack Webhook events with cryptographic signature verification.
 * Enforces atomic idempotency using PostgreSQL transactions.
 */
export const handlePaystackWebhook = async (payload, signatureHeader) => {
    // Cryptographic HMAC SHA512 signature verification
    const calculatedHash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(payload))
        .digest('hex');

    if (calculatedHash !== signatureHeader) {
        throw new AppError('Invalid webhook signature. Security verification failed.', 401);
    }

    // Filter for charge.success event
    if (payload.event !== 'charge.success') {
        return { processed: false, reason: `Ignored event: ${payload.event}` };
    }

    const { reference, metadata } = payload.data;
    const studentId = parseInt(metadata?.studentId);
    const courseId = parseInt(metadata?.courseId);

    if (!reference || isNaN(studentId) || isNaN(courseId)) {
        throw new AppError('Webhook metadata missing student or course identifiers.', 422);
    }

    // Idempotency check
    const existingPayment = await db.payment.findUnique({
        where: { reference },
    });

    if (existingPayment && existingPayment.status === 'SUCCESS') {
        return { alreadyProcessed: true, reference };
    }

    // High-performance batch array transaction (single SQL pipeline)
    // Sends all queries to PostgreSQL in one atomic roundtrip
    const paymentQuery = existingPayment
        ? db.payment.update({
            where: { reference },
            data: { status: 'SUCCESS' },
          })
        : db.payment.create({
            data: {
                reference,
                amount: Number(payload.data.amount) / 100,
                currency: payload.data.currency || 'NGN',
                status:'SUCCESS',
                studentId,
                courseId,
            },
        });

    const enrollmentQuery = db.enrollment.upsert({
        where: {
            studentId_courseId: { studentId, courseId },
        },
        update: {},  // Already enrolled -> do nothing
        create: {
            studentId,
            courseId,
        },
    });

    // Execute both queries atomically in a single batch
    await db.$transaction([paymentQuery, enrollmentQuery]);

    return { success: true, reference, studentId, courseId };
};