import { createContext, useContext, useState, useEffect } from "react";
import api from '../services/api.js';


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Rehydrate auth state on initial app load
    useEffect(() => {
        const storedToken = localStorage.getItem('rook_token');
        const storedUser = localStorage.getItem('rook_user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (err) {
                console.error('Failed to parse stored user data:', err);
                localStorage.removeItem('rook_token');
                localStorage.removeItem('rook_user');
            }
        }
        setLoading(false);
    }, []);

    // Login handler
    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user: userData, token: jwtToken } = response.data.data;

        setUser(userData);
        setToken(jwtToken);

        localStorage.setItem('rook_token', jwtToken);
        localStorage.setItem('rook_user', JSON.stringify(userData));

        return userData;
    };

    // Register handler
    const register = async (name, email, password, role) => {
        const response = await api.post('/auth/register', { name, email, password, role });
        const { user: userData, token: jwtToken } = response.data.data;

        setUser(userData);
        setToken(jwtToken);

        localStorage.setItem('rook_token', jwtToken);
        localStorage.setItem('rook_user', JSON.stringify(userData));

        return userData;
    };

    // Logout handler
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('rook_token');
        localStorage.removeItem('rook_user');
        window.location.href = '/login';
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token,
        isIntructor: user?.role === 'INSTRUCTOR',
        isStudent: user?.role === 'STUDENT',
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for consuming auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProider');
    }
    return context;
};
