import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import GuestRoute from './components/GuestRoute.jsx';


// Temporary placeholder for courses catalog
const CoursesPlaceholder = () => (
  <div className="max-w-7xl mx-auto px-4 py-16 text-center">
  	<h1 className="text-3xl font-bold text-slate-900 dark:text-white">Courses Catalog</h1>
    <p className="text-slate-500 dark:text-slate-400 mt-2">Coming soon</p>
  </div>
);

function App() {
	return (
		<Router>
			<div className='min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200'>
				<Navbar />
				<main>
					<Routes>
						<Route path="/" element={<Navigate to="/courses" replace />} />
						<Route path="/courses" element={<CoursesPlaceholder />} />
						{/* Guest-only routes: Authenticated users will be redirected to /courses */}
						<Route element={<GuestRoute />}>
							<Route path="/login" element={<Login />} />
							<Route path="/register" element={<Register />} />
						</Route>
						<Route path="*" element={<Navigate to="/courses" replace />} />
					</Routes>
				</main>
			</div>
		</Router>
	);
}

export default App;
