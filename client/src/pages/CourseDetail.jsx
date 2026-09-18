import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
	Play,
	CheckCircle,
	Lock,
	Award,
	FileText,
	AlertCircle,
	ArrowLeft,
	ExternalLink,
	X,
	User,
} from 'lucide-react';


const CourseDetail = () => {
	const { id: courseId } = useParams();
	const navigate = useNavigate();
	const { user, isAuthenticated, isStudent, isInstructor } = useAuth();

	const [course, setCourse] = useState(null);
	const [activeLesson, setActiveLesson] = useState(null);
	const [isEnrolled, setIsEnrolled] = useState(false);
	const [progress, setProgress] = useState({
		progressPercentage: 0,
		completedLessonIds: [],
		totalLessons: 0,
	});

	const [loading, setLoading] = useState(true);
	const [enrolling, setEnrolling] = useState(false);
	const [completing, setCompleting] = useState(false);
	const [errorBanner, setErrorBanner] = useState(null);
	const [issuedCertificate, setIssuedCertificate] = useState(null);

	// Backend base host for static certificate downloads
	const backendBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';

	// Fetch course details and check active enrollment
	const loadCourseData = useCallback(async () => {
		setLoading(true);
		setErrorBanner(null);

		try {
			// Fetch course details & syllabus
			const courseRes = await api.get(`/courses/${courseId}`);
			const courseData = courseRes.data.data.course;
			setCourse(courseData);

			// Default active lesson to the first lesson of the module
			if (courseData.modules?.[0]?.lessons?.[0]) {
				setActiveLesson(courseData.modules[0].lessons[0]);
			}

			// Check enrollment if logged in as a student
			if (isAuthenticated && isStudent) {
				try {
					const progressRes = await api.get(`/courses/${courseId}/progress`);
					const progressData = progressRes.data.data;
					setProgress({
						progressPercentage: Number(progressData.progressPercentage || 0),
						completedLessonIds: progressData.completedLessonIds || [],
						totalLessons: Number(progressData.totalLessons || 0),
					});
					setIsEnrolled(true);
				} catch (progressErr) {
					// 403: Student is not yet enrolled
					if (progressErr.response?.status === 403) {
						setIsEnrolled(false);
					}
				}
			}
		} catch (err) {
			setErrorBanner(err.response?.data?.message || 'Failed to load course syllabus.');
		} finally {
			setLoading(false);
		}
	}, [courseId, isAuthenticated, isStudent]);

	useEffect(() => {
		loadCourseData();
	}, [loadCourseData]);

	// Handle course enrollment
	const handleEnroll = async () => {
		if (!isAuthenticated) {
			navigate('/login');
			return;
		}

		setEnrolling(true);
		setErrorBanner(null);

		try {
			await api.post(`/courses/${courseId}/enroll`, {});
			setIsEnrolled(true);

			// Fetch progress and refreshed syllabus concurrently without unmounting into loading skeleton
			const [refreshedCourseRes, progressRes] = await Promise.all([
				api.get(`/courses/${courseId}`),
				api.get(`/courses/${courseId}/progress`),
			]);

			const refreshedCourse = refreshedCourseRes.data.data.course;
			setCourse(refreshedCourse);

			const progressData = progressRes.data.data;
			setProgress({
				progressPercentage: Number(progressData.progressPercentage || 0),
				completedLessonIds: progressData.completedLessonIds || [],
				totalLessons: Number(progressData.totalLessons || 0),
			});

			// Update active lesson with unlocked video URL
			if (refreshedCourse.modules?.[0]?.lessons[0]) {
				setActiveLesson(refreshedCourse.modules[0].lessons[0]);
			}
		} catch (err) {
			setErrorBanner(err.response?.data?.message || 'Enrollment failed. Please try again.');
		} finally {
			setEnrolling(false);
		}
	};

	// Handle marking Lesson as Complete (Sequential Locking aware)
	const handleCompleteLesson = async () => {
		if (!activeLesson) return;

		setCompleting(true);
		setErrorBanner(null);

		try {
			const response = await api.post(`/lessons/${activeLesson.id}/complete`);
			const payload = response.data.data.progress?.progressPercentage !== undefined
				? response.data.data.progress
				: response.data.data;

			const courseCompleted = payload.courseCompleted;
			const progressPercentage = Number(payload.progressPercentage || 0);
			const certificate = payload.certificate;

			// Update local progress state
			setProgress((prev) => ({
				...prev,
				progressPercentage,
				completedLessonIds: Array.from(new Set([...prev.completedLessonIds, activeLesson.id])),
			}));

			// Trigger celebration modal if completed
			if (courseCompleted && certificate) {
				setIssuedCertificate(certificate);
			}
		} catch (err) {
			// Catch Sequential Locking violations (400 Bad Request)
			setErrorBanner(
				err.response?.data?.message || 'Failed to complete lesson. Please verify requirements.'
			);
		} finally {
			setCompleting(false);
		}
	};

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 dark:text-slate-400">
        <div className="animate-pulse space-y-4 max-w-xl mx-auto">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2 mx-auto" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl mt-8" />
        </div>
      </div>
		);
	}

	if (!course) {
		return (
			<div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course Not Found</h2>
        <Link to="/courses" className="text-indigo-600 dark:text-indigo-400 mt-2 inline-block">
          &larr; Back to Catalog
        </Link>
      </div>
		);
	}

	const isCurrentLessonCompleted = activeLesson && progress.completedLessonIds.includes(activeLesson.id);

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Top Breadcrumb & Return Link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>

        {isInstructor && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Instructor View Mode
          </span>
        )}
      </div>

			{/* Global error alert */}
			{errorBanner && (
				<div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
						<span>{errorBanner}</span>
					</div>
					<button onClick={() => setErrorBanner(null)} className='p-1 hover:opacity-75'>
						<X className='w-4 h-4' />
					</button>
				</div>
			)}

			{/* Course header & Progress strip */}
			<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {course.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {course.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <User className="w-3.5 h-3.5" />
              <span>Taught by {course.instructor?.name || 'Instructor'}</span>
            </div>
          </div>

          {/* Action / Progress Box */}
          <div className="shrink-0 flex flex-col items-start md:items-end justify-center min-w-[220px]">
            {!isEnrolled ? (
              <div className="space-y-2 w-full md:w-auto">
                <button
                  onClick={handleEnroll}
                  disabled={enrolling || isInstructor}
                  className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-xs transition"
                >
                  {enrolling ? 'Enrolling...' : isInstructor ? 'Instructor Access' : 'Enroll in Course'}
                </button>
                {!isAuthenticated && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                    Requires free registration
                  </p>
                )}
              </div>
						) : (
							<div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Progress</span>
                  <span>{progress.progressPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress.progressPercentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
                  {progress.completedLessonIds.length} of {progress.totalLessons} lessons completed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

			{/* Main two-column stage */}
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				{/* Left Column: Lesson player & Content stage (65%) */}
				<div className='lg:col-span-2 space-y-6'>
					{activeLesson ? (
						<div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs'>
							{/* Media viewing window */}
							<div className='relative aspect-video bg-slate-950 flex items-center justify-center border-b border-slate-200 dark:border-slate-800'>
								{isEnrolled || isInstructor ? (
									activeLesson.videoUrl ? (
										<video
											key={activeLesson.videoUrl}
											controls
											className='w-full h-full object-contain'
											src={activeLesson.videoUrl}
										>
											Your browser does not support HTML5 video streaming.
										</video>
									) : (
										<div className="text-center p-6 text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-60" />
                      <p className="text-sm font-medium">Text-Based Reading Lesson</p>
                    </div>
									)
								) : (
									/* Locked state for non-enrolled visitors */
									<div className='text-center p-8 space-y-3'>
										<Lock className='w-10 h-10 text-slate-500 mx-auto' />
										<p className='text-sm text-slate-300 font-medium'>
											Lecture content is protected
										</p>
										<button
											onClick={handleEnroll}
											className='px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition'
										>
											Enroll to Access
										</button>
									</div>
								)}
							</div>

							{/* Lesson text & Actions */}
							<div className='p-6 sm:p-8'>
								<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
									<div>
										<span className='text-xs font-semi-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400'>
											Lesson {activeLesson.orderIndex}
										</span>
										<h2 className='text-xs font-bold text-slate-900 dark:text-white mt-0.5'>
											{activeLesson.title}
										</h2>
									</div>

									{/* Complete lesson action */}
									{isEnrolled && (
										<button
											onClick={handleCompleteLesson}
											disabled={completing || isCurrentLessonCompleted}
											className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
												isCurrentLessonCompleted
													? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
													: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
											}`}
										>
											<CheckCircle className="w-4 h-4" />
											{isCurrentLessonCompleted
												? 'Completed'
												: completing
												? 'Recording...'
												: 'Mark as Complete'}
										</button>
									)}
								</div>

								{/* Lecture notes */}
								<div className="border-t border-slate-100 dark:border-slate-800 pt-6">
									<h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
										Lecture Notes
									</h4>
									<div className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
										{activeLesson.content || 'No written lecture notes provided for this lesson.'}
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              Select a lesson from the syllabus to begin learning.
            </div>
					)}
				</div>

				{/* Right Column: Syllabus curriculum sidebar (35%) */}
				<div className='space-y-4'>
					<div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs'>
						<h3 className='text-sm font-bold text-slate-900 dark:text-white mb-4'>
							Curriculum Syllabus
						</h3>

						{course.modules?.length === 0 ? (
							<p className='text-xs text-slate-400'>No modules added to this course yet.</p>
						) : (
							<div className="space-y-4">
                {course.modules.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-2">
                      {module.title}
                    </div>

                    <div className="space-y-1">
                      {module.lessons?.map((lesson) => {
												const isCompleted = progress.completedLessonIds.includes(lesson.id);
												const isActive = activeLesson?.id === lesson.id;

												return (
													<button
                            key={lesson.id}
                            onClick={() => setActiveLesson(lesson)}
                            className={`w-full text-left p-3 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                              isActive
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate mr-2">
															{isCompleted ? (
																<CheckCircle className='w-4 h-4 text-emerald-500 shrink-0' />
															) : isEnrolled || isInstructor ? (
																<Play className='w-3.5 h-3.5 text-slate-400 shrink-0' />
															) : (
																<Lock className='w-3.5 h-3.5 text-slate-400 shrink-0' />
															)}
															<span className='truncate'>{lesson.title}</span>
														</div>

														<span className='text-[10px] text-slate-400 shrink-0'>
															#{lesson.orderIndex}
														</span>
													</button>
												);
											})}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ========================================================= */}
      {/*       Automated Certificate Celebration Modal             */}
      {/* ========================================================= */}
      {issuedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 sm:p-8 text-center shadow-xl space-y-5">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
              <Award className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Course Completed!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You have finished all requirements for <span className="font-semibold text-slate-700 dark:text-slate-300">"{course.title}"</span>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              Your official PDF certificate of completion has been compiled and saved.
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={`${backendBaseUrl}${issuedCertificate.certificateUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <span>View & Download Certificate</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setIssuedCertificate(null)}
                className="w-full py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;