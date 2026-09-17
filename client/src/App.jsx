import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import Courses from './pages/Courses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';


function App() {
	return (
		<Router>
			<div className='min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200'>
				<Navbar />
				<main>
					<Routes>
						<Route path="/" element={<Navigate to="/courses" replace />} />
						{/* Live course catalog route */}
						<Route path="/courses" element={<Courses />} />
						{/* Course detail / Learning player route */}
						<Route path='/courses/:id' element={<CourseDetail />} />
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
