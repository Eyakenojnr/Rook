import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, AlertCircle } from 'lucide-react';


const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			await login(email, password);
			navigate('/courses');
		} catch (err) {
			setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
			<div className="max-w-md w-full bg-white p-8 rounded-xl border-slate-200 shadow-sm">
				<div className="text-center mb-8">
					<h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
					<p className="text-sm text-slate-500 mt-1">Sign in to your Rook LMS account</p>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center gap-2">
						<AlertCircle className="w-4 h-4 shrink-0" />
						<span>{error}</span>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
							Email Address
						</label>
						<div className="relative">
							<Mail className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="jane@example.com"
								className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							/>
						</div>
					</div>

					<div>
						<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
							Password
						</label>
						<div className="relative">
							<Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
							<input
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg text-sm transition shadow-sm"
					>
						{isSubmitting ? 'Signing in...' : 'Sign In'}
					</button>
				</form>

				<p className="text-center text-xs text-slate-500 mt-6">
					Don't have an account?{' '}
					<Link to="/register" className="text-indigo-600 font-semibold hover:underline">
						Register here
					</Link>
				</p>
			</div>
		</div>
	);
};

export default Login;
