import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';


/**
 * GuestRoute Guard:
 *  Bloks authenticated users from accessing guest-only routes (/login & /register) and
 *  redirects them to courses catalog.
 */
const GuestRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    // Wait until AuthContext finishes reading localStorage on initial load
    // - Prevents accidental flash of redirect while the app checks for a token
    if (loading) {
        return null;
    }

    // If user is already logged in, redirect them to /courses
    if (isAuthenticated) {
        return <Navigate to="/courses" replace />;
    }

	// Otherwise, render the requested guest page (Login or Register)
	return <Outlet />;
};

export default GuestRoute;