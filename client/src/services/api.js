import axios from 'axios';


// Configured Axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request Interceptor: Injects JWT token automatically
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('rook_token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Response Interceptor: Handles expired sessions globally
api.interceptors.response.use(
	(response) => response,
	(error) => {
		// If backend returns 401 Unauthorized, clear stored credentials
		if (error.response && error.response.status === 401) {
			localStorage.removeItem('rook_token');
			localStorage.removeItem('rook_user');
			// If we aren't on the login page, redirect the user
			if (window.location.pathname !== '/login') {
				window.location.href = '/login';
			}
		}
		return Promise.reject(error);
	}
);

export default api;
