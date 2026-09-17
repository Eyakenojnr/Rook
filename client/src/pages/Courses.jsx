import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import RookIcon from '../components/RookIcon.jsx';
import { Search, User, ChevronLeft, ChevronRight, AlertCircle, BookOpen, RefreshCw } from 'lucide-react';


const Courses = () => {
	const { isInstructor } = useAuth();

	const [courses, setCourses] = useState([]);
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 6,
		totalCourses: 0,
		totalPages: 1,
	});

	const [search, setSearch] = useState('');
	const [searchInput, setSearchInput] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Fetch courses from the backend
	const fetchCourses = useCallback(async (pageToFetch = 1, searchQuery = '') => {
		setLoading(true);
		setError(null);

		try {
			const response = await api.get('/courses', {
				params: {
					page: pageToFetch,
					limit: 6,
					search: searchQuery || undefined,
				},
			});

			const { courses: fetchedCourses, pagination: paginationData } = response.data.data;
			setCourses(fetchedCourses);
			setPagination(paginationData);
		} catch (err) {
			setError(
				err.response?.data?.message || 'Failed to retrieve courses. Please try again.'
			);
		} finally {
			setLoading(false);
		}
	}, []);

	// Fetch when page or committed search changes
	useEffect(() => {
		fetchCourses(pagination.page, search);
	}, [fetchCourses, pagination.page, search]);

	// Handle search submission
	const handleSearchSubmit = (e) => {
		e.preventDefault();
		setPagination((prev) => ({ ...prev, page: 1 }));
		setSearch(searchInput.trim());
	};

	// Reset search
	const handleClearSearch = () => {
		setSearchInput('');
		setSearch('');
		setPagination((prev) => ({ ...prev, page: 1 }));
	};

	// Format price (display 0 or 0.00 as Free)
	const formatPrice = (price) => {
		const num = parseFloat(price);
		if (isNaN(num) || num === 0) return 'Free';
		return `$${num.toFixed(2)}`;
	};

	return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Course Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore verified curricula and track your certification progress
          </p>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by course title..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition shrink-0"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-xs text-slate-500 dark:text-slate-400 hover:underline shrink-0"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchCourses(pagination.page, search)}
            className="flex items-center gap-1 font-medium hover:underline text-xs shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-pulse space-y-4"
            >
              <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
              <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        /* Empty Results State */
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            No courses found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {search
              ? `No published courses match your query "${search}". Try different keywords.`
              : 'There are currently no published courses available. Check back soon!'}
          </p>
          {search && (
            <button
              onClick={handleClearSearch}
              className="mt-4 px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition"
            >
              Reset Search
            </button>
          )}
        </div>
      ) : (
        /* Course Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Header */}
                <div className="relative h-44 bg-gradient-to-br from-indigo-500/10 via-slate-100 to-indigo-500/5 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border-b border-slate-100 dark:border-slate-800 overflow-hidden">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400 dark:text-slate-500">
                      <RookIcon className="w-10 h-10 stroke-[1.5]" />
                      <span className="text-[11px] font-medium tracking-wider uppercase">
                        Curriculum
                      </span>
                    </div>
                  )}

                  {/* Price Badge */}
                  <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white shadow-xs backdrop-blur-xs border border-slate-200/50 dark:border-slate-700/50">
                    {formatPrice(course.price)}
                  </span>
                </div>

                {/* Course Metadata */}
                <div className="p-5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[130px]">
                    {course.instructor?.name || 'Instructor'}
                  </span>
                </div>

                <Link
                  to={`/courses/${course.id}`}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                >
                  View Course &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && pagination.totalPages > 1 && (
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing Page <span className="font-semibold">{pagination.page}</span> of{' '}
            <span className="font-semibold">{pagination.totalPages}</span> ({pagination.totalCourses} courses)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
              disabled={pagination.page <= 1}
              className="p-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))
              }
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;