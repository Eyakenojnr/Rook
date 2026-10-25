import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import AppError from '../utils/appError.js';


/**
 * Changes a user's password after verifying their current password
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
	// Fetch user with password hash
	const user = await db.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		throw new AppError('User not found.', 404);
	}

	// Verify current password
	const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
	if (!isMatch) {
		throw new AppError('Current password is incorrect.', 400);
	}

	// Validate new password length and difference
	if (newPassword.length < 8) {
		throw new AppError('New must be at least 8 characters long.', 422);
	}

	if (currentPassword === newPassword) {
		throw new AppError('New password must be different from current password.', 400);
	}

	// Hash new password and save
	const newHash = await bcrypt.hash(newPassword, 12);
	await db.user.update({
		where: { id: userId },
		data: { passwordHash: newHash },
	});

	return { message: 'Password updated successfully.' };
};

/**
 * Fetches user's profile and comprehensive course dashboard.
 * Categorizes student courses into inProgress and completed.
 */
export const getUserProfileDashbooard = async (userId) => {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			createdAt: true,
		},
	});

	if (!user) {
		throw new AppError('User not found.', 404);
	}

	// If user is a STUDENT, fetch all enrolled courses and compute progress
	if (user.role === 'STUDENT') {
		const enrollments = await db.enrollment.findMany({
			where: { studentId: userId },
			include: {
				course: {
					select: {
						id: true,
						title: true,
						description: true,
						thumbnailUrl: true,
						price: true,
						instructor: { select: { id: true, name: true } },
						modules: {
							select: {
								lessons: { select: { id: true } },
							},
						},
					},
				},
				progresses: {
					where: { isCompleted: true },
					select: { lessonId: true },
				},
				certificate: {
					select: { id: true, certificateUrl: true, issuedAt: true },
				},
			},
			orderBy: { enrolledAt: 'desc' },
		});

		const coursesData = enrollments.map((enrollment) => {
			// Calculate total lessons in course
			const totalLessons = enrollment.course.modules.reduce(
				(sum, mod) => sum + mod.lessons.length,
				0
			);
			const completedLessonsCount = enrollment.progresses.length;
			const progressPercentage = 
				totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

			const isCompleted = progressPercentage === 100;

			return {
				enrollmentId: enrollment.id,
				enrolledAt: enrollment.enrolledAt,
				courseId: enrollment.course.id,
				title: enrollment.course.title,
				description: enrollment.course.description,
				thumbnailUrl: enrollment.course.thumbnailUrl,
				instructor: enrollment.course.instructor,
				totalLessons,
				completedLessonsCount,
				progressPercentage,
				isCompleted,
				certificate: enrollment.certificate || null,
			};
		});

		const inProgressCourses = coursesData.filter((c) => !c.isCompleted);
		const completedCourses = coursesData.filter((c) => c.isCompleted);

		return {
			user,
			stats: {
				totalEnrolled: coursesData.length,
				inProgressCount: inProgressCourses.length,
				completedCount: completedCourses.length,
			},
			courses: {
				all: coursesData,
				inProgress: inProgressCourses,
				completed: completedCourses,
			},
		};
	}

	// If user is an INSTRUCTOR, fetch their created courses
	const createdCourses = await db.course.findMany({
		where: { instructorId: userId },
		select: {
			id: true,
			title: true,
			price: true,
			isPublished: true,
			createdAt: true,
			_count: { select: { enrollments: true } },
		},
		orderBy: { createdAt: 'desc' },
	});

	return {
		user,
		stats: {
			totalCreatedCourses: createdCourses.length,
			publishedCount: createdCourses.filter((c) => c.isPublished).length,
			totalStudentsEnrolled: createdCourses.reduce((sum, c) => sum + c._count.enrollments, 0),
		},
		courses: createdCourses,
	};
};