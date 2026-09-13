import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { BookOpen, LogOut, Sun, Moon } from 'lucide-react';


const Navbar = () => {
  const { user, isAuthenticated, isInstructor, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className='bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16 items-center'>
					{/* Brand Logo */}
					<Link to="/" className='flex items-center gap-2 text-indigo-600 dark:text-indigo-600 dark:text-indigo-400 font-bold text-xl tracking-tight'>
						<BookOpen className='w-6 h-6' />
						<span>Rook LMS</span>
					</Link>

					{/* Right Hand Navigation & Theme Control */}
					<div className='flex items-center gap-4 sm:gap-4'>
						<Link
							to='/courses'
							className='text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-sm transition'
						>
							Explore Courses
						</Link>

						{/* Dark/Light mode toggle button */}
						<button
							onClick={toggleTheme}
							aria-label='Toggle theme'
							className='p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition'
						>
							{isDark ? <Sun className='w-4 h-4 text-amber-400' /> : <Moon className='w-4 h-4 text-slate-600' />}
						</button>

						{isAuthenticated ? (
							<div className='flex items-center gap-3'>
								{/* Role Badge */}
								<span
									className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
										isInstructor
											? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
											: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
									}`}
								>
									{user?.role}
								</span>

								{/* User Greeting */}
								<span className='text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:inline'>
									{user?.name}
								</span>

								{/* Logout Button */}
								<button
									onClick={logout}
									className='flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition pl-2 border-l border-slate-200 dark:border-slate-800'
									title='Sign out'
								>
									<LogOut className='w-4 h-4' />
									<span className='hidden sm:inline'>Logout</span>
								</button>
							</div>
						) : (
							<div className='flex items-center gap-2'>
								<Link
									to="/login"
									className='text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium px-3 py-2 transition'
								>
									Sign In
								</Link>
								<Link
									to='/register'
									className='bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm'
								>
									Register
								</Link>
							</div>
						)}
					</div>
				</div>
      </div>
    </nav>
  );
};

export default Navbar;
