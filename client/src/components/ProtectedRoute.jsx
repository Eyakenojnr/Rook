import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';


/**
 * Route guard that requires authentication.
 * Redirects unauthenticated visitors to /login.
 */
const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return null;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace/>
};

export default ProtectedRoute;