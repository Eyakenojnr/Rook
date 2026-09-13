import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Mail, Lock, GraduationCap, Briefcase, AlertCircle } from 'lucide-react';


const Register = () => {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState('STUDENT');
	const [error, setError] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { register } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);

		if (password.length < 8) {
			setError('Password must be at least 8 characters long.');
			return;
		}

		setIsSubmitting(true);
		try {
			await register(name, email, password, role);
			navigate('/courses');
		} catch (err) {
			setError(err.response?.data?.message || 'Registration failed. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
			<div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
				<div className="text-center mb-6">
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create your account</h2>
					<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start learning or teaching on Rook LMS</p>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-lg text-sm flex items-center gap-2">
						<AlertCircle className="w-4 h-4 shrink-0" />
						<span>{error}</span>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Account Role Selector */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
							I want to join as a
						</label>
						<div className="grid grid-cols-2 gap-3">
							<button
								type="button"
								onClick={() => setRole('STUDENT')}
								className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition ${
									role === 'STUDENT'
										? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-30'
										: 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:slate-600 dark:hover:bg-slate-800/40'
								}`}
							>
								<GraduationCap className="w-4 h-4" />
								<span>Student</span>
							</button>
							<button
								type="button"
								onClick={() => setRole('INSTRUCTOR')}
								className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition ${
									role === 'INSTRUCTOR'
										? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
										: 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/40'
								}`}
							>
								<Briefcase className="w-4 h-4" />
								<span>Instructor</span>
							</button>
						</div>
					</div>

					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
							Full Name
						</label>
						<div className="relative">
							<User className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
							<input
								type="text"
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Jane Doe"
								className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition"
							/>
						</div>
					</div>

					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
							Email Address
						</label>
						<div className="relative">
							<Mail className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="jane@example.com"
								className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition"
							/>
						</div>
					</div>

					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
							Password (min. 8 characters)
						</label>
						<div className="relative">
							<Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
							<input
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-indigo-400 dark:disabled:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition shadow-sm mt-2"
					>
						{isSubmitting ? 'Creating account...' : 'Create Account'}
					</button>
				</form>

				<p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
					Already have an account?{' '}
					<Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
};

export default Register;
