import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';


// Temporary placeholder for courses catalog
const CoursesPlaceholder = () => (
  <div className="max-w-7xl mx-auto px-4 py-16 text-center">
  	<h1 className="text-3xl font-bold text-slate-900">Courses Catalog</h1>
    <p className="text-slate-500 mt-2">Coming soon</p>
  </div>
);

console.log('Component audit:', { Router, Routes, Route, Navigate, Navbar, Login, Register });

function App() {
	return (
		<Router>
			<div className='min-h-screen bg-slate-50 font-sans antialiased text-slate-900'>
				<Navbar />
				<main>
					<Routes>
						<Route path="/" element={<Navigate to="/courses" replace />} />
						<Route path="/courses" element={<CoursesPlaceholder />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route path="*" element={<Navigate to="/courses" replace />} />
					</Routes>
				</main>
			</div>
		</Router>
	);
}

export default App;
