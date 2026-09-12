import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { BookOpen, LogOut, User, PlusCircle } from 'lucide-react';


const Navbar = () => {
  const { user, isAuthenticated, isInstructor, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className='bg-white border-b border-slate-200 sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16 items-center'>
					{/* Brand Logo */}
					<Link to="/" className='flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight'>
						<BookOpen className='w-6 h-6' />
						<span>Rook LMS</span>
					</Link>

					{/* Navigation Links */}
					<div className='flex items-center gap-4'>
						<Link
							to='/courses'
							className='text-slate-600 hover:text-slate-900 font-medium text-sm transition'
						>
							Explore Courses
						</Link>

						{isAuthenticated ? (
							<div className='flex items-center gap-3'>
								{/* Role Badge */}
								<span
									className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
										isInstructor
											? 'bg-amber-100 text-amber-800 border border-amber-200'
											: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
									}`}
								>
									{user?.role}
								</span>

								{/* User Greeting */}
								<span className='text-sm font-medium text-slate-700 hidden sm:inline'>
									{user?.name}
								</span>

								{/* Logout Button */}
								<button
									onClick={logout}
									className='flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-rose-600 transition pl-2 border-l border-slate-200'
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
									className='text-slate-700 hover:text-indigo-600 text-sm font-medium px-3 py-2 transition'
								>
									Sign In
								</Link>
								<Link
									to='/register'
									className='bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition'
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
