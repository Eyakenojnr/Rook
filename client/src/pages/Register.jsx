import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, GraduationCap, Briefcase, AlertCircle, Eye, EyeOff } from 'lucide-react';


const NAME_REGEX = /^[a-zA-Z'-]+$/;

const Register = () => {
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [otherName, setOtherName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [role, setRole] = useState('STUDENT');
	const [error, setError] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { register } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);

		// Client-side name validation (strictly rejects symbols/numbers)
		if (!NAME_REGEX.test(firstName.trim())) {
			setError('First name must contain only letters, hyphens, or apostrophes (no numbers or symbols).');
			return;
		}

		if (!NAME_REGEX.test(lastName.trim())) {
			setError('Last name must contain only letters, hyphens, or apostrophes (no numbers or symbols).');
			return;
		}

		if(otherName.trim() && !NAME_REGEX.test(otherName.trim())) {
			setError('Other name must contain only letters, hyphens, or apostrophes (no numbers or symbols).');
			return;
		}

		// Password validation
		if (password.length < 8) {
			setError('Password must be at least 8 characters long.');
			return;
		}

		setIsSubmitting(true);
		try {
			await register(
				{
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					otherName: otherName.trim() || undefined,
				},
				email.trim().toLowerCase(),
				password,
				role
			);

			// Navigate to login with success flash state
			navigate('/login', {
				replace: true,
				state: { successMessage: 'Account created successfully. Please sign in with your credentials.'},
			});
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
										? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
										: 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/40'
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

					{/* First name and Last name (side by side) */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
								First Name<span className="text-rose-500 font-bold text-sm leading-none ml-0.5">*</span>
							</label>
							<input
								type="text"
								required
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								placeholder="Jane"
								className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
						</div>
						<div>
							<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
								Last Name<span className="text-rose-500 font-bold text-sm leading-none ml-0.5">*</span>
							</label>
							<input
								type="text"
								required
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								placeholder="Doe"
								className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
						</div>
					</div>

					{/* Other name (optional) */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
							Other Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
						</label>
						<input
							type="text"
							value={otherName}
							onChange={(e) => setOtherName(e.target.value)}
							placeholder="Middle name"
							className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>

					{/* Email address */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
							Email Address<span className="text-rose-500 font-bold text-sm leading-none ml-0.5">*</span>
						</label>
						<div className="relative">
							<Mail className="w-4 h-4 text-slate-400 dark:text-slate-400 absolute left-3 top-3" />
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="jane@example.com"
								className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition"
							/>
						</div>
					</div>

					{/* Password with visibility toggle */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
							Password (min. 8 characters)<span className="text-rose-500 font-bold text-sm leading-none ml-0.5">*</span>
						</label>
						<div className="relative">
							<Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
							<input
								type={showPassword ? 'text' : 'password'}
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								className="w-full pl-9 pr-10 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition"
							/>
							<button
								type="button"
								onClick={() => setShowPassword((prev) => !prev)}
								className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
								aria-label={showPassword ? 'Hide password' : 'Show password'}
							>
								{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
							</button>
						</div>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-indigo-400 dark:disabled:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition shadow-sm mt-3 cursor-pointer"
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
